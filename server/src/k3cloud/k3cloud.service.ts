import { Injectable, Logger, HttpException } from '@nestjs/common';

interface K3CloudAuth {
  cookie: string;
  sessionId: string;
  userToken: string;
}

interface K3ApiResponse {
  Result: {
    ResponseStatus: {
      IsSuccess: boolean;
      ErrorCode?: number;
      Errors?: Array<{ FieldName?: string; Message: string; DIndex?: number }>;
      SuccessEntitys?: Array<{ Id: string; Number: string; DIndex?: number }>;
      SuccessMessages?: Array<{ FieldName?: string; Message: string; DIndex?: number }>;
    };
    Id?: string;
    Number?: string;
    Result?: any;
  };
}

@Injectable()
export class K3CloudService {
  private readonly logger = new Logger(K3CloudService.name);
  private auth: K3CloudAuth | null = null;
  private baseUrl: string;
  private accountId: string;
  private username: string;
  private password: string;
  private lcid: number;

  constructor() {
    this.baseUrl = process.env.K3_CLOUD_BASE_URL || 'http://223.94.41.247:9999/K3Cloud';
    this.accountId = process.env.K3_CLOUD_ACCOUNT_ID || '69211489187e41';
    this.username = process.env.K3_CLOUD_USERNAME || 'administrator';
    this.password = process.env.K3_CLOUD_PASSWORD || '';
    this.lcid = parseInt(process.env.K3_CLOUD_LCID || '2052', 10);
  }

  private async ensureLogin() {
    if (this.auth) return this.auth;
    const url = this.baseUrl + '/Kingdee.BOS.WebApi.ServicesStub.AuthService.ValidateUser.common.kdsvc';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acctID: this.accountId, username: this.username, password: this.password, lcid: this.lcid }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data: any = await res.json();
        if (data.LoginResultType !== 1) throw new Error('金蝶登录失败: ' + (data.Message || '未知错误'));
        const cookie = res.headers.get('set-cookie') || '';
        this.auth = { cookie: cookie.split(';')[0], sessionId: data.Context.SessionId, userToken: data.Context.UserToken };
        this.logger.log('金蝶登录成功: ' + data.Context.CustomName);
        return this.auth;
      } catch (err) {
        if (attempt === 1) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  /** 金蝶 API 通用调用（简化格式） */
  private async call(method: string, params: any): Promise<K3ApiResponse> {
    const auth = await this.ensureLogin();
    const url = `${this.baseUrl}/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.${method}.common.kdsvc`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': auth.cookie },
      body: JSON.stringify({ data: JSON.stringify(params) }),
    });
    const json: K3ApiResponse = await res.json();
    if (json?.Result?.ResponseStatus?.IsSuccess === false) {
      const errs = json.Result.ResponseStatus.Errors || [];
      const msg = errs.map(e => e.Message).join('; ');
      this.logger.warn(`金蝶API ${method} 失败: ${msg}`);
    }
    return json;
  }

  /** 校验响应并提取结果 */
  private checkResponse(json: K3ApiResponse, context: string) {
    const status = json?.Result?.ResponseStatus;
    if (!status?.IsSuccess) {
      const errs = status?.Errors || [];
      const msg = errs.map(e => `${e.FieldName || ''}:${e.Message}`).join('; ');
      throw new HttpException(`金蝶${context}失败: ${msg}`, 502);
    }
    return json.Result;
  }

  // ===== 查询操作 =====

  async executeBillQuery(formId: string, fieldKeys: string, filter = '', topRow = 100, startRow = 0, limit = 5000): Promise<any> {
    const json = await this.call('ExecuteBillQuery', { FormId: formId, FieldKeys: fieldKeys, FilterString: filter, OrderString: '', TopRowCount: topRow, StartRow: startRow, Limit: limit });
    return json;
  }

  async getMaterials(fields = 'FNumber,FName,FSpecification,FMaterialGroup,FBaseUnitId.FNumber,FUseOrgId.FNumber', startRow = 0) {
    return this.executeBillQuery('BD_MATERIAL', fields, '', 5000, startRow);
  }
  async getDepartments() {
    return this.executeBillQuery('BD_Department', 'FNumber,FName', '', 500);
  }
  async getBoms() {
    return this.executeBillQuery('ENG_BOM', 'FNumber,FBillTypeID.FNumber,FParentMaterialId.FNumber,FStatus,FUseStatus,FIsMain', '', 100);
  }
  async getWorkOrders() {
    return this.executeBillQuery('PRD_MO', 'FBillNo,FQty,FStatus,FProductType.FNumber', '', 100);
  }
  async getCustomers() {
    return this.executeBillQuery('BD_Customer', 'FNumber,FName,FGroup,FUseOrgId.FNumber', '', 5000);
  }
  async getSuppliers() {
    return this.executeBillQuery('BD_Supplier', 'FNumber,FName,FGroup,FUseOrgId.FNumber', '', 5000);
  }

  // ===== 单据操作 =====

  /** View — 查看单条单据完整数据 */
  async view(formId: string, number?: string, id?: string) {
    const json = await this.call('View', { CreateOrgId: 0, Number: number || '', Id: id || '', IsSortBySeq: 'false' });
    return this.checkResponse(json, `查看${formId}`);
  }

  /** Save — 保存单据（新增或修改） */
  async save(formId: string, model: any, needUpDateFields: string[] = []) {
    const json = await this.call('Save', {
      Creator: '', NeedUpDateFields: needUpDateFields, Model: model,
    });
    return this.checkResponse(json, `保存${formId}`);
  }

  /** Submit — 提交单据 */
  async submit(formId: string, numbers: string[], createOrgId = 0) {
    const json = await this.call('Submit', { CreateOrgId: createOrgId, Numbers: numbers });
    return this.checkResponse(json, `提交${formId}`);
  }

  /** Audit — 审核单据 */
  async audit(formId: string, numbers: string[], createOrgId = 0) {
    const json = await this.call('Audit', { CreateOrgId: createOrgId, Numbers: numbers });
    return this.checkResponse(json, `审核${formId}`);
  }

  /** UnAudit — 反审核单据 */
  async unAudit(formId: string, numbers: string[], createOrgId = 0) {
    const json = await this.call('UnAudit', { CreateOrgId: createOrgId, Numbers: numbers });
    return this.checkResponse(json, `反审核${formId}`);
  }

  /** Delete — 删除单据 */
  async delete(formId: string, numbers: string[], createOrgId = 0) {
    const json = await this.call('Delete', { CreateOrgId: createOrgId, Numbers: numbers });
    return this.checkResponse(json, `删除${formId}`);
  }

  /** BatchSave — 批量保存 */
  async batchSave(formId: string, models: any[], batchCount = 1) {
    if (!Array.isArray(models)) throw new Error('models必须是数组');
    const json = await this.call('BatchSave', { NeedUpDateFields: [], BatchCount: batchCount, Model: models });
    return this.checkResponse(json, `批量保存${formId}`);
  }

  // ===== 业务快捷方法 =====

  /** 创建物料 */
  async createMaterial(data: { FNumber: string; FName: string; FSpecification?: string; FMaterialGroup?: { FNumber: string } }) {
    return this.save('BD_MATERIAL', data);
  }

  /** 创建生产订单 */
  async createWorkOrder(data: { FBillNo?: string; FQty: number; FProductType?: { FNumber: string }; FMaterialId: { FNumber: string } }) {
    return this.save('PRD_MO', data);
  }

  /** 获取登录信息（用于诊断） */
  async getLoginInfo() {
    const auth = await this.ensureLogin();
    return {
      baseUrl: this.baseUrl,
      server: '金蝶云星空 9.0.117.3',
      company: '宁波瀚朗智能驱动科技股份有限公司',
      dataCenter: '测试账套',
      loggedIn: true,
      sessionId: auth.sessionId,
    };
  }
}
