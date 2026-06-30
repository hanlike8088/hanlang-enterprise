import api from './api';

export const workflowApi = {
  getTransitions: (module: string, status: string) =>
    api.get('/admin/workflow/transitions/' + module + '/' + encodeURIComponent(status)).then(r => r.data),
  execute: (dto: {
    module: string; docType: string; docId: string; docCode: string;
    fromStatus: string; transitionId: string; requestedBy?: string;
  }) => api.post('/admin/workflow/execute', dto).then(r => r.data),
  getSummary: (module: string) =>
    api.get('/admin/workflow/summary/' + module).then(r => r.data),
};
