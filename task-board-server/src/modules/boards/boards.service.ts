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

    async findAll(projectId?: string): Promise<Board[]> {
        if (projectId) {
            return this.boardRepository.find({
                where: { project_id: projectId },
                relations: ['columns', 'columns.tasks']
            });
        }
        return this.boardRepository.find({ relations: ['columns', 'columns.tasks'] });
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
        const board = this.boardRepository.create({
            name: createBoardDto.name,
            project_id: createBoardDto.project_id
        });
        return this.boardRepository.save(board);
    }

    async remove(id: string): Promise<void> {
        await this.boardRepository.delete(id);
    }
}
