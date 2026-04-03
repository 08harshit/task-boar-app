import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from '@shared/index';
import { Board } from '../../entities/board.entity';

@Controller('boards')
export class BoardsController {
    constructor(private readonly boardsService: BoardsService) { }

    @Get()
    findAll(): Promise<Board[]> {
        return this.boardsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Board> {
        return this.boardsService.findOne(id);
    }

    @Post()
    create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
        return this.boardsService.create(createBoardDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.boardsService.remove(id);
    }
}
