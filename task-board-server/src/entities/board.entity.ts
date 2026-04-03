import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BoardColumn } from './column.entity';
import { IBoard } from '@shared/index';

@Entity('boards')
export class Board implements IBoard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => BoardColumn, (column) => column.board)
    columns: BoardColumn[];
}
