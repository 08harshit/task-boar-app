import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from '@shared/index';
import { Board } from '../../entities/board.entity';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('boards')
@UseGuards(SupabaseAuthGuard, WorkspaceGuard)
export class BoardsController {
    constructor(private readonly boardsService: BoardsService) { }

    @Get()
    findAll(@Query('projectId') projectId?: string): Promise<Board[]> {
        return this.boardsService.findAll(projectId);
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
