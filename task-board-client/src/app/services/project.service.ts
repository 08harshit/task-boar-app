import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { IProject, CreateProjectDto } from '@shared/index';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/projects`;

    getProjects(): Promise<IProject[]> {
        return firstValueFrom(this.http.get<IProject[]>(this.apiUrl));
    }

    getProject(id: string): Promise<IProject> {
        return firstValueFrom(this.http.get<IProject>(`${this.apiUrl}/${id}`));
    }

    createProject(dto: CreateProjectDto): Promise<IProject> {
        return firstValueFrom(this.http.post<IProject>(this.apiUrl, dto));
    }
}
