import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Board } from '../entities/board.entity';
import { BoardColumn } from '../entities/column.entity';
import { Task } from '../entities/task.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                url: config.get<string>('DATABASE_URL') || `postgresql://postgres:db_password@db.nkqszcnefqtvigdumxec.supabase.co:5432/postgres`,
                entities: [Board, BoardColumn, Task],
                synchronize: false, // Professional practice: use migrations instead of synchronize
                logging: true,
            }),
        }),
    ],
})
export class DatabaseModule { }
