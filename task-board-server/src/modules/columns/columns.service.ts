import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from '../../entities/column.entity';
import { CreateColumnDto } from '@shared/index';
import { BoardGateway } from '../boards/gateways/board.gateway';

@Injectable()
export class ColumnsService {
    constructor(
        @InjectRepository(BoardColumn)
        private readonly columnRepository: Repository<BoardColumn>,
        private readonly boardGateway: BoardGateway,
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
        const saved = await (this.columnRepository.save(column) as Promise<BoardColumn>);
        this.boardGateway.notifyBoardUpdate(saved.board_id, 'board_updated', { type: 'column_added' });
        return saved;
    }

    async updateOrder(id: string, order: number): Promise<BoardColumn> {
        const column = await this.columnRepository.findOne({ where: { id } });
        if (!column) throw new NotFoundException('Column not found');
        column.order = order;
        const saved = await (this.columnRepository.save(column) as Promise<BoardColumn>);
        this.boardGateway.notifyBoardUpdate(saved.board_id, 'board_updated', { type: 'column_updated' });
        return saved;
    }

    async remove(id: string): Promise<void> {
        const column = await this.columnRepository.findOne({ where: { id } });
        if (column) {
            const boardId = column.board_id;
            await this.columnRepository.delete(id);
            this.boardGateway.notifyBoardUpdate(boardId, 'board_updated', { type: 'column_deleted' });
        }
    }
}
