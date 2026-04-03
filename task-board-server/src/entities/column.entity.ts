import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { Task } from './task.entity';
import { IColumn } from '@shared/index';

@Entity('columns')
export class BoardColumn implements IColumn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    board_id: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @OneToMany(() => Task, (task) => task.column)
    tasks: Task[];
}
