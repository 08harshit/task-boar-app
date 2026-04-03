import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface PresenceUser {
    socketId: string;
    id: string;
    name: string;
    color: string;
}

export interface TaskLock {
    taskId: string;
    userId: string;
    userName: string;
}

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;
    private boardUpdateSubject = new Subject<any>();
    private presenceSubject = new BehaviorSubject<PresenceUser[]>([]);
    private locksSubject = new BehaviorSubject<TaskLock[]>([]);

    constructor() {
        this.socket = io(environment.apiUrl);

        this.socket.on('connect', () => {
            console.log('Successfully connected to WebSocket server');
        });

        this.socket.on('board_updated', (data: any) => {
            this.boardUpdateSubject.next(data);
        });

        this.socket.on('presenceUpdate', (users: PresenceUser[]) => {
            this.presenceSubject.next(users);
        });

        this.socket.on('locksUpdate', (locks: TaskLock[]) => {
            this.locksSubject.next(locks);
        });
    }

    joinBoard(boardId: string, user: { id: string, name: string, color: string }) {
        this.socket.emit('joinBoard', { boardId, user });
    }

    leaveBoard(boardId: string) {
        this.socket.emit('leaveBoard', boardId);
    }

    lockTask(taskId: string, boardId: string) {
        this.socket.emit('lockTask', { taskId, boardId });
    }

    unlockTask(taskId: string, boardId: string) {
        this.socket.emit('unlockTask', { taskId, boardId });
    }

    onBoardUpdate(): Observable<any> {
        return this.boardUpdateSubject.asObservable();
    }

    onPresenceUpdate(): Observable<PresenceUser[]> {
        return this.presenceSubject.asObservable();
    }

    onLocksUpdate(): Observable<TaskLock[]> {
        return this.locksSubject.asObservable();
    }
}
