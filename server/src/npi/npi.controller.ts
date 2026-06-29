import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { NpiService } from './npi.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { CreateTrialRunDto, UpdateTrialRunDto } from './dto/create-trial-run.dto';
import { CreateIssueDto, UpdateIssueDto } from './dto/create-issue.dto';
import { CreateApprovalDto, ReviewApprovalDto } from './dto/create-approval.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('npi')
export class NpiController {
  constructor(private readonly npiService: NpiService) {}

  // Projects
  @RequirePermission('npi', 'project:write')
  @Post('projects')
  createProject(@Body() dto: CreateProjectDto) {
    return this.npiService.createProject(dto);
  }

  @RequirePermission('npi', 'project:read')
  @Get('projects')
  getProjects() {
    return this.npiService.getProjects();
  }

  @RequirePermission('npi', 'project:read')
  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.npiService.getProject(id);
  }

  @RequirePermission('npi', 'project:write')
  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.npiService.updateProject(id, dto);
  }

  @RequirePermission('npi', 'project:write')
  @Delete('projects/:id')
  deleteProject(@Param('id') id: string) {
    return this.npiService.deleteProject(id);
  }

  @RequirePermission('npi', 'project:write')
  @Patch('projects/:id/transition')
  transitionProject(@Param('id') id: string, @Body('status') status: string) {
    return this.npiService.transitionProject(id, status);
  }

  // Trial Runs
  @RequirePermission('npi', 'trial:write')
  @Post('trial-runs')
  createTrialRun(@Body() dto: CreateTrialRunDto) {
    return this.npiService.createTrialRun(dto);
  }

  @RequirePermission('npi', 'trial:read')
  @Get('trial-runs')
  getTrialRuns(@Query('projectId') projectId?: string) {
    return this.npiService.getTrialRuns(projectId);
  }

  @RequirePermission('npi', 'trial:read')
  @Get('trial-runs/:id')
  getTrialRun(@Param('id') id: string) {
    return this.npiService.getTrialRun(id);
  }

  @RequirePermission('npi', 'trial:write')
  @Patch('trial-runs/:id')
  updateTrialRun(@Param('id') id: string, @Body() dto: UpdateTrialRunDto) {
    return this.npiService.updateTrialRun(id, dto);
  }

  @RequirePermission('npi', 'trial:write')
  @Patch('trial-runs/:id/transition')
  transitionTrialRun(@Param('id') id: string, @Body('status') status: string) {
    return this.npiService.transitionTrialRun(id, status);
  }

  // Issues
  @RequirePermission('npi', 'issue:write')
  @Post('issues')
  createIssue(@Body() dto: CreateIssueDto) {
    return this.npiService.createIssue(dto);
  }

  @RequirePermission('npi', 'issue:read')
  @Get('issues')
  getIssues(@Query('trialRunId') trialRunId?: string) {
    return this.npiService.getIssues(trialRunId);
  }

  @RequirePermission('npi', 'issue:read')
  @Get('issues/:id')
  getIssue(@Param('id') id: string) {
    return this.npiService.getIssue(id);
  }

  @RequirePermission('npi', 'issue:write')
  @Patch('issues/:id')
  updateIssue(@Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.npiService.updateIssue(id, dto);
  }

  @RequirePermission('npi', 'issue:write')
  @Patch('issues/:id/transition')
  transitionIssue(@Param('id') id: string, @Body('status') status: string) {
    return this.npiService.transitionIssue(id, status);
  }

  // Approvals
  @RequirePermission('npi', 'approval:write')
  @Post('approvals')
  createApproval(@Body() dto: CreateApprovalDto) {
    return this.npiService.createApproval(dto);
  }

  @RequirePermission('npi', 'approval:read')
  @Get('approvals')
  getApprovals(@Query('projectId') projectId?: string) {
    return this.npiService.getApprovals(projectId);
  }

  @RequirePermission('npi', 'approval:write')
  @Patch('approvals/:id/transition')
  transitionApproval(@Param('id') id: string, @Body('status') status: string, @Body('approver') approver?: string, @Body('comment') comment?: string) {
    return this.npiService.transitionApproval(id, status, approver, comment);
  }

  @RequirePermission('npi', 'approval:write')
  @Patch('approvals/:id/review')
  reviewApproval(@Param('id') id: string, @Body() dto: ReviewApprovalDto) {
    return this.npiService.reviewApproval(id, dto);
  }
}
