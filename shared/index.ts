export interface IBoard {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface IColumn {
    id: string;
    board_id: string;
    name: string;
    order: number;
    created_at: Date;
    updated_at: Date;
}

export interface ITask {
    id: string;
    column_id: string;
    title: string;
    details: string;
    order: number;
    created_at: Date;
    updated_at: Date;
}

// DTOs for mutations (Classes for reflection support)
export class CreateBoardDto {
    name: string;
}

export class CreateColumnDto {
    board_id: string;
    name: string;
    order: number;
}

export class CreateTaskDto {
    column_id: string;
    title: string;
    details?: string;
    order: number;
}

export class UpdateTaskDto {
    title?: string;
    details?: string;
    column_id?: string;
    order?: number;
}
