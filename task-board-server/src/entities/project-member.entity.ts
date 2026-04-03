import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

export enum ProjectRole {
    ADMIN = 'admin',
    MEMBER = 'member'
}

@Entity('project_members')
export class ProjectMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    project_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({
        type: 'enum',
        enum: ProjectRole,
        default: ProjectRole.MEMBER
    })
    role: ProjectRole;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;
}
