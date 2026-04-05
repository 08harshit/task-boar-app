import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBoard, ITask, CreateBoardDto, CreateTaskDto, UpdateTaskDto, CreateColumnDto, IColumn } from '@shared/index';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}`;

    getBoards(projectId?: string): Observable<IBoard[]> {
        let params = new HttpParams();
        if (projectId) params = params.set('projectId', projectId);
        return this.http.get<IBoard[]>(`${this.apiUrl}/boards`, { params });
    }

    getBoard(id: string): Observable<IBoard> {
        return this.http.get<IBoard>(`${this.apiUrl}/boards/${id}`);
    }

    createBoard(dto: CreateBoardDto): Observable<IBoard> {
        return this.http.post<IBoard>(`${this.apiUrl}/boards`, dto);
    }

    // Task CRUD
    createTask(dto: CreateTaskDto): Observable<ITask> {
        return this.http.post<ITask>(`${this.apiUrl}/tasks`, dto);
    }

    updateTask(id: string, dto: UpdateTaskDto): Observable<ITask> {
        return this.http.patch<ITask>(`${this.apiUrl}/tasks/${id}`, dto);
    }

    deleteTask(id: string, senderId?: string): Observable<void> {
        let params = new HttpParams();
        if (senderId) params = params.set('senderId', senderId);
        return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`, { params });
    }

    // Column CRUD
    createColumn(dto: CreateColumnDto): Observable<IColumn> {
        return this.http.post<IColumn>(`${this.apiUrl}/columns`, dto);
    }

    deleteColumn(id: string, senderId?: string): Observable<void> {
        let params = new HttpParams();
        if (senderId) params = params.set('senderId', senderId);
        return this.http.delete<void>(`${this.apiUrl}/columns/${id}`, { params });
    }

    updateColumnOrder(id: string, order: number, senderId?: string): Observable<IColumn> {
        let params = new HttpParams();
        if (senderId) params = params.set('senderId', senderId);
        return this.http.patch<IColumn>(`${this.apiUrl}/columns/${id}/order`, { order }, { params });
    }
}
