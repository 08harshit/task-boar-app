import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { ProjectMember, ProjectRole } from '../../entities/project-member.entity';
import { CreateProjectDto } from '@shared/index';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepo: Repository<Project>,
        @InjectRepository(ProjectMember)
        private memberRepo: Repository<ProjectMember>,
    ) { }

    async findAllForUser(userId: string) {
        return this.projectRepo.find({
            where: [
                { owner_id: userId },
                { members: { user_id: userId } }
            ],
            relations: ['boards', 'members'],
        });
    }

    async findOne(id: string) {
        return this.projectRepo.findOne({
            where: { id },
            relations: ['boards', 'members'],
        });
    }

    async create(userId: string, dto: CreateProjectDto) {
        const project = this.projectRepo.create({
            ...dto,
            owner_id: userId,
        });
        const savedProject = await this.projectRepo.save(project);

        const member = this.memberRepo.create({
            project_id: savedProject.id,
            user_id: userId,
            role: ProjectRole.ADMIN,
        });
        await this.memberRepo.save(member);

        return savedProject;
    }
}
