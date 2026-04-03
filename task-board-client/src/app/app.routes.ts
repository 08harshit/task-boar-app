import { Routes } from '@angular/router';
import { BoardListComponent } from './components/board-list/board-list.component';
import { BoardDetailComponent } from './components/board-detail/board-detail.component';
import { LoginComponent } from './components/login/login.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'projects',
        component: ProjectListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'projects/:projectId',
        component: BoardListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'boards/:id',
        component: BoardDetailComponent,
        canActivate: [authGuard]
    },
    { path: '', redirectTo: 'projects', pathMatch: 'full' },
    { path: '**', redirectTo: 'projects' }
];
