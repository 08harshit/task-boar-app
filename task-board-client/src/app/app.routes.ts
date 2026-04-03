import { Routes } from '@angular/router';
import { BoardListComponent } from './components/board-list/board-list.component';
import { BoardDetailComponent } from './components/board-detail/board-detail.component';

export const routes: Routes = [
    { path: '', redirectTo: 'boards', pathMatch: 'full' },
    { path: 'boards', component: BoardListComponent },
    { path: 'boards/:id', component: BoardDetailComponent },
    { path: '**', redirectTo: 'boards' }
];
