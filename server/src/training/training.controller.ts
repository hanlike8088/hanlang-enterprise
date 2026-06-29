import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { TrainingService } from './training.service';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('training')
export class TrainingController {
  constructor(private readonly s: TrainingService) {}

  @RequirePermission('training', 'training:write')
  @Post('courses') createCourse(@Body() dto: any) { return this.s.createCourse(dto); }
  @RequirePermission('training', 'training:read')
  @Get('courses') findAllCourses(@Query('type') t?: string, @Query('category') c?: string) { return this.s.findAllCourses(t, c); }
  @RequirePermission('training', 'training:read')
  @Get('courses/:id') findOneCourse(@Param('id') id: string) { return this.s.findOneCourse(id); }
  @RequirePermission('training', 'training:write')
  @Patch('courses/:id') updateCourse(@Param('id') id: string, @Body() dto: any) { return this.s.updateCourse(id, dto); }
  @RequirePermission('training', 'training:write')
  @Delete('courses/:id') removeCourse(@Param('id') id: string) { return this.s.removeCourse(id); }

  @RequirePermission('training', 'training:write')
  @Post('records') createRecord(@Body() dto: any) { return this.s.createRecord(dto); }
  @RequirePermission('training', 'training:read')
  @Get('records') findAllRecords(@Query('employeeId') eid?: string, @Query('courseId') cid?: string) { return this.s.findAllRecords(eid, cid); }
  @RequirePermission('training', 'training:read')
  @Get('records/employee/:employeeId') getEmployeeRecords(@Param('employeeId') eid: string) { return this.s.getEmployeeRecords(eid); }

  @RequirePermission('training', 'training:write')
  @Post('qualifications') createQualification(@Body() dto: any) { return this.s.createQualification(dto); }
  @RequirePermission('training', 'training:read')
  @Get('qualifications') findAllQualifications(@Query('employeeId') eid?: string, @Query('qualType') qt?: string, @Query('status') st?: string) { return this.s.findAllQualifications(eid, qt, st); }
  @RequirePermission('training', 'training:read')
  @Get('qualifications/expiring') getExpiring(@Query('days') days?: string) { return this.s.getExpiringQualifications(days ? parseInt(days) : 90); }
  @RequirePermission('training', 'training:write')
  @Patch('qualifications/:id') updateQualification(@Param('id') id: string, @Body() dto: any) { return this.s.updateQualification(id, dto); }
  @RequirePermission('training', 'training:write')
  @Delete('qualifications/:id') removeQualification(@Param('id') id: string) { return this.s.removeQualification(id); }

  @RequirePermission('training', 'training:write')
  @Post('skills') createSkill(@Body() dto: any) { return this.s.createSkill(dto); }
  @RequirePermission('training', 'training:read')
  @Get('skills') findAllSkills(@Query('employeeId') eid?: string, @Query('category') c?: string) { return this.s.findAllSkills(eid, c); }
  @RequirePermission('training', 'training:write')
  @Patch('skills/:id') updateSkill(@Param('id') id: string, @Body() dto: any) { return this.s.updateSkill(id, dto); }
  @RequirePermission('training', 'training:write')
  @Delete('skills/:id') removeSkill(@Param('id') id: string) { return this.s.removeSkill(id); }

  @RequirePermission('training', 'training:write')
  @Post('plans') createPlan(@Body() dto: any) { return this.s.createPlan(dto); }
  @RequirePermission('training', 'training:read')
  @Get('plans') findAllPlans(@Query('year') y?: string) { return this.s.findAllPlans(y ? parseInt(y) : undefined); }
  @RequirePermission('training', 'training:write')
  @Patch('plans/:id') updatePlan(@Param('id') id: string, @Body() dto: any) { return this.s.updatePlan(id, dto); }
  @RequirePermission('training', 'training:write')
  @Delete('plans/:id') removePlan(@Param('id') id: string) { return this.s.removePlan(id); }

  @RequirePermission('training', 'training:read')
  @Get('stats') getStats() { return this.s.getStats(); }
}
