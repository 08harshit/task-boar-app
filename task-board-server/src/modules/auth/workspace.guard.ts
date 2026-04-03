import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from '../../entities/project-member.entity';

@Injectable()
export class WorkspaceGuard implements CanActivate {
    constructor(
        @InjectRepository(ProjectMember)
        private memberRepo: Repository<ProjectMember>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) return false;

        // We expect a projectId to be in the Query or Body or Params
        const projectId = request.query.projectId || request.body.project_id || request.params.projectId;

        if (!projectId) {
            // If no projectId, we are likely creating a project or listing all, 
            // which should be handled by SupabaseAuthGuard + findAll logic.
            return true;
        }

        const member = await this.memberRepo.findOne({
            where: { project_id: projectId, user_id: user.id },
        });

        if (!member) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        return true;
    }
}
