import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { TaskLockPayload } from './task-lock.types';

/** Atomic unlock: delete only if ARGV[1] matches stored userId (Redis Lua cjson). */
const UNLOCK_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local data = cjson.decode(raw)
if data.userId ~= ARGV[1] then return 0 end
return redis.call('DEL', KEYS[1])
`;

/** Atomic renew TTL only if ARGV[1] matches stored userId. */
const RENEW_LUA = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local data = cjson.decode(raw)
if data.userId ~= ARGV[1] then return 0 end
return redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
`;

@Injectable()
export class TaskLockService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TaskLockService.name);
    private readonly redis: Redis;
    private readonly ttlSeconds: number;
    private readonly keyPrefix = 'lock:task:';

    /** Throttle noisy reconnect errors (same symptom logged at most once per interval). */
    private lastRedisErrorLogMs = Number.NEGATIVE_INFINITY;
    private readonly errorLogThrottleMs = 10_000;

    constructor(private readonly config: ConfigService) {
        const url = this.config.get<string>('REDIS_URL');
        if (!url) {
            throw new Error(
                'REDIS_URL is not set. Start Redis (e.g. docker compose up redis) and set REDIS_URL=redis://localhost:6379',
            );
        }
        this.ttlSeconds = Number(this.config.get('TASK_LOCK_TTL_SECONDS') ?? 30);
        this.redis = new Redis(url, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            /** First TCP happens on first command — pairs with ping retry in onModuleInit. */
            lazyConnect: true,
            connectTimeout: 30_000,
            /**
             * ioredis reconnect loop: keep backoff bounded so we do not tight-spin.
             * See: https://github.com/redis/ioredis#auto-reconnect
             */
            retryStrategy: (times: number) => Math.min(times * 500, 10_000),
        });
        this.redis.on('connect', () => this.logger.log(`Redis TCP connected (${this.maskRedisUrl(url)})`));
        this.redis.on('ready', () => this.logger.log('Redis ready to accept commands'));
        this.redis.on('error', (err: unknown) => this.logRedisError(err, url));
    }

    /** Logs a full diagnostic; many ioredis errors omit `.message`, which caused empty Nest log lines. */
    private logRedisError(err: unknown, configuredUrl: string): void {
        const now = Date.now();
        if (now - this.lastRedisErrorLogMs < this.errorLogThrottleMs) {
            return;
        }
        this.lastRedisErrorLogMs = now;

        const e = err as Error & { code?: string; errno?: string; syscall?: string; address?: string; port?: number };
        const detail =
            (typeof e?.message === 'string' && e.message.trim() !== '' ? e.message : null) ||
            [e?.code, e?.syscall, e?.address && e?.port !== undefined ? `${e.address}:${e.port}` : '']
                .filter(Boolean)
                .join(' ') ||
            (err !== null && err !== undefined ? JSON.stringify(err) : 'unknown error');

        let hint = '';
        if (detail.includes('ECONNREFUSED') && detail.includes('127.0.0.1')) {
            hint =
                ' If the API runs inside Docker, localhost is the container itself. Use REDIS_URL=redis://redis:6379 with the compose service name, or host.docker.internal on some setups.';
        } else if (detail.includes('EAI_AGAIN')) {
            hint =
                ' Temporary DNS failure — often fixed by `dns_search: []` on the api service (see docker-compose.yml), restarting Docker, or checking VPN/firewall.';
        }

        this.logger.error(`Redis client error: ${detail}.${hint} (configured: ${this.maskRedisUrl(configuredUrl)})`);
    }

    private maskRedisUrl(url: string): string {
        try {
            const u = new URL(url);
            if (u.password) u.password = '***';
            return u.toString();
        } catch {
            return 'invalid-url';
        }
    }

    /**
     * Warm up DNS + TCP while Docker's resolver/network settles (reduces EAI_AGAIN races at boot).
     */
    async onModuleInit(): Promise<void> {
        const maxAttempts = 24;
        const delayMs = 500;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.redis.ping();
                if (attempt > 1) {
                    this.logger.log(`Redis responded after ${attempt} ping attempts`);
                }
                return;
            } catch (err: unknown) {
                const detail = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Redis ping ${attempt}/${maxAttempts}: ${detail}`);
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
        throw new Error(
            `Redis unreachable after ${maxAttempts} attempts (~${(maxAttempts * delayMs) / 1000}s). ` +
                'Check Docker DNS, REDIS_URL, and that the redis service is healthy.',
        );
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit();
    }

    lockKey(taskId: string): string {
        return `${this.keyPrefix}${taskId}`;
    }

    /**
     * SET lock:task:{id} JSON NX EX ttl — returns true if this client holds the lock.
     */
    async tryAcquire(taskId: string, boardId: string, userId: string, userName: string): Promise<boolean> {
        const payload = {
            userId,
            userName,
            boardId,
            timestamp: Date.now(),
        };
        const ok = await this.redis.set(
            this.lockKey(taskId),
            JSON.stringify(payload),
            'EX',
            this.ttlSeconds,
            'NX',
        );
        return ok === 'OK';
    }

    async release(taskId: string, userId: string): Promise<boolean> {
        const n = await this.redis.eval(UNLOCK_LUA, 1, this.lockKey(taskId), userId);
        return Number(n) === 1;
    }

    async renew(taskId: string, userId: string): Promise<boolean> {
        const n = await this.redis.eval(RENEW_LUA, 1, this.lockKey(taskId), userId, String(this.ttlSeconds));
        return Number(n) === 1;
    }

    async getHolder(taskId: string): Promise<string | null> {
        const raw = await this.redis.get(this.lockKey(taskId));
        if (!raw) return null;
        try {
            const data = JSON.parse(raw) as { userId: string };
            return data.userId ?? null;
        } catch {
            return null;
        }
    }

    async getLocksForBoard(boardId: string): Promise<TaskLockPayload[]> {
        const keys = await this.scanKeys(`${this.keyPrefix}*`);
        if (keys.length === 0) return [];

        const pipeline = this.redis.pipeline();
        keys.forEach((k) => pipeline.get(k));
        const exec = await pipeline.exec();
        if (!exec) return [];

        const out: TaskLockPayload[] = [];
        for (let i = 0; i < keys.length; i++) {
            const [, raw] = exec[i];
            if (!raw || typeof raw !== 'string') continue;
            try {
                const data = JSON.parse(raw) as {
                    userId: string;
                    userName: string;
                    boardId: string;
                    timestamp?: number;
                };
                if (data.boardId !== boardId) continue;
                const taskId = keys[i].slice(this.keyPrefix.length);
                out.push({
                    taskId,
                    userId: data.userId,
                    userName: data.userName,
                    boardId: data.boardId,
                    timestamp: data.timestamp ?? Date.now(),
                });
            } catch {
                continue;
            }
        }
        return out;
    }

    /**
     * Remove every lock owned by userId (e.g. socket disconnect). Returns boardIds that had a lock cleared.
     */
    async releaseAllForUser(userId: string): Promise<string[]> {
        const keys = await this.scanKeys(`${this.keyPrefix}*`);
        const boardIds = new Set<string>();
        const toDelete: string[] = [];

        for (const key of keys) {
            const raw = await this.redis.get(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw) as { userId: string; boardId: string };
                if (data.userId === userId) {
                    toDelete.push(key);
                    boardIds.add(data.boardId);
                }
            } catch {
                continue;
            }
        }

        if (toDelete.length > 0) {
            await this.redis.del(...toDelete);
        }
        return [...boardIds];
    }

    async releaseLocksForUserOnBoard(userId: string, boardId: string): Promise<void> {
        const keys = await this.scanKeys(`${this.keyPrefix}*`);
        const toDelete: string[] = [];

        for (const key of keys) {
            const raw = await this.redis.get(key);
            if (!raw) continue;
            try {
                const data = JSON.parse(raw) as { userId: string; boardId: string };
                if (data.userId === userId && data.boardId === boardId) {
                    toDelete.push(key);
                }
            } catch {
                continue;
            }
        }

        if (toDelete.length > 0) {
            await this.redis.del(...toDelete);
        }
    }

    private async scanKeys(pattern: string): Promise<string[]> {
        const keys: string[] = [];
        let cursor = '0';
        do {
            const [next, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '128');
            cursor = next;
            keys.push(...batch);
        } while (cursor !== '0');
        return keys;
    }
}
