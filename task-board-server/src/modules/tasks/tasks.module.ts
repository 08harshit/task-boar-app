import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { BoardColumn } from '../../entities/column.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, BoardColumn]),
        GatewayModule,
    ],
    providers: [TasksService],
    controllers: [TasksController],
    exports: [TasksService],
})
export class TasksModule { }
