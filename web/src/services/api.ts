import axios from 'axios';
import dayjs from 'dayjs';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

export const npiApi = {
  getProjects: () => api.get('/npi/projects').then((r) => r.data),
  getProject: (id: string) => api.get('/npi/projects/' + id).then((r) => r.data),
  createProject: (data: any) =>
    api
      .post('/npi/projects', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        targetDate: dayjs(data.targetDate).toISOString(),
      })
      .then((r) => r.data),
  updateProject: (id: string, data: any) =>
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
  createTrialRun: (data: any) =>
    api
      .post('/npi/trial-runs', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: data.endDate ? dayjs(data.endDate).toISOString() : undefined,
      })
      .then((r) => r.data),
  updateTrialRun: (id: string, data: any) =>
    api
      .patch('/npi/trial-runs/' + id, {
        ...data,
        ...(data.startDate ? { startDate: dayjs(data.startDate).toISOString() } : {}),
        ...(data.endDate ? { endDate: dayjs(data.endDate).toISOString() } : {}),
      })
      .then((r) => r.data),
  getIssues: (trialRunId?: string) =>
    api.get('/npi/issues', { params: { trialRunId } }).then((r) => r.data),
  createIssue: (data: any) => api.post('/npi/issues', data).then((r) => r.data),
  updateIssue: (id: string, data: any) => api.patch('/npi/issues/' + id, data).then((r) => r.data),
  getApprovals: (projectId?: string) =>
    api.get('/npi/approvals', { params: { projectId } }).then((r) => r.data),
  createApproval: (data: any) => api.post('/npi/approvals', data).then((r) => r.data),
  reviewApproval: (id: string, data: any) =>
    api.patch('/npi/approvals/' + id + '/review', data).then((r) => r.data),
};

export const plmApi = {
  getProducts: () => api.get('/plm/products').then((r) => r.data),
  getProduct: (id: string) => api.get('/plm/products/' + id).then((r) => r.data),
  createProduct: (data: any) => api.post('/plm/products', data).then((r) => r.data),
  updateProduct: (id: string, data: any) =>
    api.patch('/plm/products/' + id, data).then((r) => r.data),
  deleteProduct: (id: string) => api.delete('/plm/products/' + id).then((r) => r.data),
  getBoms: (productId?: string) =>
    api.get('/plm/boms', { params: { productId } }).then((r) => r.data),
  createBom: (data: any) => api.post('/plm/boms', data).then((r) => r.data),
  updateBom: (id: string, data: any) => api.patch('/plm/boms/' + id, data).then((r) => r.data),
  deleteBom: (id: string) => api.delete('/plm/boms/' + id).then((r) => r.data),
  getDocuments: (productId?: string, docType?: string) =>
    api.get('/plm/documents', { params: { productId, docType } }).then((r) => r.data),
  createDocument: (data: any) => api.post('/plm/documents', data).then((r) => r.data),
  updateDocument: (id: string, data: any) =>
    api.patch('/plm/documents/' + id, data).then((r) => r.data),
  deleteDocument: (id: string) => api.delete('/plm/documents/' + id).then((r) => r.data),
  getPatents: (patentType?: string) =>
    api.get('/plm/documents/patents', { params: { patentType } }).then((r) => r.data),
  getExpiringPatents: (days?: number) =>
    api.get('/plm/documents/patents/expiring', { params: { days } }).then((r) => r.data),
};

export const erpApi = {
  syncMaterialsFromK3: () => api.post('/erp/sync-materials-from-k3').then((r) => r.data),
  getMaterials: (keyword?: string) =>
    api.get('/erp/materials', { params: { keyword } }).then((r) => r.data),
  createMaterial: (data: any) => api.post('/erp/materials', data).then((r) => r.data),
  updateMaterial: (id: string, data: any) =>
    api.patch('/erp/materials/' + id, data).then((r) => r.data),
  deleteMaterial: (id: string) => api.delete('/erp/materials/' + id).then((r) => r.data),
  getWorkOrders: (status?: string) =>
    api.get('/erp/work-orders', { params: { status } }).then((r) => r.data),
  createWorkOrder: (data: any) =>
    api
      .post('/erp/work-orders', {
        ...data,
        startDate: dayjs(data.startDate).toISOString(),
        endDate: data.endDate ? dayjs(data.endDate).toISOString() : undefined,
      })
      .then((r) => r.data),
  updateWorkOrder: (id: string, data: any) =>
    api
      .patch('/erp/work-orders/' + id, {
        ...data,
        ...(data.startDate ? { startDate: dayjs(data.startDate).toISOString() } : {}),
        ...(data.endDate ? { endDate: dayjs(data.endDate).toISOString() } : {}),
      })
      .then((r) => r.data),
  deleteWorkOrder: (id: string) => api.delete('/erp/work-orders/' + id).then((r) => r.data),
};

export const supplierApi = {
  syncFromK3: () => api.post('/supplier/sync-from-k3').then((r) => r.data),
  getAll: () => api.get('/supplier').then((r) => r.data),
  get: (id: string) => api.get('/supplier/' + id).then((r) => r.data),
  create: (data: any) => api.post('/supplier', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch('/supplier/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/supplier/' + id).then((r) => r.data),
  getStats: () => api.get('/supplier/stats').then((r) => r.data),
  createQcds: (id: string, data: any) =>
    api.post('/supplier/' + id + '/qcds', data).then((r) => r.data),
  getQcds: (id: string) => api.get('/supplier/' + id + '/qcds').then((r) => r.data),
  createApproval: (id: string, data: any) =>
    api.post('/supplier/' + id + '/approvals', data).then((r) => r.data),
  reviewApproval: (id: string, data: any) =>
    api.patch('/supplier/approvals/' + id + '/review', data).then((r) => r.data),
};

export default api;

export const adminApi = {
  getOrganizations: () => api.get('/admin/organizations').then((r) => r.data),
  getOrganization: (id: string) => api.get('/admin/organizations/' + id).then((r) => r.data),
  createOrganization: (data: any) => api.post('/admin/organizations', data).then((r) => r.data),
  updateOrganization: (id: string, data: any) =>
    api.patch('/admin/organizations/' + id, data).then((r) => r.data),
  deleteOrganization: (id: string) => api.delete('/admin/organizations/' + id).then((r) => r.data),
  getPositions: (orgId?: string) =>
    api.get('/admin/positions', { params: { orgId } }).then((r) => r.data),
  getPosition: (id: string) => api.get('/admin/positions/' + id).then((r) => r.data),
  createPosition: (data: any) => api.post('/admin/positions', data).then((r) => r.data),
  updatePosition: (id: string, data: any) =>
    api.patch('/admin/positions/' + id, data).then((r) => r.data),
  deletePosition: (id: string) => api.delete('/admin/positions/' + id).then((r) => r.data),
  getEmployees: (orgId?: string) =>
    api.get('/admin/employees', { params: { orgId } }).then((r) => r.data),
  getEmployee: (id: string) => api.get('/admin/employees/' + id).then((r) => r.data),
  createEmployee: (data: any) => api.post('/admin/employees', data).then((r) => r.data),
  updateEmployee: (id: string, data: any) =>
    api.patch('/admin/employees/' + id, data).then((r) => r.data),
  deleteEmployee: (id: string) => api.delete('/admin/employees/' + id).then((r) => r.data),
  getRoles: () => api.get('/admin/roles').then((r) => r.data),
  getRole: (id: string) => api.get('/admin/roles/' + id).then((r) => r.data),
  createRole: (data: any) => api.post('/admin/roles', data).then((r) => r.data),
  updateRole: (id: string, data: any) => api.patch('/admin/roles/' + id, data).then((r) => r.data),
  deleteRole: (id: string) => api.delete('/admin/roles/' + id).then((r) => r.data),
  getPermissions: () => api.get('/admin/permissions').then((r) => r.data),
  getPermission: (id: string) => api.get('/admin/permissions/' + id).then((r) => r.data),
  createPermission: (data: any) => api.post('/admin/permissions', data).then((r) => r.data),
  updatePermission: (id: string, data: any) =>
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
  createCodingRule: (data: any) => api.post('/admin/coding-rules', data).then((r) => r.data),
  updateCodingRule: (id: string, data: any) =>
    api.patch('/admin/coding-rules/' + id, data).then((r) => r.data),
  deleteCodingRule: (id: string) => api.delete('/admin/coding-rules/' + id).then((r) => r.data),
  generateCode: (docType: string) =>
    api.get('/admin/coding-rules/generate/' + docType).then((r) => r.data),
  getWorkflowStates: (module?: string) =>
    api.get('/admin/workflow-states', { params: { module } }).then((r) => r.data),
  createWorkflowState: (data: any) => api.post('/admin/workflow-states', data).then((r) => r.data),
  updateWorkflowState: (id: string, data: any) =>
    api.patch('/admin/workflow-states/' + id, data).then((r) => r.data),
  deleteWorkflowState: (id: string) =>
    api.delete('/admin/workflow-states/' + id).then((r) => r.data),
  getWorkflowTransitions: (module?: string) =>
    api.get('/admin/workflow-transitions', { params: { module } }).then((r) => r.data),
  createWorkflowTransition: (data: any) =>
    api.post('/admin/workflow-transitions', data).then((r) => r.data),
  updateWorkflowTransition: (id: string, data: any) =>
    api.patch('/admin/workflow-transitions/' + id, data).then((r) => r.data),
  deleteWorkflowTransition: (id: string) =>
    api.delete('/admin/workflow-transitions/' + id).then((r) => r.data),
  getSystemSettings: () => api.get('/admin/system-settings').then((r) => r.data),
  upsertSystemSetting: (data: any) => api.post('/admin/system-settings', data).then((r) => r.data),
  deleteSystemSetting: (id: string) =>
    api.delete('/admin/system-settings/' + id).then((r) => r.data),
};

export const samplingApi = {
  getOrders: (status?: string) => api.get('/sampling', { params: { status } }).then((r) => r.data),
  getOrder: (id: string) => api.get('/sampling/' + id).then((r) => r.data),
  createOrder: (data: any) => api.post('/sampling', data).then((r) => r.data),
  updateOrder: (id: string, data: any) => api.put('/sampling/' + id, data).then((r) => r.data),
  deleteOrder: (id: string) => api.delete('/sampling/' + id).then((r) => r.data),
  approveOrder: (id: string, data: any) =>
    api.post('/sampling/' + id + '/approve', data).then((r) => r.data),
  rejectOrder: (id: string, data: any) =>
    api.post('/sampling/' + id + '/reject', data).then((r) => r.data),
  assignOrder: (id: string, data: any) =>
    api.post('/sampling/' + id + '/assign', data).then((r) => r.data),
  startProgress: (id: string) => api.post('/sampling/' + id + '/start').then((r) => r.data),
  pauseProgress: (id: string, reason: string) =>
    api.post('/sampling/' + id + '/pause', { reason }).then((r) => r.data),
  completeProgress: (id: string) => api.post('/sampling/' + id + '/complete').then((r) => r.data),
  getStats: () => api.get('/sampling/stats').then((r) => r.data),
};

export const crmApi = {
  syncCustomersFromK3: () => api.post('/crm/sync-customers-from-k3').then((r) => r.data),
  get: (url: string, config?: any) => api.get(url, config),
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  patch: (url: string, data?: any, config?: any) => api.patch(url, data, config),
  delete: (url: string, config?: any) => api.delete(url, config),
  getCustomers: (keyword?: string, category?: string) =>
    api.get('/crm/customers', { params: { keyword, category } }).then((r: any) => r.data),
  getCustomer: (id: string) => api.get('/crm/customers/' + id).then((r: any) => r.data),
  createCustomer: (data: any) => api.post('/crm/customers', data).then((r: any) => r.data),
  updateCustomer: (id: string, data: any) =>
    api.patch('/crm/customers/' + id, data).then((r: any) => r.data),
  deleteCustomer: (id: string) => api.delete('/crm/customers/' + id).then((r: any) => r.data),
  getContactRecords: (customerId: string) =>
    api.get('/crm/customers/' + customerId + '/contact-records').then((r: any) => r.data),
  createContactRecord: (data: any) =>
    api.post('/crm/contact-records', data).then((r: any) => r.data),
  updateContactRecord: (id: string, data: any) =>
    api.patch('/crm/contact-records/' + id, data).then((r: any) => r.data),
  deleteContactRecord: (id: string) =>
    api.delete('/crm/contact-records/' + id).then((r: any) => r.data),
  getQuotes: (keyword?: string, status?: string) =>
    api.get('/crm/quotes', { params: { keyword, status } }).then((r: any) => r.data),
  getQuote: (id: string) => api.get('/crm/quotes/' + id).then((r: any) => r.data),
  createQuote: (data: any) => api.post('/crm/quotes', data).then((r: any) => r.data),
  updateQuote: (id: string, data: any) =>
    api.patch('/crm/quotes/' + id, data).then((r: any) => r.data),
  deleteQuote: (id: string) => api.delete('/crm/quotes/' + id).then((r: any) => r.data),
  getProductBom: (productId: string) =>
    api.get('/crm/products/' + productId + '/bom-for-quote').then((r: any) => r.data),
  getOrders: (keyword?: string, status?: string) =>
    api.get('/crm/orders', { params: { keyword, status } }).then((r: any) => r.data),
  getOrder: (id: string) => api.get('/crm/orders/' + id).then((r: any) => r.data),
  createOrder: (data: any) => api.post('/crm/orders', data).then((r: any) => r.data),
  convertQuoteToOrder: (data: any) =>
    api.post('/crm/orders/convert-quote', data).then((r: any) => r.data),
  updateOrder: (id: string, data: any) =>
    api.patch('/crm/orders/' + id, data).then((r: any) => r.data),
  deleteOrder: (id: string) => api.delete('/crm/orders/' + id).then((r: any) => r.data),
  getOrdersForCustomer: (customerId: string) =>
    api.get('/crm/customers/' + customerId + '/orders').then((r: any) => r.data),
};
export const drawingApi = {
  getDrawings: (productId?: string, status?: string) =>
    api.get('/drawings', { params: { productId, status } }).then((r) => r.data),
  getDrawing: (id: string) => api.get('/drawings/' + id).then((r) => r.data),
  createDrawing: (data: any) => api.post('/drawings', data).then((r) => r.data),
  updateDrawing: (id: string, data: any) => api.put('/drawings/' + id, data).then((r) => r.data),
  deleteDrawing: (id: string) => api.delete('/drawings/' + id).then((r) => r.data),
  getVersions: (drawingId: string) =>
    api.get('/drawings/' + drawingId + '/versions').then((r) => r.data),
  addVersion: (drawingId: string, data: any) =>
    api.post('/drawings/' + drawingId + '/versions', data).then((r) => r.data),
  compareVersions: (drawingId: string, v1: string, v2: string) =>
    api
      .get('/drawings/' + drawingId + '/versions/compare', { params: { v1, v2 } })
      .then((r) => r.data),
};

export const purchaseApi = {
  getAll: (status?: string, supplierId?: string, keyword?: string) =>
    api.get('/purchase', { params: { status, supplierId, keyword } }).then((r) => r.data),
  get: (id: string) => api.get('/purchase/' + id).then((r) => r.data),
  create: (data: any) => api.post('/purchase', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch('/purchase/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/purchase/' + id).then((r) => r.data),
  advanceStatus: (id: string, status: string) =>
    api.post('/purchase/' + id + '/status', { status }).then((r) => r.data),
  getWarnings: () => api.get('/purchase/warnings').then((r) => r.data),
  getStats: () => api.get('/purchase/stats').then((r) => r.data),
  createReceipt: (orderId: string, data: any) =>
    api.post('/purchase/' + orderId + '/receipts', data).then((r) => r.data),
  getReceipts: (orderId: string) =>
    api.get('/purchase/' + orderId + '/receipts').then((r) => r.data),
  linkSaleOrder: (orderId: string, saleOrderId: string) =>
    api.post('/purchase/' + orderId + '/link-sale-order', { saleOrderId }).then((r) => r.data),
  unlinkSaleOrder: (linkId: string) =>
    api.delete('/purchase/sale-order-link/' + linkId).then((r) => r.data),
  getLinkedSaleOrders: (orderId: string) =>
    api.get('/purchase/' + orderId + '/sale-orders').then((r) => r.data),
};

export const warehouseApi = {
  getAll: () => api.get('/warehouse').then((r) => r.data),
  get: (id: string) => api.get('/warehouse/' + id).then((r) => r.data),
  create: (data: any) => api.post('/warehouse', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch('/warehouse/' + id, data).then((r) => r.data),
  delete: (id: string) => api.delete('/warehouse/' + id).then((r) => r.data),
  getLocations: (whId: string) => api.get('/warehouse/' + whId + '/locations').then((r) => r.data),
  createLocation: (whId: string, data: any) =>
    api.post('/warehouse/' + whId + '/locations', data).then((r) => r.data),
  updateLocation: (locId: string, data: any) =>
    api.patch('/warehouse/locations/' + locId, data).then((r) => r.data),
  deleteLocation: (locId: string) =>
    api.delete('/warehouse/locations/' + locId).then((r) => r.data),
  stockIn: (data: any) => api.post('/warehouse/stock-in', data).then((r) => r.data),
  stockOut: (data: any) => api.post('/warehouse/stock-out', data).then((r) => r.data),
  getInventory: (params?: any) => api.get('/warehouse/inventory', { params }).then((r) => r.data),
  getRecords: (params?: any) => api.get('/warehouse/records', { params }).then((r) => r.data),
  getWarnings: () => api.get('/warehouse/warnings').then((r) => r.data),
  getAbcDistribution: () => api.get('/warehouse/abc').then((r) => r.data),
  updateAbcClass: (invId: string, abcClass: string) =>
    api.patch('/warehouse/inventory/' + invId + '/abc', { abcClass }).then((r) => r.data),
  getStats: () => api.get('/warehouse/stats').then((r) => r.data),
  // FIFO 批次管理
  stockInWithBatch: (data: any) => api.post('/warehouse/stock-in-fifo', data).then((r) => r.data),
  stockOutFifo: (data: any) => api.post('/warehouse/stock-out-fifo', data).then((r) => r.data),
  getBatchInventories: (params?: any) =>
    api.get('/warehouse/batch-inventory', { params }).then((r) => r.data),
  getFifoAging: (params?: any) => api.get('/warehouse/fifo-aging', { params }).then((r) => r.data),
};

export const costApi = {
  createSheet: (data: any) => api.post('/cost/sheets', data).then((r) => r.data),
  getSheets: (params?: any) => api.get('/cost/sheets', { params }).then((r) => r.data),
  getSheet: (id: string) => api.get('/cost/sheets/' + id).then((r) => r.data),
  deleteSheet: (id: string) => api.delete('/cost/sheets/' + id).then((r) => r.data),
  quickCompare: (productId: string) =>
    api.get('/cost/quick-compare', { params: { productId } }).then((r) => r.data),
  calculateStandard: (productId: string) =>
    api.get('/cost/calculate-standard', { params: { productId } }).then((r) => r.data),
};

export const financeApi = {
  fetchApFromK3: () => api.get('/finance/ap-from-k3').then((r) => r.data),
  getReconciliations: (status?: string, supplierId?: string) =>
    api.get('/finance/reconciliations', { params: { status, supplierId } }).then((r) => r.data),
  getReconciliation: (id: string) => api.get('/finance/reconciliations/' + id).then((r) => r.data),
  generateReconciliation: (purchaseOrderId: string, invoiceAmount: number) =>
    api.post('/finance/reconciliations', { purchaseOrderId, invoiceAmount }).then((r) => r.data),
  confirmReconciliation: (id: string, confirmedBy: string) =>
    api.post('/finance/reconciliations/' + id + '/confirm', { confirmedBy }).then((r) => r.data),
  getAgingAnalysis: () => api.get('/finance/aging').then((r) => r.data),
  getDifferences: () => api.get('/finance/differences').then((r) => r.data),
  getStats: () => api.get('/finance/stats').then((r) => r.data),
  getPayments: (reconciliationId?: string) =>
    api.get('/finance/payments', { params: { reconciliationId } }).then((r) => r.data),
  createPayment: (data: any) => api.post('/finance/payments', data).then((r) => r.data),
  deletePayment: (id: string) => api.delete('/finance/payments/' + id).then((r) => r.data),
  markAsPaid: (reconciliationId: string) =>
    api.post('/finance/reconciliations/' + reconciliationId + '/paid').then((r) => r.data),
  syncToK3: (reconciliationId: string) =>
    api.post('/k3cloud/sync-ap', { reconciliationId, confirmed: true }).then((r) => r.data),
  getPaymentPlan: () => api.get('/finance/payment-plan').then((r) => r.data),
  getStatement: (supplierId: string, period?: string) =>
    api.get('/finance/statements/' + supplierId, { params: { period } }).then((r) => r.data),
};

export const equipmentApi = {
  // �豸̨��
  getEquipments: (keyword?: string, status?: string, category?: string) =>
    api.get('/equipment', { params: { keyword, status, category } }).then((r) => r.data),
  getEquipment: (id: string) => api.get('/equipment/' + id).then((r) => r.data),
  createEquipment: (data: any) => api.post('/equipment', data).then((r) => r.data),
  updateEquipment: (id: string, data: any) =>
    api.patch('/equipment/' + id, data).then((r) => r.data),
  deleteEquipment: (id: string) => api.delete('/equipment/' + id).then((r) => r.data),
  getEquipmentStats: () => api.get('/equipment/stats').then((r) => r.data),
  getPatents: () => api.get('/equipment/patents').then((r) => r.data),
  // �豸�ĵ�
  getDocuments: (equipmentId: string) =>
    api.get('/equipment/' + equipmentId + '/documents').then((r) => r.data),
  createDocument: (equipmentId: string, data: any) =>
    api.post('/equipment/' + equipmentId + '/documents', data).then((r) => r.data),
  updateDocument: (docId: string, data: any) =>
    api.patch('/equipment/documents/' + docId, data).then((r) => r.data),
  deleteDocument: (docId: string) =>
    api.delete('/equipment/documents/' + docId).then((r) => r.data),
  // TPM����׼
  getCheckStandards: (equipmentId: string) =>
    api.get('/equipment/' + equipmentId + '/check-standards').then((r) => r.data),
  createCheckStandard: (equipmentId: string, data: any) =>
    api.post('/equipment/' + equipmentId + '/check-standards', data).then((r) => r.data),
  updateCheckStandard: (stdId: string, data: any) =>
    api.patch('/equipment/check-standards/' + stdId, data).then((r) => r.data),
  deleteCheckStandard: (stdId: string) =>
    api.delete('/equipment/check-standards/' + stdId).then((r) => r.data),
  // TPM���ƻ�
  generateCheckPlans: (equipmentId: string, days?: number) =>
    api
      .post('/equipment/' + equipmentId + '/check-plans/generate', { days: days || 7 })
      .then((r) => r.data),
  getCheckPlans: (equipmentId?: string, status?: string, date?: string) =>
    api
      .get('/equipment/check-plans', { params: { equipmentId, status, date } })
      .then((r) => r.data),
  getTodayCheckPlans: () => api.get('/equipment/check-plans/today').then((r) => r.data),
  executeCheck: (planId: string, data: any) =>
    api.post('/equipment/check-plans/' + planId + '/execute', data).then((r) => r.data),
  getCheckRecords: (planId?: string, equipmentId?: string) =>
    api.get('/equipment/check-records', { params: { planId, equipmentId } }).then((r) => r.data),
  // ����
  getMaintenancePlans: (equipmentId?: string, status?: string) =>
    api
      .get('/equipment/maintenance-plans', { params: { equipmentId, status } })
      .then((r) => r.data),
  createMaintenancePlan: (equipmentId: string, data: any) =>
    api.post('/equipment/' + equipmentId + '/maintenance-plans', data).then((r) => r.data),
  updateMaintenancePlan: (planId: string, data: any) =>
    api.patch('/equipment/maintenance-plans/' + planId, data).then((r) => r.data),
  deleteMaintenancePlan: (planId: string) =>
    api.delete('/equipment/maintenance-plans/' + planId).then((r) => r.data),
  getMaintenanceWorkOrders: (equipmentId?: string, status?: string) =>
    api
      .get('/equipment/maintenance-work-orders', { params: { equipmentId, status } })
      .then((r) => r.data),
  createMaintenanceWorkOrder: (data: any) =>
    api.post('/equipment/maintenance-work-orders', data).then((r) => r.data),
  updateMaintenanceWorkOrder: (woId: string, data: any) =>
    api.patch('/equipment/maintenance-work-orders/' + woId, data).then((r) => r.data),
  deleteMaintenanceWorkOrder: (woId: string) =>
    api.delete('/equipment/maintenance-work-orders/' + woId).then((r) => r.data),
  // ά��
  getRepairRequests: (equipmentId?: string, status?: string) =>
    api.get('/equipment/repair-requests', { params: { equipmentId, status } }).then((r) => r.data),
  getRepairRequest: (id: string) => api.get('/equipment/repair-requests/' + id).then((r) => r.data),
  createRepairRequest: (data: any) =>
    api.post('/equipment/repair-requests', data).then((r) => r.data),
  dispatchRepair: (id: string, data: any) =>
    api.post('/equipment/repair-requests/' + id + '/dispatch', data).then((r) => r.data),
  startRepair: (woId: string) =>
    api.post('/equipment/repair-work-orders/' + woId + '/start').then((r) => r.data),
  completeRepair: (woId: string, data: any) =>
    api.post('/equipment/repair-work-orders/' + woId + '/complete', data).then((r) => r.data),
  verifyRepair: (woId: string, data: any) =>
    api.post('/equipment/repair-work-orders/' + woId + '/verify', data).then((r) => r.data),
  getRepairStats: () => api.get('/equipment/repair-stats').then((r) => r.data),
  // ��Ʒ����
  getSpareParts: (keyword?: string, category?: string) =>
    api.get('/equipment/spare-parts', { params: { keyword, category } }).then((r) => r.data),
  getSparePart: (id: string) => api.get('/equipment/spare-parts/' + id).then((r) => r.data),
  createSparePart: (data: any) => api.post('/equipment/spare-parts', data).then((r) => r.data),
  updateSparePart: (id: string, data: any) =>
    api.patch('/equipment/spare-parts/' + id, data).then((r) => r.data),
  deleteSparePart: (id: string) => api.delete('/equipment/spare-parts/' + id).then((r) => r.data),
  stockIn: (data: any) => api.post('/equipment/spare-parts/stock-in', data).then((r) => r.data),
  stockOut: (data: any) => api.post('/equipment/spare-parts/stock-out', data).then((r) => r.data),
  getSparePartRecords: (partId?: string, type?: string) =>
    api.get('/equipment/spare-parts-records', { params: { partId, type } }).then((r) => r.data),
  getSparePartWarnings: () => api.get('/equipment/spare-parts/warnings').then((r) => r.data),
  getPurchaseSuggestions: () => api.get('/equipment/spare-parts/suggestions').then((r) => r.data),
};

export const qualityApi = {
  // 检验标准
  createStandard: (data: any) => api.post('/quality/standards', data).then((r) => r.data),
  getStandards: (materialId?: string) =>
    api.get('/quality/standards', { params: { materialId } }).then((r) => r.data),
  updateStandard: (id: string, data: any) =>
    api.patch('/quality/standards/' + id, data).then((r) => r.data),
  deleteStandard: (id: string) => api.delete('/quality/standards/' + id).then((r) => r.data),
  // IQC 来料检验
  createIncoming: (data: any) => api.post('/quality/incoming', data).then((r) => r.data),
  getIncomings: (status?: string, purchaseOrderId?: string, keyword?: string) =>
    api
      .get('/quality/incoming', { params: { status, purchaseOrderId, keyword } })
      .then((r) => r.data),
  getIncoming: (id: string) => api.get('/quality/incoming/' + id).then((r) => r.data),
  updateIncoming: (id: string, data: any) =>
    api.patch('/quality/incoming/' + id, data).then((r) => r.data),
  getIqcStats: () => api.get('/quality/incoming/stats').then((r) => r.data),
  createRecord: (incomingId: string, data: any) =>
    api.post('/quality/incoming/' + incomingId + '/records', data).then((r) => r.data),
  submitInspection: (incomingId: string, items: any[], inspector: string) =>
    api
      .post('/quality/incoming/' + incomingId + '/submit', { items, inspector })
      .then((r) => r.data),
  createDisposition: (incomingId: string, data: any) =>
    api.post('/quality/incoming/' + incomingId + '/disposition', data).then((r) => r.data),
  // IPQC 首件检验
  createFirstPiece: (data: any) => api.post('/quality/first-piece', data).then((r) => r.data),
  getFirstPieces: (status?: string) =>
    api.get('/quality/first-piece', { params: { status } }).then((r) => r.data),
  updateFirstPiece: (id: string, data: any) =>
    api.patch('/quality/first-piece/' + id, data).then((r) => r.data),
  // IPQC 巡检
  generatePatrolPlans: (days?: number) =>
    api.post('/quality/patrol-plans/generate', { days: days || 7 }).then((r) => r.data),
  getPatrolPlans: (status?: string, date?: string) =>
    api.get('/quality/patrol-plans', { params: { status, date } }).then((r) => r.data),
  getTodayPatrolPlans: () => api.get('/quality/patrol-plans/today').then((r) => r.data),
  executePatrolCheck: (planId: string, data: any) =>
    api.post('/quality/patrol-plans/' + planId + '/execute', data).then((r) => r.data),
  getPatrolRecords: (planId?: string) =>
    api.get('/quality/patrol-records', { params: { planId } }).then((r) => r.data),
  // OQC 出货检验
  createOutgoing: (data: any) => api.post('/quality/outgoing', data).then((r) => r.data),
  getOutgoings: (status?: string, keyword?: string) =>
    api.get('/quality/outgoing', { params: { status, keyword } }).then((r) => r.data),
  getOutgoing: (id: string) => api.get('/quality/outgoing/' + id).then((r) => r.data),
  updateOutgoing: (id: string, data: any) =>
    api.patch('/quality/outgoing/' + id, data).then((r) => r.data),
  // NCR 不合格品
  createNcr: (data: any) => api.post('/quality/ncr', data).then((r) => r.data),
  getNcrs: (status?: string, source?: string) =>
    api.get('/quality/ncr', { params: { status, source } }).then((r) => r.data),
  getNcr: (id: string) => api.get('/quality/ncr/' + id).then((r) => r.data),
  reviewNcr: (id: string, data: any) =>
    api.patch('/quality/ncr/' + id + '/review', data).then((r) => r.data),
  // CAPA 纠正预防
  createCapa: (data: any) => api.post('/quality/capa', data).then((r) => r.data),
  getCapas: (ncrId?: string, status?: string) =>
    api.get('/quality/capa', { params: { ncrId, status } }).then((r) => r.data),
  updateCapa: (id: string, data: any) => api.patch('/quality/capa/' + id, data).then((r) => r.data),
  // 量具/仪器
  createGauge: (data: any) => api.post('/quality/gauges', data).then((r) => r.data),
  getGauges: (status?: string, keyword?: string) =>
    api.get('/quality/gauges', { params: { status, keyword } }).then((r) => r.data),
  getGauge: (id: string) => api.get('/quality/gauges/' + id).then((r) => r.data),
  updateGauge: (id: string, data: any) =>
    api.patch('/quality/gauges/' + id, data).then((r) => r.data),
  deleteGauge: (id: string) => api.delete('/quality/gauges/' + id).then((r) => r.data),
  createCalibration: (gaugeId: string, data: any) =>
    api.post('/quality/gauges/' + gaugeId + '/calibrations', data).then((r) => r.data),
  getGaugeWarnings: () => api.get('/quality/gauges/warnings').then((r) => r.data),
  // 品质统计
  getStats: () => api.get('/quality/stats').then((r) => r.data),
};

export const manufacturingApi = {
  // 生产排产
  createPlan: (data: any) => api.post('/manufacturing/plans', data).then((r) => r.data),
  getPlans: (status?: string, period?: string) =>
    api.get('/manufacturing/plans', { params: { status, period } }).then((r) => r.data),
  getPlan: (id: string) => api.get('/manufacturing/plans/' + id).then((r) => r.data),
  updatePlan: (id: string, data: any) =>
    api.patch('/manufacturing/plans/' + id, data).then((r) => r.data),
  deletePlan: (id: string) => api.delete('/manufacturing/plans/' + id).then((r) => r.data),
  addPlanItem: (planId: string, data: any) =>
    api.post('/manufacturing/plans/' + planId + '/items', data).then((r) => r.data),
  updatePlanItem: (id: string, data: any) =>
    api.patch('/manufacturing/plan-items/' + id, data).then((r) => r.data),
  deletePlanItem: (id: string) => api.delete('/manufacturing/plan-items/' + id).then((r) => r.data),
  dragPlanItem: (id: string, data: any) =>
    api.patch('/manufacturing/plan-items/' + id + '/drag', data).then((r) => r.data),
  checkCapacity: (planId: string) =>
    api.get('/manufacturing/plans/' + planId + '/capacity').then((r) => r.data),
  getCalendars: (start?: string, end?: string) =>
    api.get('/manufacturing/calendars', { params: { start, end } }).then((r) => r.data),
  upsertCalendar: (data: any) => api.post('/manufacturing/calendars', data).then((r) => r.data),
  // 工单流转
  createOrder: (data: any) => api.post('/manufacturing/orders', data).then((r) => r.data),
  getOrders: (status?: string, priority?: string, keyword?: string, planId?: string) =>
    api
      .get('/manufacturing/orders', { params: { status, priority, keyword, planId } })
      .then((r) => r.data),
  getOrder: (id: string) => api.get('/manufacturing/orders/' + id).then((r) => r.data),
  updateOrder: (id: string, data: any) =>
    api.patch('/manufacturing/orders/' + id, data).then((r) => r.data),
  deleteOrder: (id: string) => api.delete('/manufacturing/orders/' + id).then((r) => r.data),
  transitionOrder: (id: string, toStatus: string) =>
    api.post('/manufacturing/orders/' + id + '/transition', { toStatus }).then((r) => r.data),
  getOrderOperations: (orderId: string) =>
    api.get('/manufacturing/orders/' + orderId + '/operations').then((r) => r.data),
  updateOperation: (id: string, data: any) =>
    api.patch('/manufacturing/operations/' + id, data).then((r) => r.data),
  transitionOperation: (id: string, toStatus: string) =>
    api.post('/manufacturing/operations/' + id + '/transition', { toStatus }).then((r) => r.data),
  issueMaterial: (orderId: string, data: any) =>
    api.post('/manufacturing/orders/' + orderId + '/issues', data).then((r) => r.data),
  getIssues: (orderId?: string, materialId?: string) =>
    api.get('/manufacturing/issues', { params: { orderId, materialId } }).then((r) => r.data),
  reportOperation: (data: any) => api.post('/manufacturing/reports', data).then((r) => r.data),
  getReports: (operationId?: string, scanCode?: string) =>
    api.get('/manufacturing/reports', { params: { operationId, scanCode } }).then((r) => r.data),
  completeOrder: (id: string, data: any) =>
    api.post('/manufacturing/orders/' + id + '/complete', data).then((r) => r.data),
  // WIP 在制品
  getWipOverview: (status?: string) =>
    api.get('/manufacturing/wip', { params: { status } }).then((r) => r.data),
  getWipByWorkCenter: () => api.get('/manufacturing/wip/by-workcenter').then((r) => r.data),
  getOverdueWarnings: () => api.get('/manufacturing/wip/overdue').then((r) => r.data),
  // 工时效率
  getEfficiencyByOrder: (orderId: string) =>
    api.get('/manufacturing/efficiency/order/' + orderId).then((r) => r.data),
  getEfficiencyByWorker: (worker?: string, start?: string, end?: string) =>
    api
      .get('/manufacturing/efficiency/worker', { params: { worker, start, end } })
      .then((r) => r.data),
  // 工艺路线
  createRouting: (data: any) => api.post('/manufacturing/routings', data).then((r) => r.data),
  getRoutings: (productId?: string) =>
    api.get('/manufacturing/routings', { params: { productId } }).then((r) => r.data),
  getRouting: (id: string) => api.get('/manufacturing/routings/' + id).then((r) => r.data),
  updateRouting: (id: string, data: any) =>
    api.patch('/manufacturing/routings/' + id, data).then((r) => r.data),
  deleteRouting: (id: string) => api.delete('/manufacturing/routings/' + id).then((r) => r.data),
  addRoutingOperation: (routingId: string, data: any) =>
    api.post('/manufacturing/routings/' + routingId + '/operations', data).then((r) => r.data),
  updateRoutingOperation: (id: string, data: any) =>
    api.patch('/manufacturing/routing-operations/' + id, data).then((r) => r.data),
  deleteRoutingOperation: (id: string) =>
    api.delete('/manufacturing/routing-operations/' + id).then((r) => r.data),
  // 统计
  getStats: () => api.get('/manufacturing/stats').then((r) => r.data),
};
