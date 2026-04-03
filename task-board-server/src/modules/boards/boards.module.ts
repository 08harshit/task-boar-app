import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from '../../entities/board.entity';
import { ProjectMember } from '../../entities/project-member.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Board, ProjectMember])],
    providers: [BoardsService],
    controllers: [BoardsController],
    exports: [BoardsService],
})
export class BoardsModule { }
