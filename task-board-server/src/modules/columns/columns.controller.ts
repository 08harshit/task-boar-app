import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { BoardColumn } from '../../entities/column.entity';
import { CreateColumnDto } from '@shared/index';

@Controller('columns')
export class ColumnsController {
    constructor(private readonly columnsService: ColumnsService) { }

    @Get()
    findByBoard(@Query('boardId') boardId: string): Promise<BoardColumn[]> {
        return this.columnsService.findByBoard(boardId);
    }

    @Post()
    create(@Body() createColumnDto: CreateColumnDto): Promise<BoardColumn> {
        return this.columnsService.create(createColumnDto);
    }

    @Patch(':id/order')
    updateOrder(
        @Param('id') id: string,
        @Body('order') order: number,
        @Query('senderId') senderId?: string
    ): Promise<BoardColumn> {
        return this.columnsService.updateOrder(id, order, senderId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Query('senderId') senderId?: string): Promise<void> {
        return this.columnsService.remove(id, senderId);
    }
}
