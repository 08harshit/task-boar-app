import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { IProject } from '@shared/index';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="project-view">
      <header>
        <div class="title-group">
          <h1>My Workspaces</h1>
          <p>Select a project to start collaborating</p>
        </div>
        <button (click)="createProject()" class="primary-btn">+ Create Project</button>
      </header>

      <div class="project-grid">
        @for (project of projects(); track project.id) {
          <div class="project-card" [routerLink]="['/projects', project.id]">
            <div class="card-header">
              <div class="project-icon">{{ (project.name[0] || 'P').toUpperCase() }}</div>
            </div>
            <div class="card-body">
              <h3>{{ project.name }}</h3>
              <p>{{ project.description || 'No description provided' }}</p>
            </div>
            <div class="card-footer">
              <span class="board-count">{{ project.boards?.length || 0 }} Boards</span>
              <span class="member-count">1 Team Member</span>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon">📁</div>
            <h2>No projects yet</h2>
            <p>Create your first project to organize your team's tasks and boards.</p>
            <button (click)="createProject()" class="secondary-btn">New Project</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .project-view { padding: 40px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
    h1 { font-size: 2.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    p { color: #64748b; font-size: 1rem; margin: 8px 0 0; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .project-card { 
      background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 24px; cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .project-card:hover { transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1); }
    .project-icon { width: 48px; height: 48px; background: #3b82f6; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; }
    h3 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
    .card-body p { font-size: 0.9rem; margin-top: 4px; line-height: 1.5; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.025em; }
    .primary-btn { padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .primary-btn:hover { background: #2563eb; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 80px 0; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 24px; }
    .empty-icon { font-size: 3rem; margin-bottom: 16px; }
    .secondary-btn { margin-top: 24px; padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 10px; cursor: pointer; }
  `]
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  projects = signal<IProject[]>([]);

  async ngOnInit() {
    await this.loadProjects();
  }

  async loadProjects() {
    try {
      const data = await this.projectService.getProjects();
      this.projects.set(data || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  }

  async createProject() {
    const name = prompt('Project Name:');
    if (name) {
      const description = prompt('Project Description (optional):') || '';
      try {
        await this.projectService.createProject({ name, description });
        await this.loadProjects();
      } catch (err) {
        alert('Failed to create project. Please try again.');
      }
    }
  }
}
