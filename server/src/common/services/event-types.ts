// Cross-module event type constants.
// Each constant maps to a business event that triggers a downstream action.

export const CrossModuleEvents = {
  // Chain 1 & 3: CRM Order Confirmed -> NPI tech review + Purchase order
  CRM_ORDER_CONFIRMED: 'crm:order:confirmed',

  // Chain 2: NPI Project Tech Review Passed -> CRM quote
  NPI_PROJECT_REVIEW_PASSED: 'npi:project:review-passed',

  // Chain 4: Purchase Receipt Completed -> Quality IQC incoming inspection
  PURCHASE_RECEIPT_COMPLETED: 'purchase:receipt:completed',

  // Chain 5: Quality NCR Created -> Supplier QCDS score update
  QUALITY_NCR_CREATED: 'quality:ncr:created',

  // Chain 6: Equipment Anomaly Detected -> PLM technical change document
  EQUIPMENT_ANOMALY_DETECTED: 'equipment:anomaly:detected',

  // Chain 7: Manufacturing Order Completed -> CrmOrder delivery update
  MFG_ORDER_COMPLETED: "manufacturing:order:completed",
  // Chain 8: Manufacturing Order Released -> Warehouse material issuing
  MFG_ORDER_RELEASED: "manufacturing:order:released",

  // Chain 9: CRM Quote Approved -> Sales notification + Order creation
  CRM_QUOTE_APPROVED: 'crm:quote:approved',

  // Chain 10: CRM Order Shipped -> OQC inspection trigger
  CRM_ORDER_SHIPPED: 'crm:order:shipped',

  // Chain 11: Payment Received -> Finance reconciliation + Order status
  PAYMENT_RECEIVED: 'finance:payment:received',

  // Chain 12: Warehouse Stock Low -> Purchase suggestion alert
  WAREHOUSE_STOCK_LOW: 'warehouse:stock:low',

  // Chain 13: Supplier Score Updated -> Supplier tier review
  SUPPLIER_SCORE_UPDATED: 'supplier:score:updated',
  IQC_INSPECTION_PASSED: 'quality:iqc:passed',
} as const;

export interface CrossModuleEvent {
  type: string;
  source: string;
  data: any;
  timestamp: Date;
}
