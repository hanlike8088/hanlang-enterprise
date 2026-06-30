import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';

const Loading = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const SamplingWorkOrdersPage = React.lazy(() => import('./pages/NPI/SamplingWorkOrdersPage'));
const ProjectsPage = React.lazy(() => import('./pages/NPI/ProjectsPage'));
const TrialRunsPage = React.lazy(() => import('./pages/NPI/TrialRunsPage'));
const IssuesPage = React.lazy(() => import('./pages/NPI/IssuesPage'));
const ApprovalsPage = React.lazy(() => import('./pages/NPI/ApprovalsPage'));
const ProductsPage = React.lazy(() => import('./pages/PLM/ProductsPage'));
const DocumentsPage = React.lazy(() => import('./pages/PLM/DocumentsPage'));
const PatentsPage = React.lazy(() => import('./pages/PLM/PatentsPage'));
const DrawingVersionsPage = React.lazy(() => import('./pages/PLM/DrawingVersionsPage'));
const CustomersPage = React.lazy(() => import('./pages/CRM/CustomersPage'));
const QuotesPage = React.lazy(() => import('./pages/CRM/QuotesPage'));
const OrdersPage = React.lazy(() => import('./pages/CRM/OrdersPage'));
const ComplaintsPage = React.lazy(() => import('./pages/CRM/ComplaintsPage'));
const PaymentsPage = React.lazy(() => import('./pages/CRM/PaymentsPage'));
const ReconciliationPage = React.lazy(() => import('./pages/CRM/ReconciliationPage'));
const MaterialsPage = React.lazy(() => import('./pages/ERP/MaterialsPage'));
const WorkOrdersPage = React.lazy(() => import('./pages/ERP/WorkOrdersPage'));
const SupplierPage = React.lazy(() => import('./pages/SupplierPage'));
const PurchasePage = React.lazy(() => import('./pages/PurchasePage'));
const WarehousePage = React.lazy(() => import('./pages/WarehousePage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));
const SchedulingPage = React.lazy(() => import('./pages/Manufacturing/SchedulingPage'));
const WorkOrderPage = React.lazy(() => import('./pages/Manufacturing/WorkOrderPage'));
const WipPage = React.lazy(() => import('./pages/Manufacturing/WipPage'));
const EfficiencyPage = React.lazy(() => import('./pages/Manufacturing/EfficiencyPage'));
const IQCPage = React.lazy(() => import('./pages/Quality/IQCPage'));
const IPQCPage = React.lazy(() => import('./pages/Quality/IPQCPage'));
const OQCPage = React.lazy(() => import('./pages/Quality/OQCPage'));
const GaugePage = React.lazy(() => import('./pages/Quality/GaugePage'));
const EquipmentPage = React.lazy(() => import('./pages/Equipment/EquipmentPage'));
const TpmPage = React.lazy(() => import('./pages/Equipment/TpmPage'));
const RepairPage = React.lazy(() => import('./pages/Equipment/RepairPage'));
const SparePartsPage = React.lazy(() => import('./pages/Equipment/SparePartsPage'));
const MRPPage = React.lazy(() => import('./pages/MRPPage'));
const QualityDashboardPage = React.lazy(() => import('./pages/QualityDashboardPage'));
const AuditPage = React.lazy(() => import('./pages/AuditPage'));
const SPCPage = React.lazy(() => import('./pages/SPCPage'));
const TracePage = React.lazy(() => import('./pages/TracePage'));
const CostPage = React.lazy(() => import('./pages/CostPage'));
const TrainingPage = React.lazy(() => import('./pages/TrainingPage'));
const DocumentControlPage = React.lazy(() => import('./pages/DocumentControlPage'));
const KnowledgePage = React.lazy(() => import('./pages/KnowledgePage'));
const NotificationPage = React.lazy(() => import('./pages/NotificationPage'));
const BackupPage = React.lazy(() => import('./pages/BackupPage'));
const ArchivePage = React.lazy(() => import('./pages/ArchivePage'));
const K3CloudPage = React.lazy(() => import('./pages/K3CloudPage'));
const OrganizationPage = React.lazy(() => import('./pages/Admin/OrganizationPage'));
const PositionPage = React.lazy(() => import('./pages/Admin/PositionPage'));
const EmployeePage = React.lazy(() => import('./pages/Admin/EmployeePage'));
const RolePermissionPage = React.lazy(() => import('./pages/Admin/RolePermissionPage'));
const CodingRulesPage = React.lazy(() => import('./pages/Admin/CodingRulesPage'));
const WorkflowStatesPage = React.lazy(() => import('./pages/Admin/WorkflowStatesPage'));
const SystemSettingsPage = React.lazy(() => import('./pages/Admin/SystemSettingsPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/npi/sampling" element={<SamplingWorkOrdersPage />} />
        <Route path="/npi/projects" element={<ProjectsPage />} />
        <Route path="/npi/trial-runs" element={<TrialRunsPage />} />
        <Route path="/npi/issues" element={<IssuesPage />} />
        <Route path="/npi/approvals" element={<ApprovalsPage />} />
        <Route path="/plm/products" element={<ProductsPage />} />
        <Route path="/plm/documents" element={<DocumentsPage />} />
        <Route path="/plm/patents" element={<PatentsPage />} />
        <Route path="/plm/drawing-versions" element={<DrawingVersionsPage />} />
        <Route path="/crm/customers" element={<CustomersPage />} />
        <Route path="/crm/quotes" element={<QuotesPage />} />
        <Route path="/crm/orders" element={<OrdersPage />} />
        <Route path="/crm/complaints" element={<ComplaintsPage />} />
        <Route path="/crm/payments" element={<PaymentsPage />} />
        <Route path="/crm/reconciliations" element={<ReconciliationPage />} />
        <Route path="/erp/materials" element={<MaterialsPage />} />
        <Route path="/erp/work-orders" element={<WorkOrdersPage />} />
        <Route path="/supplier" element={<SupplierPage />} />
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/manufacturing/scheduling" element={<SchedulingPage />} />
        <Route path="/manufacturing/orders" element={<WorkOrderPage />} />
        <Route path="/manufacturing/wip" element={<WipPage />} />
        <Route path="/manufacturing/efficiency" element={<EfficiencyPage />} />
        <Route path="/quality/iqc" element={<IQCPage />} />
        <Route path="/quality/ipqc" element={<IPQCPage />} />
        <Route path="/quality/oqc" element={<OQCPage />} />
        <Route path="/quality/gauge" element={<GaugePage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/equipment/tpm" element={<TpmPage />} />
        <Route path="/equipment/repair" element={<RepairPage />} />
        <Route path="/equipment/parts" element={<SparePartsPage />} />
        <Route path="/mrp" element={<MRPPage />} />
        <Route path="/quality/dashboard" element={<QualityDashboardPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/spc" element={<SPCPage />} />
        <Route path="/trace" element={<TracePage />} />
        <Route path="/cost" element={<CostPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/docs/control" element={<DocumentControlPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/k3cloud" element={<K3CloudPage />} />
        <Route path="/admin/org" element={<OrganizationPage />} />
        <Route path="/admin/position" element={<PositionPage />} />
        <Route path="/admin/employee" element={<EmployeePage />} />
        <Route path="/admin/role-permission" element={<RolePermissionPage />} />
        <Route path="/admin/coding-rules" element={<CodingRulesPage />} />
        <Route path="/admin/workflow-states" element={<WorkflowStatesPage />} />
        <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
      </Routes>
    </Suspense>
  );
}
