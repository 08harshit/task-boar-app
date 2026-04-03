import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { BoardColumn } from '../../entities/column.entity';
import { CreateColumnDto } from '@shared/index';

@Injectable()
export class ColumnsService {
    constructor(
        @InjectRepository(BoardColumn)
        private readonly columnRepository: Repository<BoardColumn>,
    ) { }

    async findByBoard(boardId: string): Promise<BoardColumn[]> {
        return this.columnRepository.find({
            where: { board_id: boardId },
            relations: ['tasks'],
            order: {
                order: 'ASC',
            },
        });
    }

    async create(createColumnDto: CreateColumnDto): Promise<BoardColumn> {
        const column = this.columnRepository.create(createColumnDto);
        return this.columnRepository.save(column);
    }

    async updateOrder(id: string, order: number): Promise<BoardColumn> {
        const column = await this.columnRepository.findOne({ where: { id } });
        if (!column) throw new NotFoundException('Column not found');
        column.order = order;
        return this.columnRepository.save(column);
    }

    async remove(id: string): Promise<void> {
        await this.columnRepository.delete(id);
    }
}
