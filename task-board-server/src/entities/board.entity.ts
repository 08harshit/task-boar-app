import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BoardColumn } from './column.entity';
import { Project } from './project.entity';
import { IBoard } from '@shared/index';

@Entity('boards')
export class Board implements IBoard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'uuid', nullable: true })
    project_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => BoardColumn, (column) => column.board)
    columns: BoardColumn[];

    @ManyToOne(() => Project, (project) => project.boards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;
}
