import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '@shared/index';
import { Task } from '../../entities/task.entity';
import { SupabaseAuthGuard } from '../auth/auth.guard';

@Controller('tasks')
@UseGuards(SupabaseAuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    findByColumn(@Query('columnId') columnId: string): Promise<Task[]> {
        return this.tasksService.findByColumn(columnId);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Task> {
        return this.tasksService.findOne(id);
    }

    @Post()
    create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
        return this.tasksService.create(createTaskDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto): Promise<Task> {
        return this.tasksService.update(id, updateTaskDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Query('senderId') senderId?: string): Promise<void> {
        return this.tasksService.remove(id, senderId);
    }
}
