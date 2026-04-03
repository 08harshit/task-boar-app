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

interface PresenceUser {
    socketId: string;
    id: string;
    name: string;
    color: string;
    boardId: string;
}

interface TaskLock {
    taskId: string;
    userId: string;
    userName: string;
    timestamp: number;
}

@WebSocketGateway({
    cors: { origin: '*' },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('BoardGateway');

    // State management (In-memory for now, scalable with Redis later)
    private activeUsers = new Map<string, PresenceUser>(); // socketId -> User
    private taskLocks = new Map<string, TaskLock>(); // taskId -> Lock

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const user = this.activeUsers.get(client.id);
        if (user) {
            this.logger.log(`User ${user.name} disconnected`);
            this.activeUsers.delete(client.id);

            // Cleanup any locks held by this user
            this.releaseLocksForUser(user.id);

            // Notify remaining people on the board
            this.broadcastPresence(user.boardId);
            this.broadcastLocks(user.boardId);
        }
    }

    @SubscribeMessage('joinBoard')
    handleJoinBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { boardId: string, user: { id: string, name: string, color: string } },
    ) {
        const { boardId, user } = payload;
        this.logger.log(`User ${user.name} joined board: ${boardId}`);

        client.join(boardId);
        this.activeUsers.set(client.id, { ...user, socketId: client.id, boardId });

        // Notify room
        this.broadcastPresence(boardId);
        this.broadcastLocks(boardId);
    }

    @SubscribeMessage('lockTask')
    handleLockTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { taskId: string, boardId: string },
    ) {
        const user = this.activeUsers.get(client.id);
        if (!user) return;

        // Check if already locked
        const existingLock = this.taskLocks.get(payload.taskId);
        if (existingLock && existingLock.userId !== user.id) {
            client.emit('lockError', { message: 'Task is already being edited by another user' });
            return;
        }

        // Set lock
        this.taskLocks.set(payload.taskId, {
            taskId: payload.taskId,
            userId: user.id,
            userName: user.name,
            timestamp: Date.now()
        });

        this.broadcastLocks(payload.boardId);
    }

    @SubscribeMessage('unlockTask')
    handleUnlockTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { taskId: string, boardId: string },
    ) {
        const lock = this.taskLocks.get(payload.taskId);
        if (lock) {
            this.taskLocks.delete(payload.taskId);
            this.broadcastLocks(payload.boardId);
        }
    }

    private broadcastPresence(boardId: string) {
        const usersOnBoard = Array.from(this.activeUsers.values())
            .filter(u => u.boardId === boardId);
        this.server.to(boardId).emit('presenceUpdate', usersOnBoard);
    }

    private broadcastLocks(boardId: string) {
        const locks = Array.from(this.taskLocks.values());
        this.server.to(boardId).emit('locksUpdate', locks);
    }

    private releaseLocksForUser(userId: string) {
        for (const [taskId, lock] of this.taskLocks.entries()) {
            if (lock.userId === userId) {
                this.taskLocks.delete(taskId);
            }
        }
    }

    notifyBoardUpdate(boardId: string, event: string, data: any) {
        this.server.to(boardId).emit(event, data);
    }
}
