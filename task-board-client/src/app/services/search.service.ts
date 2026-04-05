import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITask } from '@shared/index';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/tasks/search`;

    searchTasks(query: string, boardId?: string): Observable<ITask[]> {
        let params = new HttpParams().set('query', query);
        if (boardId) params = params.set('boardId', boardId);
        return this.http.get<ITask[]>(this.apiUrl, { params });
    }
}
