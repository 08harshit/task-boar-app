import { Routes } from '@angular/router';
import { BoardListComponent } from './components/board-list/board-list.component';
import { BoardDetailComponent } from './components/board-detail/board-detail.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'boards',
        component: BoardListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'boards/:id',
        component: BoardDetailComponent,
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'boards', pathMatch: 'full' },
    { path: '**', redirectTo: 'boards' }
];
