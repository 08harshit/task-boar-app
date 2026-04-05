import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { BoardColumn } from '../../entities/column.entity';
import { CreateTaskDto, UpdateTaskDto } from '@shared/index';
import { BoardGateway } from '../boards/gateways/board.gateway';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(BoardColumn)
        private readonly columnRepository: Repository<BoardColumn>,
        private readonly boardGateway: BoardGateway,
        private readonly dataSource: DataSource,
    ) { }

    async search(query: string, boardId?: string): Promise<Task[]> {
        const baseQuery = this.taskRepository.createQueryBuilder('task')
            .leftJoinAndSelect('task.column', 'column')
            .where('(task.title ILike :query OR task.details ILike :query)', { query: `%${query}%` });

        if (boardId) {
            baseQuery.andWhere('column.board_id = :boardId', { boardId });
        }

        return baseQuery.getMany();
    }

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
        const { senderId, ...data } = createTaskDto;
        const task = this.taskRepository.create(data);
        const saved = await (this.taskRepository.save(task) as Promise<Task>);

        const boardId = await this.getBoardIdByColumn(saved.column_id);
        if (boardId) {
            this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_added', senderId });
        }
        return saved;
    }

    async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const { senderId, order: newOrder, column_id: newColumnId, ...meta } = updateTaskDto;

        return await this.dataSource.transaction(async manager => {
            const task = await manager.findOne(Task, { where: { id } });
            if (!task) throw new NotFoundException('Task not found');

            const oldColumnId = task.column_id;
            const oldOrder = task.order;

            // Apply metadata changes (title, priority, etc)
            Object.assign(task, meta);

            if (newColumnId !== undefined && (newColumnId !== oldColumnId || newOrder !== undefined)) {
                // We are moving positions (same column or across columns)
                const targetColumnId = newColumnId || oldColumnId;

                // Fetch ALL tasks in both affected columns to re-index them flawlessly
                const sourceTasks = await manager.find(Task, {
                    where: { column_id: oldColumnId },
                    order: { order: 'ASC' }
                });

                let targetTasks = (targetColumnId === oldColumnId)
                    ? sourceTasks
                    : await manager.find(Task, {
                        where: { column_id: targetColumnId },
                        order: { order: 'ASC' }
                    });

                // Remove task from source (in-memory)
                const taskIdx = sourceTasks.findIndex(t => t.id === id);
                if (taskIdx !== -1) sourceTasks.splice(taskIdx, 1);

                // Add to target (in-memory)
                const insertIdx = newOrder !== undefined ? newOrder : targetTasks.length;
                task.column_id = targetColumnId;
                targetTasks.splice(insertIdx, 0, task);

                // Bulk update orders for BOTH columns
                const allToUpdate = [...sourceTasks, ...targetTasks];

                // Re-index Source
                allToUpdate.forEach((t, i) => { if (t.column_id === oldColumnId) { /* handled separately below */ } });

                sourceTasks.forEach((t, i) => t.order = i);
                targetTasks.forEach((t, i) => t.order = i);

                // Persist all changes
                await manager.save(Task, sourceTasks);
                await manager.save(Task, targetTasks);
            } else {
                // Just metadata update
                await manager.save(Task, task);
            }

            const boardId = await this.getBoardIdByColumn(task.column_id);
            if (boardId) {
                this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_updated', senderId });
            }
            return task;
        });
    }

    async remove(id: string, senderId?: string): Promise<void> {
        const task = await this.findOne(id);
        const boardId = await this.getBoardIdByColumn(task.column_id);
        await this.taskRepository.remove(task);
        if (boardId) this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'task_deleted', senderId });
    }

    private async getBoardIdByColumn(columnId: string): Promise<string | null> {
        const column = await this.columnRepository.findOne({ where: { id: columnId } });
        return column ? column.board_id : null;
    }
}
