import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
        <h1>My Task Boards</h1>
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
    h1 { font-size: 2.5rem; color: #1a1a1a; letter-spacing: -0.5px; }
    .board-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .board-card { 
      background: white; border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .board-card:hover { 
      transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.1); 
    }
    h3 { margin: 0 0 8px 0; color: #1f2937; }
    p { font-size: 0.875rem; color: #6b7280; }
    button.primary { 
      padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; 
      font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    button.primary:hover { background: #2563eb; }
    .empty-state { grid-column: 1 / -1; padding: 60px; text-align: center; color: #9ca3af; border: 2px dashed #e5e7eb; border-radius: 16px; }
  `]
})
export class BoardListComponent implements OnInit {
  boards = signal<IBoard[]>([]);

  constructor(
    private boardService: BoardService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.refreshBoards();
  }

  refreshBoards(): void {
    this.boardService.getBoards().subscribe(data => this.boards.set(data));
  }

  createNewBoard(): void {
    const dialogRef = this.dialog.open(BoardDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.boardService.createBoard({ name: result.name }).subscribe(() => this.refreshBoards());
      }
    });
  }
}
