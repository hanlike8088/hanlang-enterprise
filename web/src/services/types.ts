// Auto-generated from Prisma schema
// Shared API response wrapper
export interface ApiList<T> { data: T[]; total?: number }
export interface ApiItem<T> { data: T }

export interface AdminCodingRule {
  id: string;
  docType: string;
  prefix: string;
  yearDigits: number;
  serialDigits: number;
  separator: string;
  currentSerial: number;
  resetPeriod: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEmployee {
  id: string;
  employeeCode: string;
  name: string;
  orgId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEmployeePosition {
  id: string;
  employeeId: string;
  positionId: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface AdminOrganization {
  id: string;
  orgCode: string;
  orgName: string;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPermission {
  id: string;
  permCode: string;
  permName: string;
  resource: string;
  action: string;
  createdAt: string;
}

export interface AdminPosition {
  id: string;
  positionCode: string;
  positionName: string;
  orgId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPositionRole {
  id: string;
  positionId: string;
  roleId: string;
}

export interface AdminRole {
  id: string;
  roleCode: string;
  roleName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRolePermission {
  id: string;
  roleId: string;
  permId: string;
}

export interface AdminSystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkflowState {
  id: string;
  stateCode: string;
  stateName: string;
  module: string;
  isStart: boolean;
  isEnd: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkflowTransition {
  id: string;
  module: string;
  fromStateId: string;
  toStateId: string;
  transitionName: string;
  sortOrder: number;
  createdAt: string;
}

export interface ApPayment {
  id: string;
  paymentCode: string;
  supplierId: string;
  reconciliationId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
}

export interface ApReconciliation {
  id: string;
  reconCode: string;
  purchaseOrderId: string;
  supplierId: string;
  orderAmount: number;
  receiptAmount: number;
  invoiceAmount: number;
  status: string;
  diffAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRecord {
  id: string;
  approvalCode: string;
  module: string;
  docType: string;
  docId: string;
  fromStatus: string;
  toStatus: string;
  requestedAt: string;
  status: string;
  transitionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveRun {
  id: string;
  entityType: string;
  olderThan: string;
  recordsCount: number;
  status: string;
  createdAt: string;
}

export interface AuditChecklist {
  id: string;
  checklistCode: string;
  planId: string;
  itemNo: number;
  clause: string;
  checkContent: string;
  checkMethod: string;
  result: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  findingCode: string;
  planId: string;
  findingType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
}

export interface AuditPlan {
  id: string;
  planCode: string;
  planName: string;
  auditType: string;
  planYear: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchInventory {
  id: string;
  warehouseId: string;
  materialId: string;
  materialName: string;
  batchNo: string;
  quantity: number;
  receivedDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchLabel {
  id: string;
  batchNo: string;
  createdAt: string;
}

export interface BatchTrace {
  id: string;
  batchNo: string;
  materialId: string;
  sourceType: string;
  operation: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  createdAt: string;
}

export interface CalibrationRecord {
  id: string;
  gaugeId: string;
  calibrationDate: string;
  result: string;
  createdAt: string;
}

export interface CapaReport {
  id: string;
  capaCode: string;
  ncrId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostSheet {
  id: string;
  sheetCode: string;
  productId: string;
  productName: string;
  standardCost: number;
  actualCost: number;
  variance: number;
  variancePct: number;
  period: string;
  status: string;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostSheetItem {
  id: string;
  sheetId: string;
  materialId: string;
  materialName: string;
  bomQuantity: number;
  unit: string;
  standardPrice: number;
  standardTotal: number;
  actualPrice: number;
  actualTotal: number;
  variance: number;
  sourceType: string;
  createdAt: string;
}

export interface CrmComplaint {
  id: string;
  complaintCode: string;
  customerId: string;
  title: string;
  complaintType: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmContactRecord {
  id: string;
  customerId: string;
  contactDate: string;
  contactType: string;
  content: string;
  followUpDone: boolean;
  createdAt: string;
}

export interface CrmCustomer {
  id: string;
  customerCode: string;
  customerName: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOrder {
  id: string;
  orderCode: string;
  productId: string;
  productName: string;
  totalAmount: number;
  currency: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOrderItem {
  id: string;
  orderId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export interface CrmPayment {
  id: string;
  paymentCode: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  createdAt: string;
}

export interface CrmQuote {
  id: string;
  quoteCode: string;
  productId: string;
  materialCost: number;
  laborCost: number;
  manufacturingFee: number;
  referencePrice: number;
  profitRate: number;
  finalPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmQuoteItem {
  id: string;
  quoteId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export interface CrmReconciliation {
  id: string;
  reconciliationCode: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DefectDisposition {
  id: string;
  incomingId: string;
  disposition: string;
}

export interface DocumentApproval {
  id: string;
  approvalCode: string;
  docType: string;
  docId: string;
  docName: string;
  action: string;
  requestedAt: string;
  decision: string;
  createdAt: string;
}

export interface DocumentChangeRecord {
  id: string;
  changeCode: string;
  docType: string;
  docId: string;
  docName: string;
  changeType: string;
  changeNote: string;
  changedAt: string;
  createdAt: string;
}

export interface DocumentDistribution {
  id: string;
  distributeCode: string;
  docType: string;
  docId: string;
  docName: string;
  recipient: string;
  distributedAt: string;
  status: string;
  createdAt: string;
}

export interface DocumentObsolete {
  id: string;
  obsoleteCode: string;
  docType: string;
  docId: string;
  docName: string;
  obsoleteDate: string;
  createdAt: string;
}

export interface Drawing {
  id: string;
  drawingCode: string;
  drawingName: string;
  status: string;
  latestVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingVersion {
  id: string;
  drawingId: string;
  version: string;
  docType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadBy: string;
  isLatest: boolean;
  createdAt: string;
}

export interface Equipment {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  docType: string;
  docName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

export interface ErpMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  batchManaged: boolean;
  safetyStock: number;
  stock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErpWorkOrder {
  id: string;
  orderCode: string;
  productId: string;
  quantity: number;
  status: string;
  priority: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirstPieceInspection {
  id: string;
  inspectionCode: string;
  productName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GaugeInstrument {
  id: string;
  gaugeCode: string;
  gaugeName: string;
  status: string;
  calibrationCycle: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncomingMaterial {
  id: string;
  inspectionCode: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  arrivalDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionRecord {
  id: string;
  incomingId: string;
  itemName: string;
  measuredValue: number;
  result: string;
  inspectedAt: string;
}

export interface InspectionStandard {
  id: string;
  materialId: string;
  materialName: string;
  itemName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  id: string;
  materialId: string;
  warehouse: string;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  articleCode: string;
  title: string;
  content: string;
  category: string;
  status: string;
  version: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KpiSnapshot {
  id: string;
  snapshotCode: string;
  snapshotDate: string;
  complaintCount: number;
  complaintRate: number;
  ncrCount: number;
  capaCloseRate: number;
  oqcPassRate: number;
  iqcPassRate: number;
  otifRate: number;
  efficiencyScore: number;
  createdAt: string;
}

export interface MaintenancePlan {
  id: string;
  planCode: string;
  equipmentId: string;
  planType: string;
  content: string;
  frequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  orderCode: string;
  equipmentId: string;
  workType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturingOrder {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  completedQty: number;
  qualifiedQty: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturingOrderOperation {
  id: string;
  orderId: string;
  opSequence: number;
  opName: string;
  status: string;
  plannedHours: number;
  actualHours: number;
  inputQty: number;
  completedQty: number;
  qualifiedQty: number;
  defectQty: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialBatch {
  id: string;
  materialId: string;
  batchNo: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialIssuing {
  id: string;
  issueCode: string;
  orderId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  status: string;
  issuedAt: string;
  createdAt: string;
}

export interface MrpRun {
  id: string;
  runCode: string;
  runDate: string;
  status: string;
  totalDemand: number;
  totalShortage: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MrpRunItem {
  id: string;
  runId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  totalDemand: number;
  currentStock: number;
  shortage: number;
  suggestedQty: number;
  status: string;
  createdAt: string;
}

export interface NcrReport {
  id: string;
  ncrCode: string;
  source: string;
  productName: string;
  defectType: string;
  severity: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NpiApproval {
  id: string;
  projectId: string;
  approvalType: string;
  status: string;
  applicant: string;
  createdAt: string;
  updatedAt: string;
}

export interface NpiIssue {
  id: string;
  issueCode: string;
  trialRunId: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface NpiProject {
  id: string;
  projectCode: string;
  projectName: string;
  status: string;
  priority: string;
  startDate: string;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NpiTrialRun {
  id: string;
  trialCode: string;
  projectId: string;
  batchSize: number;
  status: string;
  startDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationReport {
  id: string;
  reportCode: string;
  operationId: string;
  processedQty: number;
  qualifiedQty: number;
  defectQty: number;
  laborHours: number;
  machineHours: number;
  status: string;
  createdAt: string;
}

export interface OutgoingInspection {
  id: string;
  inspectionCode: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolInspectionPlan {
  id: string;
  planCode: string;
  checkDate: string;
  frequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolInspectionRecord {
  id: string;
  checkItem: string;
  checkResult: string;
  checkedAt: string;
  triggeredNcr: boolean;
}

export interface PlmBom {
  id: string;
  productId: string;
  bomCode: string;
  version: string;
  materialId: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlmDocument {
  id: string;
  docCode: string;
  docName: string;
  docType: string;
  filePath: string;
  fileSize: number;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlmProduct {
  id: string;
  productCode: string;
  productName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRouting {
  id: string;
  productId: string;
  productName: string;
  routingCode: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlan {
  id: string;
  planCode: string;
  planName: string;
  planPeriod: string;
  startDate: string;
  endDate: string;
  status: string;
  capacityHours: number;
  usedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlanItem {
  id: string;
  planId: string;
  itemName: string;
  resourceType: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  sortOrder: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderCode: string;
  supplierId: string;
  status: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface PurchaseOrderReceipt {
  id: string;
  orderId: string;
  receiptCode: string;
  quantity: number;
  acceptedAt: string;
  result: string;
  createdAt: string;
}

export interface PurchaseOrderSaleOrder {
  id: string;
  purchaseOrderId: string;
  saleOrderId: string;
  createdAt: string;
}

export interface Qualification {
  id: string;
  qualCode: string;
  employeeId: string;
  qualName: string;
  qualType: string;
  issueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityObjective {
  id: string;
  objCode: string;
  objName: string;
  category: string;
  targetValue: number;
  unit: string;
  currentValue: number;
  period: string;
  periodYear: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairRequest {
  id: string;
  requestCode: string;
  equipmentId: string;
  faultDescription: string;
  severity: string;
  reportedAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairWorkOrder {
  id: string;
  orderCode: string;
  requestId: string;
  equipmentId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingOperation {
  id: string;
  routingId: string;
  opSequence: number;
  opName: string;
  opCode: string;
  standardLaborHours: number;
  standardMachineHours: number;
  createdAt: string;
}

export interface SamplingWorkOrder {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  unit: string;
  deadline: string;
  status: string;
  applicant: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillMatrix {
  id: string;
  employeeId: string;
  skillName: string;
  skillCategory: string;
  proficiency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  unit: string;
  safetyStock: number;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePartRecord {
  id: string;
  partId: string;
  type: string;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  createdAt: string;
}

export interface SpcMeasurement {
  id: string;
  studyId: string;
  subgroupNo: number;
  sampleNo: number;
  measuredValue: number;
  measuredAt: string;
  createdAt: string;
}

export interface SpcStudy {
  id: string;
  studyCode: string;
  studyName: string;
  chartType: string;
  characteristic: string;
  unit: string;
  subgroupSize: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  category: string;
  status: string;
  rating: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierApproval {
  id: string;
  supplierId: string;
  approvalType: string;
  status: string;
  createdAt: string;
}

export interface SupplierQcdsScore {
  id: string;
  supplierId: string;
  period: string;
  qualityScore: number;
  costScore: number;
  deliveryScore: number;
  serviceScore: number;
  totalScore: number;
  createdAt: string;
}

export interface SystemBackup {
  id: string;
  fileName: string;
  fileSize: number;
  path: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface TpmCheckPlan {
  id: string;
  planCode: string;
  equipmentId: string;
  checkDate: string;
  status: string;
  createdAt: string;
}

export interface TpmCheckRecord {
  id: string;
  equipmentId: string;
  checkItem: string;
  checkResult: string;
  checkedAt: string;
  triggeredRepair: boolean;
}

export interface TpmCheckStandard {
  id: string;
  equipmentId: string;
  checkItem: string;
  frequency: string;
  sortOrder: number;
  createdAt: string;
}

export interface TrainingCourse {
  id: string;
  courseCode: string;
  courseName: string;
  courseType: string;
  category: string;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlan {
  id: string;
  planCode: string;
  planName: string;
  planYear: number;
  targetCount: number;
  completedCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingRecord {
  id: string;
  recordCode: string;
  courseId: string;
  employeeId: string;
  courseName: string;
  employeeName: string;
  trainingDate: string;
  hours: number;
  result: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInventory {
  id: string;
  warehouseId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  safetyStock: number;
  abcClass: string;
  updatedAt: string;
  createdAt: string;
}

export interface WarehouseLocation {
  id: string;
  locationCode: string;
  locationName: string;
  warehouseId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkCalendar {
  id: string;
  calendarDate: string;
  isWorkingDay: boolean;
  capacityHours: number;
}
