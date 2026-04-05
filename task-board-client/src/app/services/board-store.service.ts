import { Injectable, signal, computed, inject } from '@angular/core';
import { BoardService } from './board.service';
import { SocketService, PresenceUser, TaskLock } from './socket.service';
import { UserSessionService } from './user-session.service';
import { IBoard, ITask, CreateTaskDto, CreateColumnDto } from '@shared/index';
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

    // Filtering State
    private _filterQuery = signal<string>('');
    private _filterPriority = signal<string | null>(null);

    // Computed state
    board = computed(() => this._board());
    activeUsers = computed(() => this._presence());
    taskLocks = computed(() => this._locks());

    // Filtered Board View
    filteredBoard = computed(() => {
        const currentBoard = this._board();
        if (!currentBoard) return null;

        const query = this._filterQuery().toLowerCase();
        const priority = this._filterPriority();

        if (!query && !priority) return currentBoard;

        return {
            ...currentBoard,
            columns: currentBoard.columns?.map(col => ({
                ...col,
                tasks: col.tasks?.filter(task => {
                    const matchesQuery = !query ||
                        task.title.toLowerCase().includes(query) ||
                        (task.details?.toLowerCase().includes(query));
                    const matchesPriority = !priority || task.priority === priority;
                    return matchesQuery && matchesPriority;
                }) || []
            })) || []
        };
    });

    setFilterQuery(q: string) { this._filterQuery.set(q); }
    setFilterPriority(p: string | null) { this._filterPriority.set(p); }
    get filterQuery() { return this._filterQuery(); }
    get filterPriority() { return this._filterPriority(); }

    async loadBoard(id: string) {
        this.socketService.joinBoard(id, this.session.user());
        this.refreshBoard(id);

        this.socketService.onBoardUpdate().subscribe((data: any) => {
            if (data && data.senderId === this.session.user().id) return;
            this.refreshBoard(id);
        });

        this.socketService.onPresenceUpdate().subscribe(users => this._presence.set(users));
        this.socketService.onLocksUpdate().subscribe(locks => this._locks.set(locks));
    }

    leaveBoard(id: string) {
        this.socketService.leaveBoard(id);
        this._board.set(null);
        this._filterQuery.set('');
        this._filterPriority.set(null);
    }

    refreshBoard(id: string) {
        this.boardService.getBoard(id).subscribe(data => this._board.set(data));
    }

    getTaskLock(taskId: string) {
        return computed(() => this._locks().find(l => l.taskId === taskId));
    }

    // Mutations
    async createTask(data: Partial<CreateTaskDto>) {
        const payload = { ...data, senderId: this.session.user().id } as CreateTaskDto;
        await firstValueFrom(this.boardService.createTask(payload));
    }

    async updateTask(boardId: string, taskId: string, data: any) {
        const payload = { ...data, senderId: this.session.user().id };
        await firstValueFrom(this.boardService.updateTask(taskId, payload));
    }

    async deleteTask(boardId: string, taskId: string) {
        const senderId = this.session.user().id;
        await firstValueFrom(this.boardService.deleteTask(taskId, senderId));
    }

    async createColumn(data: Partial<CreateColumnDto>) {
        const payload = { ...data, senderId: this.session.user().id } as CreateColumnDto;
        await firstValueFrom(this.boardService.createColumn(payload));
    }

    async deleteColumn(boardId: string, columnId: string) {
        const senderId = this.session.user().id;
        await firstValueFrom(this.boardService.deleteColumn(columnId, senderId));
    }

    async updateColumnOrder(boardId: string, columnId: string, order: number) {
        const senderId = this.session.user().id;
        await firstValueFrom(this.boardService.updateColumnOrder(columnId, order, senderId));
    }

    lockTask(taskId: string, boardId: string) {
        const user = this.session.user();
        this.socketService.lockTask(taskId, boardId, user.id, user.name);
    }

    unlockTask(taskId: string, boardId: string) {
        this.socketService.unlockTask(taskId, boardId);
    }
}
