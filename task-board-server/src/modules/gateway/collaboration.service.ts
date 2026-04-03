import { Injectable, Logger } from '@nestjs/common';

export interface PresenceUser {
    socketId: string;
    id: string;
    name: string;
    color: string;
    boardId: string;
}

export interface TaskLock {
    taskId: string;
    userId: string;
    userName: string;
    timestamp: number;
}

@Injectable()
export class CollaborationService {
    private readonly logger = new Logger(CollaborationService.name);

    private activeUsers = new Map<string, PresenceUser>(); // socketId -> User
    private taskLocks = new Map<string, TaskLock>(); // taskId -> Lock

    addUser(socketId: string, boardId: string, user: any) {
        this.activeUsers.set(socketId, { ...user, socketId, boardId });
        this.logger.log(`User registered: ${user.name} on board ${boardId}`);
    }

    removeUser(socketId: string) {
        const user = this.activeUsers.get(socketId);
        if (user) {
            this.activeUsers.delete(socketId);
            this.releaseLocksForUser(user.id);
            return user.boardId;
        }
        return null;
    }

    getUsersOnBoard(boardId: string): PresenceUser[] {
        return Array.from(this.activeUsers.values()).filter(u => u.boardId === boardId);
    }

    tryLockTask(taskId: string, userId: string, userName: string): boolean {
        const existingLock = this.taskLocks.get(taskId);
        if (existingLock && existingLock.userId !== userId) {
            return false;
        }

        this.taskLocks.set(taskId, {
            taskId,
            userId,
            userName,
            timestamp: Date.now()
        });
        return true;
    }

    unlockTask(taskId: string) {
        this.taskLocks.delete(taskId);
    }

    getAllLocks(): TaskLock[] {
        return Array.from(this.taskLocks.values());
    }

    private releaseLocksForUser(userId: string) {
        for (const [taskId, lock] of this.taskLocks.entries()) {
            if (lock.userId === userId) {
                this.taskLocks.delete(taskId);
            }
        }
    }
}
