import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IBoard, IColumn, ITask, CreateBoardDto, CreateColumnDto, CreateTaskDto, UpdateTaskDto } from '@shared/index';

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    private apiUrl = environment.apiUrl;

    // Use a signal for reactive board state (Modern Angular)
    activeBoard = signal<IBoard | null>(null);

    constructor(private http: HttpClient) { }

    // Boards
    getBoards(): Observable<IBoard[]> {
        return this.http.get<IBoard[]>(`${this.apiUrl}/boards`);
    }

    getBoard(id: string): Observable<IBoard> {
        return this.http.get<IBoard>(`${this.apiUrl}/boards/${id}`).pipe(
            tap(board => this.activeBoard.set(board))
        );
    }

    createBoard(dto: CreateBoardDto): Observable<IBoard> {
        return this.http.post<IBoard>(`${this.apiUrl}/boards`, dto);
    }

    // Columns 
    createColumn(dto: CreateColumnDto): Observable<IColumn> {
        return this.http.post<IColumn>(`${this.apiUrl}/columns`, dto);
    }

    updateColumnOrder(id: string, order: number, senderId?: string): Observable<IColumn> {
        return this.http.patch<IColumn>(`${this.apiUrl}/columns/${id}/order?senderId=${senderId}`, { order });
    }

    deleteColumn(id: string, senderId?: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/columns/${id}?senderId=${senderId}`);
    }

    // Tasks
    createTask(dto: CreateTaskDto): Observable<ITask> {
        return this.http.post<ITask>(`${this.apiUrl}/tasks`, dto);
    }

    updateTask(id: string, dto: UpdateTaskDto): Observable<ITask> {
        return this.http.patch<ITask>(`${this.apiUrl}/tasks/${id}`, dto);
    }

    deleteTask(id: string, senderId?: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/tasks/${id}?senderId=${senderId}`);
    }
}
