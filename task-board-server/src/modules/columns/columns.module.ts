import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn } from '../../entities/column.entity';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';

@Module({
    imports: [TypeOrmModule.forFeature([BoardColumn])],
    providers: [ColumnsService],
    controllers: [ColumnsController],
    exports: [ColumnsService],
})
export class ColumnsModule { }
