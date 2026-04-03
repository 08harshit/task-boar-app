import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BoardService } from '../../services/board.service';
import { BoardDialogComponent } from '../board-dialog/board-dialog.component';
import { IBoard } from '@shared/index';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  template: `
    <div class="board-container">
      <header>
        <div class="header-left">
           <button routerLink="/projects" class="back-btn" title="Back to All Projects">📁 Projects</button>
           <h1>Boards in this Project</h1>
        </div>
        <button class="primary" (click)="createNewBoard()">+ Create New Board</button>
      </header>
      
      <div class="board-grid">
        @for (board of boards(); track board.id) {
          <div [routerLink]="['/boards', board.id]" class="board-card">
            <h3>{{ board.name }}</h3>
            <p>Created: {{ board.created_at | date:'mediumDate' }}</p>
          </div>
        } @empty {
          <div class="empty-state">
             <p>No boards found. Create your first board to get started!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .board-container { padding: 40px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .back-btn { padding: 6px 12px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: bold; }
    h1 { font-size: 2rem; color: #1a1a1a; letter-spacing: -0.5px; margin: 0; }
    .board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .board-card { 
      background: white; border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .board-card:hover { transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.1); }
    h3 { margin: 0 0 8px 0; color: #1f2937; }
    p { font-size: 0.875rem; color: #6b7280; }
    button.primary { padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    button.primary:hover { background: #2563eb; }
    .empty-state { grid-column: 1 / -1; padding: 60px; text-align: center; color: #9ca3af; border: 2px dashed #e5e7eb; border-radius: 16px; }
  `]
})
export class BoardListComponent implements OnInit {
  boards = signal<IBoard[]>([]);
  private boardService = inject(BoardService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private projectId?: string;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['projectId'];
      this.refreshBoards();
    });
  }

  refreshBoards(): void {
    this.boardService.getBoards(this.projectId).subscribe(data => this.boards.set(data));
  }

  createNewBoard(): void {
    const dialogRef = this.dialog.open(BoardDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.projectId) {
        this.boardService.createBoard({ name: result.name, project_id: this.projectId })
          .subscribe(() => this.refreshBoards());
      }
    });
  }
}
