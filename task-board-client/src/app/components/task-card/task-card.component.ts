import { Component, Input, Output, EventEmitter, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask } from '@shared/index';
import { TaskLock } from '../../services/socket.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-card" 
         [class.high-priority]="task.priority === 'high'"
         [class.locked]="isLockedByOther()">
      
      <div class="lock-overlay" *ngIf="isLockedByOther()">
        <span class="lock-icon">🔒 Being edited by {{ lock()?.userName }}</span>
      </div>

      <div class="task-metadata">
        <span class="priority-badge" [class]="task.priority">{{ task.priority }}</span>
        <div class="indicators">
          <span class="due-date" 
                [class.overdue]="isOverdue()"
                *ngIf="task.due_date">
            {{ isOverdue() ? '⚠️ Overdue' : (task.due_date | date:'shortDate') }}
          </span>
        </div>
      </div>
      
      <div class="task-content">
        <h4>{{ task.title }}</h4>
        <p *ngIf="task.details">{{ task.details }}</p>
      </div>

      <div class="label-pills" *ngIf="task.labels?.length">
         @for (label of task.labels; track label) {
            <span class="label-pill" [style.background-color]="getLabelColor(label)">{{ label }}</span>
         }
      </div>

      <div class="task-actions" *ngIf="!isLockedByOther()">
        <button (click)="$event.stopPropagation(); onEdit.emit(task)" class="icon-btn edit">✎</button>
        <button (click)="$event.stopPropagation(); onDelete.emit(task.id)" class="icon-btn delete">🗑</button>
      </div>
    </div>
  `,
  styles: [`
    .task-card { 
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;
      cursor: grab; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; position: relative; overflow: hidden;
    }
    .task-card:hover:not(.locked) { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .task-card.high-priority { border-left: 4px solid #ef4444; }
    
    .task-card.locked { opacity: 0.7; cursor: not-allowed; background: #f8fafc; }
    .lock-overlay { 
      position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; z-index: 10;
    }
    .lock-icon { font-size: 0.75rem; font-weight: 600; color: #64748b; background: white; padding: 4px 10px; border-radius: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

    .task-metadata { display: flex; justify-content: space-between; align-items: center; }
    .priority-badge { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 50px; }
    .priority-badge.low { background: #f0fdf4; color: #16a34a; }
    .priority-badge.medium { background: #fdfcea; color: #ca8a04; }
    .priority-badge.high { background: #fef2f2; color: #ef4444; }
    
    .due-date { font-size: 0.65rem; color: #94a3b8; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; }
    .due-date.overdue { background: #fee2e2; color: #dc2626; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }

    h4 { margin: 0; font-weight: 700; color: #1e293b; line-height: 1.4; font-size: 0.9rem; }
    p { margin: 0; font-size: 0.75rem; color: #64748b; line-height: 1.5; overflow-wrap: break-word; opacity: 0.8; }
    
    .label-pills { display: flex; flex-wrap: wrap; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 8px; }
    .label-pill { font-size: 0.6rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; color: white; text-transform: uppercase; }

    .task-actions { display: flex; gap: 8px; justify-content: flex-end; opacity: 0; transition: opacity 0.2s ease; position: absolute; bottom: 8px; right: 12px; }
    .task-card:hover .task-actions { opacity: 1; }
    .icon-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 6px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; color: #64748b; }
    .icon-btn:hover { background: white; border-color: #3b82f6; color: #3b82f6; }
  `]
})
export class TaskCardComponent {
  @Input({ required: true }) task!: ITask;
  @Input() currentUserId?: string;
  @Input({ required: true }) lock!: Signal<TaskLock | undefined>;

  @Output() onEdit = new EventEmitter<ITask>();
  @Output() onDelete = new EventEmitter<string>();

  isLockedByOther(): boolean {
    const l = this.lock();
    return !!(l && l.userId !== this.currentUserId);
  }

  isOverdue(): boolean {
    if (!this.task.due_date) return false;
    return new Date(this.task.due_date).getTime() < Date.now();
  }

  getLabelColor(label: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
