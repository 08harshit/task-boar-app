import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '@shared/index';
import { BoardGateway } from '../boards/gateways/board.gateway';
import { BoardColumn } from '../../entities/column.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(BoardColumn)
        private readonly columnRepository: Repository<BoardColumn>,
        private readonly boardGateway: BoardGateway,
    ) { }

    async findByColumn(column_id: string): Promise<Task[]> {
        return this.taskRepository.find({
            where: { column_id },
            order: { order: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['column']
        });
        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }

    async create(createTaskDto: CreateTaskDto): Promise<Task> {
        const task = this.taskRepository.create(createTaskDto);
        const saved = await (this.taskRepository.save(task) as Promise<Task>);

        // Notify board
        const boardId = await this.getBoardIdByColumn(saved.column_id);
        if (boardId) this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_added' });

        return saved;
    }

    async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const task = await this.findOne(id);
        const oldColumnId = task.column_id;

        this.taskRepository.merge(task, updateTaskDto);
        const saved = await (this.taskRepository.save(task) as Promise<Task>);

        // Notify board (on both old and new columns' board if changed, usually same board)
        const boardId = await this.getBoardIdByColumn(saved.column_id);
        if (boardId) this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_updated' });

        return saved;
    }

    async remove(id: string): Promise<void> {
        const task = await this.findOne(id);
        const boardId = await this.getBoardIdByColumn(task.column_id);
        await this.taskRepository.remove(task);
        if (boardId) this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_deleted' });
    }

    private async getBoardIdByColumn(columnId: string): Promise<string | null> {
        const column = await this.columnRepository.findOne({ where: { id: columnId } });
        return column ? column.board_id : null;
    }
}
