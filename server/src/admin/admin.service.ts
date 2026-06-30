import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';
import { CreatePositionDto, UpdatePositionDto } from './dto/create-position.dto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { CreateRoleDto, UpdateRoleDto, AssignRolePermissionsDto, AssignPositionRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/create-permission.dto';
import { CreateCodingRuleDto, UpdateCodingRuleDto, CreateWorkflowStateDto, CreateWorkflowTransitionDto, CreateSystemSettingDto } from './dto/create-coding-rule.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ========== 组织管理 ==========

  async createOrganization(dto: CreateOrganizationDto) {
    return this.prisma.adminOrganization.create({ data: dto });
  }

  async getOrganizations() {
    const orgs = await this.prisma.adminOrganization.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { positions: true, employees: true } } },
    });
    return orgs;
  }

  async getOrganization(id: string) {
    const org = await this.prisma.adminOrganization.findUnique({
      where: { id },
      include: {
        children: true,
        positions: true,
        _count: { select: { employees: true } },
      },
    });
    if (!org) throw new NotFoundException('组织不存在');
    return org;
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    await this.getOrganization(id);
    return this.prisma.adminOrganization.update({ where: { id }, data: dto });
  }

  async deleteOrganization(id: string) {
    await this.getOrganization(id);
    return this.prisma.adminOrganization.delete({ where: { id } });
  }

  // ========== 岗位管理 ==========

  async createPosition(dto: CreatePositionDto) {
    return this.prisma.adminPosition.create({ data: dto });
  }

  async getPositions(orgId?: string) {
    const where = orgId ? { orgId } : {};
    return this.prisma.adminPosition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { organization: { select: { id: true, orgName: true } } },
    });
  }

  async getPosition(id: string) {
    const pos = await this.prisma.adminPosition.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!pos) throw new NotFoundException('岗位不存在');
    return pos;
  }

  async updatePosition(id: string, dto: UpdatePositionDto) {
    await this.getPosition(id);
    return this.prisma.adminPosition.update({ where: { id }, data: dto });
  }

  async deletePosition(id: string) {
    await this.getPosition(id);
    return this.prisma.adminPosition.delete({ where: { id } });
  }

  // ========== 员工管理 ==========

  async createEmployee(dto: CreateEmployeeDto) {
    const { positionIds, ...employeeData } = dto;
    const data: any = { ...employeeData };
    if (dto.hireDate) data.hireDate = new Date(dto.hireDate);

    if (positionIds && positionIds.length > 0) {
      data.positions = {
        create: positionIds.map((posId: string) => ({ positionId: posId })),
      };
    }

    return this.prisma.adminEmployee.create({
      data,
      include: {
        organization: { select: { id: true, orgName: true } },
        positions: { include: { position: true } },
      },
    });
  }

  async getEmployees(orgId?: string) {
    const where = orgId ? { orgId } : {};
    const employees = await this.prisma.adminEmployee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, orgName: true } },
        positions: { include: { position: true } },
      },
    });
    // Attach linked username from User table (matched by name)
    const names = employees.map(e => e.name).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { name: { in: names } },
      select: { name: true, username: true },
    });
    const userMap = {};
    for (const u of users) userMap[u.name] = u.username;
    return employees.map(e => ({ ...e, username: userMap[e.name] || null }));
  }

  async getEmployee(id: string) {
    const emp = await this.prisma.adminEmployee.findUnique({
      where: { id },
      include: {
        organization: true,
        positions: { include: { position: true } },
      },
    });
    if (!emp) throw new NotFoundException('员工不存在');
    return emp;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    await this.getEmployee(id);
    const { positionIds, ...employeeData } = dto;
    const data: any = { ...employeeData };
    if (dto.hireDate) data.hireDate = new Date(dto.hireDate);

    if (positionIds !== undefined) {
      await this.prisma.adminEmployeePosition.deleteMany({ where: { employeeId: id } });
      if (positionIds.length > 0) {
        await this.prisma.adminEmployeePosition.createMany({
          data: positionIds.map((posId: string) => ({ employeeId: id, positionId: posId })),
        });
      }
    }

    return this.prisma.adminEmployee.update({
      where: { id },
      data,
      include: {
        organization: { select: { id: true, orgName: true } },
        positions: { include: { position: true } },
      },
    });
  }

  async deleteEmployee(id: string) {
    await this.getEmployee(id);
    return this.prisma.adminEmployee.delete({ where: { id } });
  }

  // ========== 角色管理 ==========

  async createRole(dto: CreateRoleDto) {
    const { permIds, ...roleData } = dto;
    const data: any = { ...roleData };
    if (permIds && permIds.length > 0) {
      data.rolePermissions = {
        create: permIds.map((permId: string) => ({ permId })),
      };
    }
    return this.prisma.adminRole.create({
      data,
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { positionRoles: true } },
      },
    });
  }

  async getRoles() {
    return this.prisma.adminRole.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { positionRoles: true } },
      },
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.adminRole.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        positionRoles: { include: { position: { select: { id: true, positionName: true } } } },
      },
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.getRole(id);
    const { permIds, ...roleData } = dto;
    const data: any = { ...roleData };

    if (permIds !== undefined) {
      await this.prisma.adminRolePermission.deleteMany({ where: { roleId: id } });
      if (permIds.length > 0) {
        await this.prisma.adminRolePermission.createMany({
          data: permIds.map((permId: string) => ({ roleId: id, permId })),
        });
      }
    }

    return this.prisma.adminRole.update({
      where: { id },
      data,
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async deleteRole(id: string) {
    await this.getRole(id);
    await this.prisma.adminRolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.adminPositionRole.deleteMany({ where: { roleId: id } });
    return this.prisma.adminRole.delete({ where: { id } });
  }

  // ========== 权限管理 ==========

  async createPermission(dto: CreatePermissionDto) {
    return this.prisma.adminPermission.create({ data: dto });
  }

  async getPermissions() {
    return this.prisma.adminPermission.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { rolePermissions: true } } },
    });
  }

  async getPermission(id: string) {
    const perm = await this.prisma.adminPermission.findUnique({
      where: { id },
      include: { _count: { select: { rolePermissions: true } } },
    });
    if (!perm) throw new NotFoundException('权限不存在');
    return perm;
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    await this.getPermission(id);
    return this.prisma.adminPermission.update({ where: { id }, data: dto });
  }

  async deletePermission(id: string) {
    await this.getPermission(id);
    await this.prisma.adminRolePermission.deleteMany({ where: { permId: id } });
    return this.prisma.adminPermission.delete({ where: { id } });
  }

  // ========== 角色-权限分配 ==========

  async assignPermissionsToRole(dto: AssignRolePermissionsDto) {
    await this.prisma.adminRolePermission.deleteMany({ where: { roleId: dto.roleId } });
    if (dto.permIds.length > 0) {
      await this.prisma.adminRolePermission.createMany({
        data: dto.permIds.map((permId: string) => ({ roleId: dto.roleId, permId })),
      });
    }
    return this.getRole(dto.roleId);
  }

  // ========== 岗位-角色绑定 ==========

  async assignRoleToPosition(dto: AssignPositionRoleDto) {
    await this.prisma.adminPositionRole.upsert({
      where: {
        positionId_roleId: { positionId: dto.positionId, roleId: dto.roleId },
      },
      create: { positionId: dto.positionId, roleId: dto.roleId },
      update: {},
    });
    return { positionId: dto.positionId, roleId: dto.roleId };
  }

  async getPositionRoles(positionId: string) {
    return this.prisma.adminPositionRole.findMany({
      where: { positionId },
      include: { role: true },
    });
  }

  async getPositionRoleMappings() {
    return this.prisma.adminPositionRole.findMany({
      include: {
        position: { select: { id: true, positionName: true } },
        role: { select: { id: true, roleName: true, roleCode: true } },
      },
    });
  }

  async removePositionRole(positionId: string, roleId: string) {
    return this.prisma.adminPositionRole.deleteMany({
      where: { positionId, roleId },
    });
  }
  // ========== Coding Rules ==========

  async getCodingRules() {
    return this.prisma.adminCodingRule.findMany({ orderBy: { docType: 'asc' } });
  }

  async createCodingRule(dto: CreateCodingRuleDto) {
    return this.prisma.adminCodingRule.create({ data: dto });
  }

  async updateCodingRule(id: string, dto: UpdateCodingRuleDto) {
    const rule = await this.prisma.adminCodingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('规则不存在');
    return this.prisma.adminCodingRule.update({ where: { id }, data: dto });
  }

  async deleteCodingRule(id: string) {
    const rule = await this.prisma.adminCodingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('规则不存在');
    return this.prisma.adminCodingRule.delete({ where: { id } });
  }

  async generateCode(docType: string): Promise<string> {
    const rule = await this.prisma.adminCodingRule.findUnique({ where: { docType } });
    if (!rule) throw new NotFoundException('未找到编码规则: ' + docType);
    const year = new Date().getFullYear();
    const yearStr = rule.yearDigits === 2 ? String(year).slice(-2) : String(year);
    const serial = String(rule.currentSerial).padStart(rule.serialDigits, '0');
    const code = rule.prefix + rule.separator + yearStr + rule.separator + serial;
    await this.prisma.adminCodingRule.update({ where: { id: rule.id }, data: { currentSerial: rule.currentSerial + 1 } });
    return code;
  }

  // ========== Workflow States ==========

  async getWorkflowStates(module?: string) {
    const where = module ? { module } : {};
    return this.prisma.adminWorkflowState.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async createWorkflowState(dto: CreateWorkflowStateDto) {
    return this.prisma.adminWorkflowState.create({ data: dto });
  }

  async updateWorkflowState(id: string, dto: Partial<CreateWorkflowStateDto>) {
    const state = await this.prisma.adminWorkflowState.findUnique({ where: { id } });
    if (!state) throw new NotFoundException('工作流状态不存在');
    return this.prisma.adminWorkflowState.update({ where: { id }, data: dto });
  }

  async deleteWorkflowState(id: string) {
    const state = await this.prisma.adminWorkflowState.findUnique({ where: { id } });
    if (!state) throw new NotFoundException('工作流状态不存在');
    return this.prisma.adminWorkflowState.delete({ where: { id } });
  }

  // ========== Workflow Transitions ==========

  async getWorkflowTransitions(module?: string) {
    const where = module ? { module } : {};
    return this.prisma.adminWorkflowTransition.findMany({
      where, orderBy: { sortOrder: 'asc' },
      select: { id: true, module: true, transitionName: true, fromStateId: true, toStateId: true, requiredPerm: true, sortOrder: true },
    });
  }

  async createWorkflowTransition(dto: CreateWorkflowTransitionDto) {
    return this.prisma.adminWorkflowTransition.create({ data: dto });
  }

  async updateWorkflowTransition(id: string, dto: Partial<CreateWorkflowTransitionDto>) {
    const trans = await this.prisma.adminWorkflowTransition.findUnique({ where: { id } });
    if (!trans) throw new NotFoundException('工作流转换不存在');
    return this.prisma.adminWorkflowTransition.update({ where: { id }, data: dto });
  }

  async deleteWorkflowTransition(id: string) {
    const trans = await this.prisma.adminWorkflowTransition.findUnique({ where: { id } });
    if (!trans) throw new NotFoundException('工作流转换不存在');
    return this.prisma.adminWorkflowTransition.delete({ where: { id } });
  }

  // ========== System Settings ==========

  async getSystemSettings() {
    return this.prisma.adminSystemSetting.findMany({ orderBy: { settingKey: 'asc' } });
  }

  async upsertSystemSetting(dto: CreateSystemSettingDto) {
    return this.prisma.adminSystemSetting.upsert({
      where: { settingKey: dto.settingKey },
      create: dto,
      update: { settingValue: dto.settingValue, description: dto.description },
    });
  }

  async deleteSystemSetting(id: string) {
    const setting = await this.prisma.adminSystemSetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('系统设置不存在');
    return this.prisma.adminSystemSetting.delete({ where: { id } });
  }
}