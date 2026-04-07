import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BoardStoreService } from '../../services/board-store.service';
import { UserSessionService } from '../../services/user-session.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { ITask } from '@shared/index';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, TaskCardComponent, MatDialogModule, FormsModule],
  template: `
    <div class="board-layout">
      <header class="board-header" *ngIf="store.board()">
        <div class="header-left">
          <button [routerLink]="['/projects', store.board()?.project_id]" class="back-btn" title="Back to Project">📂</button>
          <div class="title-group">
            <span class="breadcrumb">{{ store.board()?.name }}</span>
            <h1>Workflow</h1>
          </div>
        </div>
        
        <div class="header-center">
          <div class="search-box">
             <input type="text" placeholder="Search tasks..." 
                    [ngModel]="store.filterQuery" 
                    (ngModelChange)="store.setFilterQuery($event)">
             <span class="search-icon">🔍</span>
          </div>
          
          <div class="filter-group">
             <select [ngModel]="store.filterPriority" 
                     (ngModelChange)="store.setFilterPriority($event)">
               <option [value]="null">All Priorities</option>
               <option value="high">Critical</option>
               <option value="medium">Medium</option>
               <option value="low">Low</option>
             </select>
          </div>

          <div class="presence-list">
            @for (user of store.activeUsers(); track user.socketId) {
              <div class="user-avatar" 
                   [style.background-color]="user.color"
                   [title]="user.name">
                {{ user.name.slice(0, 2).toUpperCase() }}
              </div>
            }
          </div>
        </div>

        <div class="header-right">
          <div class="action-buttons">
            <button (click)="exportBoard()" class="tertiary" title="Export as JSON">⬇ Export</button>
            <button (click)="addColumn()" class="secondary">+ Add Column</button>
          </div>
        </div>
      </header>

      <div class="board-columns" cdkDropListGroup>
        @for (column of store.filteredBoard()?.columns; track column.id) {
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
                  [lock]="store.getTaskLock(task.id)"
                  (onEdit)="editTask($event)"
                  (onDelete)="deleteTask($event)"
                ></app-task-card>
              } @empty {
                <div class="empty-list">No tasks found</div>
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
    .header-left { display: flex; align-items: center; gap: 20px; min-width: 250px; }
    .back-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 1.25rem; }
    .title-group { display: flex; flex-direction: column; }
    .breadcrumb { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; margin-bottom: -2px; }
    h1 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
    
    .header-center { flex: 1; display: flex; justify-content: center; align-items: center; gap: 16px; }
    .search-box { position: relative; width: 300px; }
    .search-box input { width: 100%; padding: 8px 36px 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; transition: all 0.2s; }
    .search-box input:focus { background: white; border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.9rem; color: #94a3b8; }
    
    .filter-group select { padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569; font-size: 0.9rem; }

    .presence-list { display: flex; margin-left: 10px; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; margin-left: -8px; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; transition: transform 0.2s; position: relative; }
    .user-avatar:hover { transform: translateY(-4px); z-index: 50; }
    
    .board-columns { flex: 1; overflow-x: auto; display: flex; align-items: flex-start; padding: 24px; gap: 20px; }
    .column { flex: 0 0 300px; max-height: calc(100vh - 120px); border-radius: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .column-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .column-header h3 { margin: 0; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #64748b; flex: 1; }
    .count { background: #cbd5e1; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: #334155; }
    .add-task-btn { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }
    .task-list { flex: 1; overflow-y: auto; padding: 12px; min-height: 100px; }
    .empty-list { border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; color: #94a3b8; font-size: 0.8rem; }
    .action-buttons { display: flex; gap: 8px; }
    .secondary { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .tertiary { padding: 8px 16px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .tertiary:hover { background: #e2e8f0; }
  `]
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  store = inject(BoardStoreService);
  session = inject(UserSessionService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  private currentBoardId?: string;
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.route.params.subscribe(params => {
      const id = params['id'];
      if (this.currentBoardId) this.store.leaveBoard(this.currentBoardId);
      this.currentBoardId = id;
      this.store.loadBoard(id);
    }));
  }

  ngOnDestroy(): void {
    if (this.currentBoardId) this.store.leaveBoard(this.currentBoardId);
    this.subs.unsubscribe();
  }

  onDrop(event: CdkDragDrop<ITask[] | undefined>, targetColumnId: string): void {
    if (!event.container.data || !event.previousContainer.data) return;

    const task = event.item.data as ITask;
    const lock = this.store.getTaskLock(task.id)();
    if (lock && lock.userId !== this.session.user().id) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.store.updateTask(this.currentBoardId!, task.id, { column_id: targetColumnId, order: event.currentIndex });
  }

  exportBoard(): void {
    const board = this.store.board();
    if (!board) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(board, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${board.name}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  addColumn(): void {
    const name = prompt('New Column Name:');
    if (name && this.store.board()) {
      this.store.createColumn({
        board_id: this.store.board()!.id,
        name,
        order: this.store.board()!.columns?.length || 0
      }).then(() => this.store.refreshBoard(this.currentBoardId!));
    }
  }

  addTask(columnId: string): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const order = this.store.board()?.columns?.find(c => c.id === columnId)?.tasks?.length || 0;
        this.store.createTask({
          column_id: columnId,
          title: result.title,
          details: result.details,
          priority: result.priority,
          due_date: result.due_date,
          labels: result.labels,
          order
        }).then(() => this.store.refreshBoard(this.currentBoardId!));
      }
    });
  }

  editTask(task: ITask): void {
    const boardId = this.currentBoardId!;
    this.store.lockTask(task.id, boardId);

    const stopRenew = this.store.startLockRenewal(task.id, boardId);

    const dialogRef = this.dialog.open(TaskDialogComponent, { width: '500px', data: { task } });
    dialogRef.afterClosed().subscribe(result => {
      stopRenew();
      this.store.unlockTask(task.id, boardId);
      if (result) {
        this.store.updateTask(boardId, task.id, result);
      }
    });
  }

  deleteTask(id: string): void {
    if (confirm('Delete task?')) {
      this.store.deleteTask(this.currentBoardId!, id);
    }
  }
}
