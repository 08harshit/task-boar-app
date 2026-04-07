import { Injectable, Logger } from '@nestjs/common';

export interface PresenceUser {
    socketId: string;
    id: string;
    name: string;
    color: string;
    boardId: string;
}

@Injectable()
export class CollaborationService {
    private readonly logger = new Logger(CollaborationService.name);

    private activeUsers = new Map<string, PresenceUser>();

    addUser(socketId: string, boardId: string, user: { id: string; name: string; color: string }) {
        this.activeUsers.set(socketId, { ...user, socketId, boardId });
        this.logger.log(`User registered: ${user.name} on board ${boardId}`);
    }

    /**
     * Removes presence for this socket. Returns the user row so the gateway can clear Redis locks.
     */
    removeUser(socketId: string): PresenceUser | null {
        const user = this.activeUsers.get(socketId);
        if (user) {
            this.activeUsers.delete(socketId);
            return user;
        }
        return null;
    }

    getBySocketId(socketId: string): PresenceUser | undefined {
        return this.activeUsers.get(socketId);
    }

    getUsersOnBoard(boardId: string): PresenceUser[] {
        return Array.from(this.activeUsers.values()).filter((u) => u.boardId === boardId);
    }
}
