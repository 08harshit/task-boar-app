import { Injectable, signal, computed, inject } from '@angular/core';
import { BoardService } from './board.service';
import { SocketService, PresenceUser, TaskLock } from './socket.service';
import { UserSessionService } from './user-session.service';
import { IBoard, ITask } from '@shared/index';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BoardStoreService {
    private boardService = inject(BoardService);
    private socketService = inject(SocketService);
    private session = inject(UserSessionService);

    // State (Signals)
    private _board = signal<IBoard | null>(null);
    private _presence = signal<PresenceUser[]>([]);
    private _locks = signal<TaskLock[]>([]);

    // Computed state
    board = computed(() => this._board());
    activeUsers = computed(() => this._presence());
    taskLocks = computed(() => this._locks());

    async loadBoard(id: string) {
        this.socketService.joinBoard(id, this.session.user());
        this.refreshBoard(id);

        // Initial setup for listeners
        this.socketService.onBoardUpdate().subscribe(() => this.refreshBoard(id));
        this.socketService.onPresenceUpdate().subscribe(users => this._presence.set(users));
        this.socketService.onLocksUpdate().subscribe(locks => this._locks.set(locks));
    }

    leaveBoard(id: string) {
        this.socketService.leaveBoard(id);
        this._board.set(null);
    }

    refreshBoard(id: string) {
        this.boardService.getBoard(id).subscribe(data => this._board.set(data));
    }

    getTaskLock(taskId: string) {
        return computed(() => this._locks().find(l => l.taskId === taskId));
    }

    // Mutations with automatic error/socket handling
    async updateTask(id: string, taskId: string, data: any) {
        await firstValueFrom(this.boardService.updateTask(taskId, data));
    }

    async deleteTask(id: string, taskId: string) {
        await firstValueFrom(this.boardService.deleteTask(taskId));
    }

    lockTask(taskId: string, boardId: string) {
        const user = this.session.user();
        this.socketService.lockTask(taskId, boardId, user.id, user.name);
    }

    unlockTask(taskId: string, boardId: string) {
        this.socketService.unlockTask(taskId, boardId);
    }
}
