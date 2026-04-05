import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BoardColumn } from './column.entity';
import { ITask } from '@shared/index';

@Entity('tasks')
export class Task implements ITask {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    column_id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ type: 'enum', enum: ['low', 'medium', 'high'], default: 'medium' })
    priority: 'low' | 'medium' | 'high';

    @Column({ type: 'timestamp with time zone', nullable: true })
    due_date: Date;

    @Column({ type: 'simple-array', nullable: true })
    labels: string[];

    @Column({ default: 0 })
    order: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => BoardColumn, (column) => column.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'column_id' })
    column: BoardColumn;
}
