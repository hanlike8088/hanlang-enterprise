import api from './api';
import type { AdminCodingRule, AdminEmployee, AdminOrganization, AdminPermission, AdminPosition, AdminRole, AdminSystemSetting, AdminWorkflowState, AdminWorkflowTransition } from './types';

export const adminApi = {
  getOrganizations: () => api.get('/admin/organizations').then((r) => r.data),
  getOrganizationsList: () => api.get("/admin/organizations/list").then((r) => r.data),
  getOrganization: (id: string) => api.get('/admin/organizations/' + id).then((r) => r.data),
  createOrganization: (data: Partial<AdminOrganization>) => api.post('/admin/organizations', data).then((r) => r.data),
  updateOrganization: (id: string, data: Partial<AdminOrganization>) =>
    api.patch('/admin/organizations/' + id, data).then((r) => r.data),
  deleteOrganization: (id: string) => api.delete('/admin/organizations/' + id).then((r) => r.data),
  getPositions: (orgId?: string) =>
    api.get('/admin/positions', { params: { orgId } }).then((r) => r.data),
  getPosition: (id: string) => api.get('/admin/positions/' + id).then((r) => r.data),
  createPosition: (data: Partial<AdminPosition>) => api.post('/admin/positions', data).then((r) => r.data),
  updatePosition: (id: string, data: Partial<AdminPosition>) =>
    api.patch('/admin/positions/' + id, data).then((r) => r.data),
  deletePosition: (id: string) => api.delete('/admin/positions/' + id).then((r) => r.data),
  getEmployees: (orgId?: string) =>
    api.get('/admin/employees', { params: { orgId } }).then((r) => r.data),
  getEmployee: (id: string) => api.get('/admin/employees/' + id).then((r) => r.data),
  createEmployee: (data: Partial<AdminEmployee>) => api.post('/admin/employees', data).then((r) => r.data),
  updateEmployee: (id: string, data: Partial<AdminEmployee>) =>
    api.patch('/admin/employees/' + id, data).then((r) => r.data),
  deleteEmployee: (id: string) => api.delete('/admin/employees/' + id).then((r) => r.data),
  getRoles: () => api.get('/admin/roles').then((r) => r.data),
  getRole: (id: string) => api.get('/admin/roles/' + id).then((r) => r.data),
  createRole: (data: Partial<AdminRole>) => api.post('/admin/roles', data).then((r) => r.data),
  updateRole: (id: string, data: Partial<AdminRole>) => api.patch('/admin/roles/' + id, data).then((r) => r.data),
  deleteRole: (id: string) => api.delete('/admin/roles/' + id).then((r) => r.data),
  getPermissions: () => api.get('/admin/permissions').then((r) => r.data),
  getPermission: (id: string) => api.get('/admin/permissions/' + id).then((r) => r.data),
  createPermission: (data: Partial<AdminPermission>) => api.post('/admin/permissions', data).then((r) => r.data),
  updatePermission: (id: string, data: Partial<AdminPermission>) =>
    api.patch('/admin/permissions/' + id, data).then((r) => r.data),
  deletePermission: (id: string) => api.delete('/admin/permissions/' + id).then((r) => r.data),
  assignRolePermissions: (data: { roleId: string; permIds: string[] }) =>
    api.post('/admin/assign-role-permissions', data).then((r) => r.data),
  assignPositionRole: (data: { positionId: string; roleId: string }) =>
    api.post('/admin/assign-position-role', data).then((r) => r.data),
  getPositionRoles: (positionId: string) =>
    api.get('/admin/position-roles/' + positionId).then((r) => r.data),
  getPositionRoleMappings: () => api.get('/admin/position-roles').then((r) => r.data),
  removePositionRole: (positionId: string, roleId: string) =>
    api.delete('/admin/position-roles/' + positionId + '/' + roleId).then((r) => r.data),
  getCodingRules: () => api.get('/admin/coding-rules').then((r) => r.data),
  createCodingRule: (data: Partial<AdminCodingRule>) => api.post('/admin/coding-rules', data).then((r) => r.data),
  updateCodingRule: (id: string, data: Partial<AdminCodingRule>) =>
    api.patch('/admin/coding-rules/' + id, data).then((r) => r.data),
  deleteCodingRule: (id: string) => api.delete('/admin/coding-rules/' + id).then((r) => r.data),
  generateCode: (docType: string) =>
    api.get('/admin/coding-rules/generate/' + docType).then((r) => r.data),
  getWorkflowStates: (module?: string) =>
    api.get('/admin/workflow-states', { params: { module } }).then((r) => r.data),
  createWorkflowState: (data: Partial<AdminWorkflowState>) => api.post('/admin/workflow-states', data).then((r) => r.data),
  updateWorkflowState: (id: string, data: Partial<AdminWorkflowState>) =>
    api.patch('/admin/workflow-states/' + id, data).then((r) => r.data),
  deleteWorkflowState: (id: string) =>
    api.delete('/admin/workflow-states/' + id).then((r) => r.data),
  getWorkflowTransitions: (module?: string) =>
    api.get('/admin/workflow-transitions', { params: { module } }).then((r) => r.data),
  createWorkflowTransition: (data: Partial<AdminWorkflowTransition>) =>
    api.post('/admin/workflow-transitions', data).then((r) => r.data),
  updateWorkflowTransition: (id: string, data: Partial<AdminWorkflowTransition>) =>
    api.patch('/admin/workflow-transitions/' + id, data).then((r) => r.data),
  deleteWorkflowTransition: (id: string) =>
    api.delete('/admin/workflow-transitions/' + id).then((r) => r.data),
  getSystemSettings: () => api.get('/admin/system-settings').then((r) => r.data),
  upsertSystemSetting: (data: Partial<AdminSystemSetting>) => api.post('/admin/system-settings', data).then((r) => r.data),
  deleteSystemSetting: (id: string) =>
    api.delete('/admin/system-settings/' + id).then((r) => r.data),
};
