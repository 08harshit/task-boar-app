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
import { CollaborationService } from './collaboration.service';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('BoardGateway');

    constructor(private readonly collaboration: CollaborationService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const boardId = this.collaboration.removeUser(client.id);
        if (boardId) {
            this.broadcastUpdates(boardId);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinBoard')
    handleJoinBoard(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { boardId: string, user: { id: string, name: string, color: string } },
    ) {
        const { boardId, user } = payload;
        client.join(boardId);
        this.collaboration.addUser(client.id, boardId, user);
        this.broadcastUpdates(boardId);
    }

    @SubscribeMessage('lockTask')
    handleLockTask(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { taskId: string, boardId: string, userId: string, userName: string },
    ) {
        const success = this.collaboration.tryLockTask(payload.taskId, payload.userId, payload.userName);
        if (!success) {
            client.emit('lockError', { message: 'Task is already being edited' });
            return;
        }
        this.broadcastUpdates(payload.boardId);
    }

    @SubscribeMessage('unlockTask')
    handleUnlockTask(@MessageBody() payload: { taskId: string, boardId: string }) {
        this.collaboration.unlockTask(payload.taskId);
        this.broadcastUpdates(payload.boardId);
    }

    private broadcastUpdates(boardId: string) {
        this.server.to(boardId).emit('presenceUpdate', this.collaboration.getUsersOnBoard(boardId));
        this.server.to(boardId).emit('locksUpdate', this.collaboration.getAllLocks());
    }

    // Notifier for Boards/Tasks mutations
    notifyBoardUpdate(boardId: string, event: string, data: any) {
        this.server.to(boardId).emit(event, data);
    }
}
