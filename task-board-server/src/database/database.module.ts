import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Board } from '../entities/board.entity';
import { BoardColumn } from '../entities/column.entity';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { Task } from '../entities/task.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url =
                    config.get<string>('DATABASE_URL') ||
                    `postgresql://postgres:db_password@db.nkqszcnefqtvigdumxec.supabase.co:5432/postgres`;
                const useSsl = url.includes('supabase');
                /** Supabase pooler/direct: force IPv4 in container/VPN setups where IPv6 DNS or routes fail. */
                const forceIpv4 = useSsl || config.get<string>('DATABASE_FORCE_IPV4') === 'true';
                return {
                    type: 'postgres' as const,
                    url,
                    entities: [Board, BoardColumn, Project, ProjectMember, Task],
                    synchronize: false,
                    logging: true,
                    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
                    extra: {
                        connectionTimeoutMillis: 60_000,
                        ...(forceIpv4 ? { family: 4 } : {}),
                    },
                };
            },
        }),
    ],
})
export class DatabaseModule { }
