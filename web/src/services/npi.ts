import api from './api';
import type { NpiApproval, NpiIssue, NpiProject, NpiTrialRun } from './types';
import dayjs from 'dayjs';

export const npiApi = {
  getProjects: () => api.get('/npi/projects').then((r) => r.data),
  getProject: (id: string) => api.get('/npi/projects/' + id).then((r) => r.data),
  createProject: (data: Partial<NpiProject>) =>
    api
      .post('/npi/projects', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        targetDate: dayjs(data.targetDate).toISOString(),
      })
      .then((r) => r.data),
  updateProject: (id: string, data: Partial<NpiProject>) =>
    api
      .patch('/npi/projects/' + id, {
        ...data,
        ...(data.startDate ? { startDate: dayjs(data.startDate).toISOString() } : {}),
        ...(data.targetDate ? { targetDate: dayjs(data.targetDate).toISOString() } : {}),
        ...(data.actualEndDate ? { actualEndDate: dayjs(data.actualEndDate).toISOString() } : {}),
      })
      .then((r) => r.data),
  deleteProject: (id: string) => api.delete('/npi/projects/' + id).then((r) => r.data),
  getTrialRuns: (projectId?: string) =>
    api.get('/npi/trial-runs', { params: { projectId } }).then((r) => r.data),
  createTrialRun: (data: Partial<NpiTrialRun>) =>
    api
      .post('/npi/trial-runs', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: data.endDate ? dayjs(data.endDate).toISOString() : undefined,
      })
      .then((r) => r.data),
  updateTrialRun: (id: string, data: Partial<NpiTrialRun>) =>
    api
      .patch('/npi/trial-runs/' + id, {
        ...data,
        ...(data.startDate ? { startDate: dayjs(data.startDate).toISOString() } : {}),
        ...(data.endDate ? { endDate: dayjs(data.endDate).toISOString() } : {}),
      })
      .then((r) => r.data),
  getIssues: (trialRunId?: string) =>
    api.get('/npi/issues', { params: { trialRunId } }).then((r) => r.data),
  createIssue: (data: Partial<NpiIssue>) => api.post('/npi/issues', data).then((r) => r.data),
  updateIssue: (id: string, data: Partial<NpiIssue>) => api.patch('/npi/issues/' + id, data).then((r) => r.data),
  getApprovals: (projectId?: string) =>
    api.get('/npi/approvals', { params: { projectId } }).then((r) => r.data),
  createApproval: (data: Partial<NpiApproval>) => api.post('/npi/approvals', data).then((r) => r.data),
  reviewApproval: (id: string, data: Partial<NpiApproval>) =>
    api.patch('/npi/approvals/' + id + '/review', data).then((r) => r.data),
};
