import { Injectable, inject } from '@angular/common/http';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBoard, CreateBoardDto } from '@shared/index';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BoardService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/boards`;

    getBoards(projectId?: string): Observable<IBoard[]> {
        let params = new HttpParams();
        if (projectId) params = params.set('projectId', projectId);
        return this.http.get<IBoard[]>(this.apiUrl, { params });
    }

    getBoard(id: string): Observable<IBoard> {
        return this.http.get<IBoard>(`${this.apiUrl}/${id}`);
    }

    createBoard(dto: CreateBoardDto): Observable<IBoard> {
        return this.http.post<IBoard>(this.apiUrl, dto);
    }

    deleteBoard(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
