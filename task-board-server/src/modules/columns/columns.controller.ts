import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from '@shared/index';
import { BoardColumn } from '../../entities/column.entity';

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
    updateOrder(@Param('id') id: string, @Body('order') order: number): Promise<BoardColumn> {
        return this.columnsService.updateOrder(id, order);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.columnsService.remove(id);
    }
}
