import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BoardService } from '../../services/board.service';
import { SocketService, PresenceUser, TaskLock } from '../../services/socket.service';
import { UserSessionService } from '../../services/user-session.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { IBoard, ITask } from '@shared/index';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, TaskCardComponent, MatDialogModule],
  template: `
    <div class="board-layout">
      <header class="board-header" *ngIf="board()">
        <div class="header-left">
          <button routerLink="/boards" class="back-btn" title="Back to All Boards">←</button>
          <div class="title-group">
            <span class="breadcrumb">Project /</span>
            <h1>{{ board()?.name }}</h1>
          </div>
        </div>
        
        <div class="header-center">
          <div class="presence-list">
            @for (user of activeUsers(); track user.socketId) {
              <div class="user-avatar" 
                   [style.background-color]="user.color"
                   [title]="user.name">
                {{ user.name.slice(0, 2).toUpperCase() }}
              </div>
            }
          </div>
        </div>

        <div class="header-right">
          <button (click)="addColumn()" class="secondary">+ Add Column</button>
        </div>
      </header>

      <div class="board-columns" cdkDropListGroup>
        @for (column of board()?.columns; track column.id) {
          <div class="column">
            <div class="column-header">
              <h3>{{ column.name }}</h3>
              <span class="count">{{ column.tasks?.length || 0 }}</span>
              <button (click)="addTask(column.id)" class="add-task-btn">+</button>
            </div>
            
            <div
              cdkDropList
              [cdkDropListData]="column.tasks"
              (cdkDropListDropped)="onDrop($event, column.id)"
              class="task-list"
            >
              @for (task of column.tasks; track task.id) {
                <app-task-card 
                  cdkDrag 
                  [cdkDragData]="task"
                  [task]="task"
                  [currentUserId]="session.user().id"
                  [lock]="getTaskLock(task.id)"
                  (onEdit)="editTask($event)"
                  (onDelete)="deleteTask($event)"
                ></app-task-card>
              } @empty {
                <div class="empty-list">Drag tasks here</div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .board-layout { height: 100vh; overflow: hidden; display: flex; flex-direction: column; background: #f8fafc; }
    .board-header { 
      padding: 12px 24px; background: white; border-bottom: 1px solid #e2e8f0; 
      display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .back-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: bold; }
    .title-group { display: flex; flex-direction: column; }
    .breadcrumb { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; margin-bottom: -2px; }
    h1 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
    
    .presence-list { display: flex; margin-left: 20px; }
    .user-avatar { 
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; margin-left: -8px; 
      color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; 
      font-weight: 700; transition: transform 0.2s; position: relative;
    }
    .user-avatar:hover { transform: translateY(-4px); z-index: 50; }

    .board-columns { flex: 1; overflow-x: auto; display: flex; align-items: flex-start; padding: 24px; gap: 20px; }
    .column { flex: 0 0 300px; max-height: calc(100vh - 120px); border-radius: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .column-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .column-header h3 { margin: 0; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #64748b; flex: 1; }
    .count { background: #cbd5e1; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: #334155; }
    .add-task-btn { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }
    .task-list { flex: 1; overflow-y: auto; padding: 12px; min-height: 100px; }
    .empty-list { border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; color: #94a3b8; font-size: 0.8rem; }
    .secondary { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
  `]
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  board = signal<IBoard | null>(null);
  activeUsers = signal<PresenceUser[]>([]);
  taskLocks = signal<TaskLock[]>([]);

  private currentBoardId?: string;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private boardService: BoardService,
    private socketService: SocketService,
    public session: UserSessionService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.subs.add(this.route.params.subscribe(params => {
      const id = params['id'];
      if (this.currentBoardId && this.currentBoardId !== id) {
        this.socketService.leaveBoard(this.currentBoardId);
      }
      this.currentBoardId = id;
      this.socketService.joinBoard(id, this.session.user());
      this.refreshBoard(id);
    }));

    this.subs.add(this.socketService.onBoardUpdate().subscribe(() => {
      if (this.currentBoardId) this.refreshBoard(this.currentBoardId);
    }));

    this.subs.add(this.socketService.onPresenceUpdate().subscribe(users => {
      this.activeUsers.set(users);
    }));

    this.subs.add(this.socketService.onLocksUpdate().subscribe(locks => {
      this.taskLocks.set(locks);
    }));
  }

  ngOnDestroy(): void {
    if (this.currentBoardId) this.socketService.leaveBoard(this.currentBoardId);
    this.subs.unsubscribe();
  }

  getTaskLock(taskId: string) {
    return computed(() => this.taskLocks().find(l => l.taskId === taskId));
  }

  refreshBoard(id: string): void {
    this.boardService.getBoard(id).subscribe(data => this.board.set(data));
  }

  onDrop(event: CdkDragDrop<ITask[] | undefined>, targetColumnId: string): void {
    if (!event.container.data || !event.previousContainer.data) return;

    // Optional: Check if task is locked before allowing drop
    const task = event.item.data as ITask;
    const lock = this.taskLocks().find(l => l.taskId === task.id);
    if (lock && lock.userId !== this.session.user().id) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.boardService.updateTask(task.id, { column_id: targetColumnId, order: event.currentIndex }).subscribe();
    }
  }

  addColumn(): void {
    const name = prompt('New Column Name:');
    if (name && this.board()) {
      this.boardService.createColumn({ board_id: this.board()!.id, name, order: this.board()!.columns?.length || 0 }).subscribe();
    }
  }

  addTask(columnId: string): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const order = this.board()?.columns?.find(c => c.id === columnId)?.tasks?.length || 0;
        this.boardService.createTask({
          column_id: columnId,
          title: result.title,
          details: result.details,
          priority: result.priority,
          due_date: result.due_date,
          order
        }).subscribe();
      }
    });
  }

  editTask(task: ITask): void {
    const boardId = this.currentBoardId!;
    this.socketService.lockTask(task.id, boardId);

    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: { task } });
    dialogRef.afterClosed().subscribe(result => {
      this.socketService.unlockTask(task.id, boardId);
      if (result) {
        this.boardService.updateTask(task.id, result).subscribe();
      }
    });
  }

  deleteTask(id: string): void {
    if (confirm('Delete task?')) {
      this.boardService.deleteTask(id).subscribe();
    }
  }
}
