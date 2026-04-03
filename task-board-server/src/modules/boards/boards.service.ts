import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../../entities/board.entity';
import { CreateBoardDto } from '@shared/index';

@Injectable()
export class BoardsService {
    constructor(
        @InjectRepository(Board)
        private readonly boardRepository: Repository<Board>,
    ) { }

    async findAll(): Promise<Board[]> {
        return this.boardRepository.find({
            relations: ['columns', 'columns.tasks'],
            order: {
                created_at: 'DESC',
            },
        });
    }

    async findOne(id: string): Promise<Board> {
        const board = await this.boardRepository.findOne({
            where: { id },
            relations: ['columns', 'columns.tasks'],
        });

        if (!board) {
            throw new NotFoundException(`Board with ID ${id} not found`);
        }

        return board;
    }

    async create(createBoardDto: CreateBoardDto): Promise<Board> {
        const board = this.boardRepository.create(createBoardDto);
        return this.boardRepository.save(board) as Promise<Board>;
    }

    async remove(id: string): Promise<void> {
        await this.boardRepository.delete(id);
    }
}
