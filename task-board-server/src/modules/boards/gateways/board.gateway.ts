import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CollaborationService } from '../../gateway/collaboration.service';
import { TaskLockService } from '../../redis/task-lock.service';
import { TaskLockPayload } from '../../redis/task-lock.types';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('BoardGateway');

    constructor(
        private readonly collaboration: CollaborationService,
        private readonly taskLocks: TaskLockService,
    ) {}

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        const user = this.collaboration.removeUser(client.id);
        if (user) {
            const boardsWithLocks = await this.taskLocks.releaseAllForUser(user.id);
            const notify = new Set<string>([...boardsWithLocks, user.boardId]);
            for (const bid of notify) {
                await this.broadcastUpdates(bid);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinBoard')
    async handleJoinBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { boardId: string; user: { id: string; name: string; color: string } },
    ) {
        const { boardId, user } = payload;
        client.join(boardId);
        this.collaboration.addUser(client.id, boardId, user);
        await this.broadcastUpdates(boardId);
    }

    @SubscribeMessage('leaveBoard')
    async handleLeaveBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { boardId: string; userId: string },
    ) {
        const { boardId, userId } = payload;
        client.leave(boardId);
        const u = this.collaboration.getBySocketId(client.id);
        if (u && u.id === userId) {
            this.collaboration.removeUser(client.id);
            await this.taskLocks.releaseLocksForUserOnBoard(userId, boardId);
        }
        await this.broadcastUpdates(boardId);
    }

    @SubscribeMessage('lockTask')
    async handleLockTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { taskId: string; boardId: string; userId: string; userName: string },
    ) {
        const ok = await this.taskLocks.tryAcquire(payload.taskId, payload.boardId, payload.userId, payload.userName);
        if (!ok) {
            client.emit('lockError', { message: 'Task is already being edited' });
            return;
        }
        await this.broadcastUpdates(payload.boardId);
    }

    @SubscribeMessage('unlockTask')
    async handleUnlockTask(@MessageBody() payload: { taskId: string; boardId: string; userId: string }) {
        await this.taskLocks.release(payload.taskId, payload.userId);
        await this.broadcastUpdates(payload.boardId);
    }

    @SubscribeMessage('renewTaskLock')
    async handleRenewTaskLock(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { taskId: string; boardId: string; userId: string },
    ) {
        const ok = await this.taskLocks.renew(payload.taskId, payload.userId);
        if (!ok) {
            client.emit('lockRenewFailed', { taskId: payload.taskId, boardId: payload.boardId });
            return;
        }
        await this.broadcastUpdates(payload.boardId);
    }

    private async broadcastUpdates(boardId: string) {
        const presence = this.collaboration.getUsersOnBoard(boardId);
        const locksRaw = await this.taskLocks.getLocksForBoard(boardId);
        const locks = locksRaw.map((l: TaskLockPayload) => ({
            taskId: l.taskId,
            userId: l.userId,
            userName: l.userName,
        }));
        this.server.to(boardId).emit('presenceUpdate', presence);
        this.server.to(boardId).emit('locksUpdate', locks);
    }

    notifyBoardUpdate(boardId: string, event: string, data: unknown) {
        this.server.to(boardId).emit(event, data);
    }
}
