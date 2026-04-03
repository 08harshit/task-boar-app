import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CreateProjectDto } from '@shared/index';

@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
    constructor(private service: ProjectsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.service.findAllForUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreateProjectDto) {
        return this.service.create(req.user.id, dto);
    }
}
