import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateCodingRuleDto, UpdateCodingRuleDto, CreateWorkflowStateDto, CreateWorkflowTransitionDto, CreateSystemSettingDto } from './dto/create-coding-rule.dto';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import { CreatePositionDto, UpdatePositionDto } from './dto/create-position.dto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { CreateRoleDto, UpdateRoleDto, AssignRolePermissionsDto, AssignPositionRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { RequirePermission } from '../common/guards/permission.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========== 组织管理 ==========
  @RequirePermission('admin', 'org:write')
  @Post('organizations')
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.adminService.createOrganization(dto);
  }

  @RequirePermission('admin', 'org:read')
  @Get('organizations')
  getOrganizations() {
    return this.adminService.getOrganizations();
  }

  @RequirePermission('admin', 'org:read')
  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.adminService.getOrganization(id);
  }

  @RequirePermission('admin', 'org:write')
  @Patch('organizations/:id')
  updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.adminService.updateOrganization(id, dto);
  }

  @RequirePermission('admin', 'org:write')
  @Delete('organizations/:id')
  deleteOrganization(@Param('id') id: string) {
    return this.adminService.deleteOrganization(id);
  }

  // ========== 岗位管理 ==========
  @RequirePermission('admin', 'position:write')
  @Post('positions')
  createPosition(@Body() dto: CreatePositionDto) {
    return this.adminService.createPosition(dto);
  }

  @RequirePermission('admin', 'position:read')
  @Get('positions')
  getPositions(@Query('orgId') orgId?: string) {
    return this.adminService.getPositions(orgId);
  }

  @RequirePermission('admin', 'position:read')
  @Get('positions/:id')
  getPosition(@Param('id') id: string) {
    return this.adminService.getPosition(id);
  }

  @RequirePermission('admin', 'position:write')
  @Patch('positions/:id')
  updatePosition(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.adminService.updatePosition(id, dto);
  }

  @RequirePermission('admin', 'position:write')
  @Delete('positions/:id')
  deletePosition(@Param('id') id: string) {
    return this.adminService.deletePosition(id);
  }

  // ========== 员工管理 ==========
  @RequirePermission('admin', 'employee:write')
  @Post('employees')
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.adminService.createEmployee(dto);
  }

  @RequirePermission('admin', 'employee:read')
  @Get('employees')
  getEmployees(@Query('orgId') orgId?: string) {
    return this.adminService.getEmployees(orgId);
  }

  @RequirePermission('admin', 'employee:read')
  @Get('employees/:id')
  getEmployee(@Param('id') id: string) {
    return this.adminService.getEmployee(id);
  }

  @RequirePermission('admin', 'employee:write')
  @Patch('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.adminService.updateEmployee(id, dto);
  }

  @RequirePermission('admin', 'employee:write')
  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) {
    return this.adminService.deleteEmployee(id);
  }

  // ========== 角色管理 ==========
  @RequirePermission('admin', 'role:write')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto);
  }

  @RequirePermission('admin', 'role:read')
  @Get('roles')
  getRoles() {
    return this.adminService.getRoles();
  }

  @RequirePermission('admin', 'role:read')
  @Get('roles/:id')
  getRole(@Param('id') id: string) {
    return this.adminService.getRole(id);
  }

  @RequirePermission('admin', 'role:write')
  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(id, dto);
  }

  @RequirePermission('admin', 'role:write')
  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  // ========== 权限管理 ==========
  @RequirePermission('admin', 'permission:write')
  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.adminService.createPermission(dto);
  }

  @RequirePermission('admin', 'permission:read')
  @Get('permissions')
  getPermissions() {
    return this.adminService.getPermissions();
  }

  @RequirePermission('admin', 'permission:read')
  @Get('permissions/:id')
  getPermission(@Param('id') id: string) {
    return this.adminService.getPermission(id);
  }

  @RequirePermission('admin', 'permission:write')
  @Patch('permissions/:id')
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.adminService.updatePermission(id, dto);
  }

  @RequirePermission('admin', 'permission:write')
  @Delete('permissions/:id')
  deletePermission(@Param('id') id: string) {
    return this.adminService.deletePermission(id);
  }

  // ========== 角色-权限分配 ==========
  @RequirePermission('admin', 'role:write')
  @Post('assign-role-permissions')
  assignPermissionsToRole(@Body() dto: AssignRolePermissionsDto) {
    return this.adminService.assignPermissionsToRole(dto);
  }

  // ========== 岗位-角色绑定 ==========
  @RequirePermission('admin', 'role:write')
  @Post('assign-position-role')
  assignRoleToPosition(@Body() dto: AssignPositionRoleDto) {
    return this.adminService.assignRoleToPosition(dto);
  }

  @RequirePermission('admin', 'role:read')
  @Get('position-roles')
  getPositionRoleMappings() {
    return this.adminService.getPositionRoleMappings();
  }

  @RequirePermission('admin', 'role:read')
  @Get('position-roles/:positionId')
  getPositionRoles(@Param('positionId') positionId: string) {
    return this.adminService.getPositionRoles(positionId);
  }

  @RequirePermission('admin', 'role:write')
  @Delete('position-roles/:positionId/:roleId')
  removePositionRole(@Param('positionId') positionId: string, @Param('roleId') roleId: string) {
    return this.adminService.removePositionRole(positionId, roleId);
  }
  // ========== Coding Rules ==========
  @RequirePermission('admin', 'codingrule:read')
  @Get('coding-rules')
  getCodingRules() { return this.adminService.getCodingRules(); }

  @RequirePermission('admin', 'codingrule:write')
  @Post('coding-rules')
  createCodingRule(@Body() dto: CreateCodingRuleDto) { return this.adminService.createCodingRule(dto); }

  @RequirePermission('admin', 'codingrule:write')
  @Patch('coding-rules/:id')
  updateCodingRule(@Param('id') id: string, @Body() dto: UpdateCodingRuleDto) { return this.adminService.updateCodingRule(id, dto); }

  @RequirePermission('admin', 'codingrule:write')
  @Delete('coding-rules/:id')
  deleteCodingRule(@Param('id') id: string) { return this.adminService.deleteCodingRule(id); }

  @RequirePermission('admin', 'codingrule:read')
  @Get('coding-rules/generate/:docType')
  generateCode(@Param('docType') docType: string) { return this.adminService.generateCode(docType); }

  // ========== Workflow States ==========
  @RequirePermission('admin', 'workflow:read')
  @Get('workflow-states')
  getWorkflowStates(@Query('module') module?: string) { return this.adminService.getWorkflowStates(module); }

  @RequirePermission('admin', 'workflow:write')
  @Post('workflow-states')
  createWorkflowState(@Body() dto: CreateWorkflowStateDto) { return this.adminService.createWorkflowState(dto); }

  @RequirePermission('admin', 'workflow:write')
  @Patch('workflow-states/:id')
  updateWorkflowState(@Param('id') id: string, @Body() dto: CreateWorkflowStateDto) { return this.adminService.updateWorkflowState(id, dto); }

  @RequirePermission('admin', 'workflow:write')
  @Delete('workflow-states/:id')
  deleteWorkflowState(@Param('id') id: string) { return this.adminService.deleteWorkflowState(id); }

  // ========== Workflow Transitions ==========
  @RequirePermission('admin', 'workflow:read')
  @Get('workflow-transitions')
  async getWorkflowTransitions(@Query('module') module?: string) {
    const modules = [
      'sampling_wo','drawing','plm_product','plm_bom','plm_document',
      'npi_project','npi_trial','npi_issue','npi_approval',
      'crm_quote','crm_order','crm_complaint','crm_reconciliation','crm_payment',
      'purchase_order','equipment','maintenance_wo','repair_wo',
      'ncr','capa','mfg_order','mfg_operation','mfg_plan',
      'erp_material','erp_work_order'
    ];
    if (module) return this.adminService.getWorkflowTransitions(module);
    const result = {};
    for (const m of modules) { result[m] = await this.adminService.getWorkflowTransitions(m); }
    return result;
  }

  @RequirePermission('admin', 'workflow:write')
  @Post('workflow-transitions')
  createWorkflowTransition(@Body() dto: CreateWorkflowTransitionDto) { return this.adminService.createWorkflowTransition(dto); }

  @RequirePermission('admin', 'workflow:write')
  @Patch('workflow-transitions/:id')
  updateWorkflowTransition(@Param('id') id: string, @Body() dto: CreateWorkflowTransitionDto) { return this.adminService.updateWorkflowTransition(id, dto); }

  @RequirePermission('admin', 'workflow:write')
  @Delete('workflow-transitions/:id')
  deleteWorkflowTransition(@Param('id') id: string) { return this.adminService.deleteWorkflowTransition(id); }



  // ========== System Settings ==========
  @RequirePermission('admin', 'setting:read')
  @Get('system-settings')
  getSystemSettings() { return this.adminService.getSystemSettings(); }

  @RequirePermission('admin', 'setting:write')
  @Post('system-settings')
  upsertSystemSetting(@Body() dto: CreateSystemSettingDto) { return this.adminService.upsertSystemSetting(dto); }

  @RequirePermission('admin', 'setting:write')
  @Delete('system-settings/:id')
  deleteSystemSetting(@Param('id') id: string) { return this.adminService.deleteSystemSetting(id); }
}