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

// Domain service re-exports
import { npiApi } from './npi';
export { npiApi };

import { plmApi } from './plm';
export { plmApi };

import { erpApi } from './erp';
export { erpApi };

import { supplierApi } from './supplier';
export { supplierApi };

import { adminApi } from './admin';
export { adminApi };

import { samplingApi } from './sampling';
export { samplingApi };

import { crmApi } from './crm';
export { crmApi };

import { drawingApi } from './drawing';
export { drawingApi };

import { purchaseApi } from './purchase';
export { purchaseApi };

import { warehouseApi } from './warehouse';
export { warehouseApi };

import { costApi } from './cost';
export { costApi };

import { financeApi } from './finance';
export { financeApi };

import { equipmentApi } from './equipment';
export { equipmentApi };

import { qualityApi } from './quality';
export { qualityApi };

import { manufacturingApi } from './manufacturing';
export { manufacturingApi };

export default api;
