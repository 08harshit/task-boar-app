export interface IProject {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    boards?: IBoard[];
    created_at: Date;
    updated_at: Date;
}

export interface IBoard {
    id: string;
    name: string;
    project_id?: string;
    columns?: IColumn[];
    created_at: Date;
    updated_at: Date;
}

export interface IColumn {
    id: string;
    board_id: string;
    name: string;
    order: number;
    tasks?: ITask[];
    created_at: Date;
    updated_at: Date;
}

export interface ITask {
    id: string;
    column_id: string;
    title: string;
    details: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: Date;
    labels?: string[];
    order: number;
    created_at: Date;
    updated_at: Date;
}

// DTOs for mutations (Classes for reflection support)
export class BaseDto {
    senderId?: string;
}

export class CreateProjectDto extends BaseDto {
    name!: string;
    description?: string;
}

export class CreateBoardDto extends BaseDto {
    name!: string;
    project_id!: string;
}

export class CreateColumnDto extends BaseDto {
    board_id!: string;
    name!: string;
    order!: number;
}

export class CreateTaskDto extends BaseDto {
    column_id!: string;
    title!: string;
    details?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: Date;
    labels?: string[];
    order!: number;
}

export class UpdateTaskDto extends BaseDto {
    title?: string;
    details?: string;
    column_id?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: Date;
    labels?: string[];
    order?: number;
}
