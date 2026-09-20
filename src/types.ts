/**
 * BLUENILLA POS & Enterprise Platform - Type Definitions
 */

export type PlatformMode = 'browser' | 'android' | 'desktop';
export type NetworkMode = 'online' | 'offline';

export type WorkspaceType = 'dashboard' | 'sales' | 'storeroom' | 'accounts' | 'hr' | 'manager' | 'it' | 'back_office' | 'hive_master';
export type WorkspaceRole = WorkspaceType;

export type UserRole = 
  | 'system_host'
  | 'business_owner'
  | 'tenant_admin'
  | 'cashier' 
  | 'receiver' 
  | 'accountant' 
  | 'hr_officer' 
  | 'store_manager' 
  | 'it_admin' 
  | 'hive_master';

export type UserCategory = 'system_host' | 'business_owner' | 'staff';

export interface DesignationRole {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  baseRole: UserRole;
  colorTag: 'amber' | 'emerald' | 'sky' | 'indigo' | 'purple' | 'rose' | 'slate';
  permissions: string[];
  hourlyRateDefault?: number;
  isSystem?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designationTitle?: string;
  designationRoleId?: string;
  userCategory?: UserCategory;
  workspace: WorkspaceType;
  avatar: string;
  pin: string;
  password?: string;
  biometricRegistered: boolean;
  branchId: string;
  branchName: string;
  tenantId?: string;
  permissions: string[];
  lastLogin: string;
  hourlyRate?: number;
  grantedModules?: string[];
}

export function isSystemHostUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'system_host' || 
    user.role === 'hive_master' || 
    user.userCategory === 'system_host' ||
    user.email === 'aqutewavedev@gmail.com'
  );
}

export function isBusinessOwnerUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'business_owner' || user.userCategory === 'business_owner';
}

export function isTenantAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'business_owner' ||
    user.role === 'tenant_admin' ||
    user.role === 'store_manager' ||
    user.userCategory === 'business_owner'
  );
}

export function isTerminalUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'cashier' ||
    user.userCategory === 'staff'
  );
}

export function hasModuleAccess(user: User | null | undefined, moduleKey: string): boolean {
  if (moduleKey === 'dashboard') return true;
  if (!user) return false;
  // Hive admin has access everywhere
  if (isSystemHostUser(user)) return true;
  // Tenant owner/admin has access to all shop modules
  if (isBusinessOwnerUser(user) || isTenantAdminUser(user)) return true;
  // Terminal has access only to designated modules granted by tenant of that shop
  if (user.grantedModules && user.grantedModules.length > 0) {
    return user.grantedModules.includes(moduleKey);
  }
  // Default granted modules for terminal devices: pos, shift, and scanner
  return ['pos', 'shift', 'scanner'].includes(moduleKey);
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  reorderPoint: number;
  binLocation: string; // e.g. "Aisle 3 - Bay B - Shelf 2"
  batchLotNumber: string;
  expiryDate?: string;
  supplier: string;
  taxRate: number; // e.g. 0.08 for 8%
  imageUrl: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number; // 0 to 100
  total: number;
  note?: string;
}

export type PaymentType = 'cash' | 'card' | 'mobile_nfc' | 'split' | 'store_credit';

export interface PaymentRecord {
  type: PaymentType;
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  orderNumber?: string;
  tenantId?: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  tax?: number;
  total: number;
  payments: PaymentRecord[];
  tenderedAmount: number;
  changeGiven: number;
  cashierId: string;
  cashierName: string;
  branchId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'completed' | 'parked' | 'refunded' | 'voided';
  offlineSynced: boolean;
  syncTimestamp?: string;
}

export interface ParkedOrder {
  id: string;
  title: string;
  cart: CartItem[];
  parkedAt: string;
  cashierName: string;
  note?: string;
}

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  expectedDate: string;
  status: 'pending' | 'partially_received' | 'received';
  items: PurchaseOrderItem[];
  totalValue: number;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityChange: number; // positive or negative
  type: 'received' | 'damaged' | 'shrinkage' | 'transfer' | 'audit_reconcile';
  reason: string;
  operatorName: string;
  timestamp: string;
  synced: boolean;
}

export interface InvoiceAR {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
}

export interface BillAP {
  id: string;
  billNumber: string;
  vendorName: string;
  category: string;
  billDate: string;
  dueDate: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'scheduled';
}

export interface JournalEntry {
  id: string;
  reference: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  postedBy: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Logistics' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Software & IT';
  payee: string;
  amount: number;
  receiptNumber: string;
  paymentMethod: string;
  approvedBy: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: string;
  department: string;
  hourlyRate: number;
  status: 'active' | 'on_break' | 'shift_off' | 'suspended';
  phone: string;
  emergencyContact: string;
  hireDate: string;
  biometricEnrolled: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  biometricVerified: boolean;
  location: string;
  totalHoursWorked?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Annual Leave' | 'Sick Leave' | 'Emergency' | 'Training';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'void_sale' | 'high_discount' | 'refund_override' | 'price_override';
  requestorId: string;
  requestorName: string;
  orderId?: string;
  amount?: number;
  discountPercent?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  reviewedBy?: string;
}

export interface BranchPerformance {
  branchId: string;
  name: string;
  address: string;
  todaySales: number;
  targetSales: number;
  transactionsCount: number;
  averageBasket: number;
  topCashier: string;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export interface ShiftRecord {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked: number;
  hourlyRate: number;
  status: 'active' | 'completed';
}

export interface SyncQueueItem {
  id: string;
  entityType?: 'transaction' | 'stock_adjustment' | 'attendance' | 'po_receive' | 'audit_log';
  entity?: string;
  entityId?: string;
  payload?: any;
  data?: any;
  action: 'create' | 'update' | 'delete';
  createdOfflineAt?: string;
  timestamp?: string;
  retryCount?: number;
  status: 'pending' | 'synced' | 'conflict';
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  actorName?: string;
  actorRole?: string;
  workspace?: WorkspaceType;
  action: string;
  entity?: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical';
  ipAddress?: string;
  deviceType?: string;
}

export type AuditLog = SystemAuditLog;

export interface GDPRConsent {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectEmail: string;
  consents: {
    posTransactionalData: boolean;
    marketingCommunication: boolean;
    biometricVerification: boolean;
    deviceAnalytics: boolean;
  };
  consentDate: string;
  anonymized: boolean;
}

export interface CloudBackupSnapshot {
  id: string;
  createdAt: string;
  timestamp?: string;
  sizeKb: number;
  recordCount: number;
  hash: string;
  status: 'healthy' | 'verified';
  backupLocation: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert' | 'error';
  timestamp: string;
  read: boolean;
  targetWorkspace?: WorkspaceType;
}

// ==========================================
// HYBRID ARCHITECTURE: HIVE, TENANT & TERMINAL
// ==========================================

export interface ModuleControlConfig {
  sales: boolean;
  storeroom: boolean;
  accounts: boolean;
  hr: boolean;
  manager: boolean;
  it: boolean;
  multiStore?: boolean;
}

export interface SubmoduleControlConfig {
  sales?: {
    quickCashButtons?: boolean;
    cashierDiscounts?: boolean;
    allowPriceOverride?: boolean;
    customerFacingDisplay?: boolean;
    autoKickCashDrawer?: boolean;
    parkedOrders?: boolean;
    splitPayments?: boolean;
    paperlessReceipts?: boolean;
  };
  storeroom?: {
    stockReplenishment?: boolean;
    lowStockAlerts?: boolean;
    stockAdjustments?: boolean;
    barcodeReceiving?: boolean;
    preventNegativeStock?: boolean;
  };
  accounts?: {
    arApInvoicing?: boolean;
    midnightZReport?: boolean;
    expenseVouchers?: boolean;
    taxFiling?: boolean;
    ledgerExport?: boolean;
  };
  hr?: {
    shiftScheduling?: boolean;
    timeclockStamps?: boolean;
    wageTracking?: boolean;
    tipPooling?: boolean;
    biometricEnforcement?: boolean;
  };
  manager?: {
    grossMarginAnalysis?: boolean;
    cashDrawerReconciliation?: boolean;
    pdfExecutiveReports?: boolean;
    hourlyPeakAnalytics?: boolean;
  };
  it?: {
    hardwarePairing?: boolean;
    cloudBackups?: boolean;
    redisTelemetry?: boolean;
    gdprErasure?: boolean;
  };
}

export interface HiveAdminRecord {
  id: string;
  email: string;
  role: 'super_root' | 'hive_supervisor' | 'support_admin';
  createdAt: string;
}

export interface TenantModuleSettingsDoc {
  inventory: boolean;
  reports: boolean;
  multiStore: boolean;
  sales: boolean;
  storeroom: boolean;
  accounts: boolean;
  hr: boolean;
  manager: boolean;
  it: boolean;
  submodules?: SubmoduleControlConfig;
  updatedAt: string;
  updatedBy?: string;
}

export interface TenantSubscriptionDetailsDoc {
  plan: string;
  status: TenantSubscriptionStatus;
  monthlyFee: number;
  billingCycle: 'monthly' | 'annual';
  expiresAt: string; // ISO String or Firestore Timestamp string
  contractId?: string;
  notes?: string;
  updatedAt: string;
}

export type SubscriptionPlanTier = 'Starter' | 'Professional' | 'Enterprise' | 'Custom';
export type TenantSubscriptionStatus = 'active' | 'suspended' | 'trial' | 'past_due' | 'unsubscribed';

export interface TenantContext {
  id: string;
  tenantId: string;
  tenantName: string;
  businessId: string;
  businessName: string;
  subdomain: string;
  plan: SubscriptionPlanTier;
  status: TenantSubscriptionStatus;
  createdAt: string;
  contactEmail: string;
  /** Essential mobile number for store communication, calls, SMS and login/identification */
  mobileNumber?: string;
  /** Whether the store contact is optionally reachable on WhatsApp */
  isWhatsAppAvailable?: boolean;
  /** WhatsApp specific contact number (defaults to mobileNumber if not specified) */
  whatsappNumber?: string;
  currency: string;
  timezone: string;
  enabledModules: ModuleControlConfig;
  enabledSubmodules?: SubmoduleControlConfig;
  monthlyFee: number;
  terminalQuota: number;
  activeTerminalsCount: number;
  databaseCluster: string;
  billingCycle?: 'monthly' | 'annual';
  subscriptionPaidDate?: string;
  subscriptionNextBillingDate?: string;
  subscriptionNotes?: string;
  contractId?: string;
  /** ISO date/time or Timestamp when subscription expires */
  expiresAt?: string;
  /** Whether this shop is currently activated with a subscription for full read/write operations */
  isSubscribed?: boolean;
  /** Physical branch location or address */
  branchAddress?: string;
  /** Owner email associated with this shop */
  ownerEmail?: string;
  /** Custom plan name if Plan is Custom or bespoke package */
  customPlanName?: string;
  /** Custom negotiated SLA level */
  customSla?: string;
  /** Custom grace period in days */
  customGraceDays?: number;
  /** Custom max catalog SKU quota */
  customMaxSku?: number;
  /** Custom daily transaction volume ceiling */
  customMaxDailyTx?: number;
  /** Timestamp when host approved the subscription */
  approvedAt?: string;
  /** Host admin email who approved the subscription */
  approvedBy?: string;
  /** Timestamp of most recent automated or manual alert dispatch */
  lastAlertSentAt?: string;
  /** Last alert type sent */
  lastAlertType?: 'overdue' | 'expiry' | 'approved' | 'custom';
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionPlanTier;
  monthlyFee: number;
  annualFee: number;
  currency: string;
  terminalQuota: number;
  isUnlimitedTerminals?: boolean;
  description: string;
  badgeClass: string;
  borderClass: string;
  highlightFeatures: string[];
  includedModules: ModuleControlConfig;
  includedSubmodules?: SubmoduleControlConfig;
  sla: string;
  isPopular?: boolean;
  status: 'active' | 'archived' | 'draft';
  subscriberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEmailAlert {
  id: string;
  tenantId: string;
  businessName: string;
  recipientEmail: string;
  alertType: 'overdue_warning' | 'expiry_alert' | 'subscription_approved' | 'custom_notice';
  subject: string;
  bodyHtml: string;
  sentAt: string;
  status: 'sent' | 'simulated';
  sentBy: string;
  daysRemaining?: number;
}

export interface SubscriptionAlertInfo {
  state: 'overdue' | 'expiring_critical' | 'expiring_warning' | 'approved' | 'healthy' | 'unsubscribed';
  daysRemaining: number;
  isOverdue: boolean;
  isExpiringSoon: boolean;
  isApproved: boolean;
  title: string;
  message: string;
  badgeColor: string;
  bannerColor: string;
  textColor: string;
  actionText: string;
}

/**
 * Calculates current subscription alert status for a tenant
 */
export function getSubscriptionAlertState(tenant: TenantContext | null | undefined): SubscriptionAlertInfo {
  if (!tenant) {
    return {
      state: 'unsubscribed',
      daysRemaining: 0,
      isOverdue: false,
      isExpiringSoon: false,
      isApproved: false,
      title: 'No Tenant Active',
      message: 'Select a business tenant to inspect subscription state.',
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      bannerColor: 'bg-slate-900 border-slate-700',
      textColor: 'text-slate-300',
      actionText: 'Select Shop'
    };
  }

  if (tenant.status === 'unsubscribed' || tenant.isSubscribed === false) {
    return {
      state: 'unsubscribed',
      daysRemaining: 0,
      isOverdue: false,
      isExpiringSoon: false,
      isApproved: false,
      title: 'Shop Unsubscribed (Guest Mode)',
      message: 'This shop is browsing in Guest Mode. POS checkout and data writes are locked.',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      bannerColor: 'bg-amber-950/40 border-amber-500/40',
      textColor: 'text-amber-200',
      actionText: 'Activate Subscription'
    };
  }

  const now = Date.now();
  const expiry = tenant.expiresAt ? new Date(tenant.expiresAt).getTime() : now + 365 * 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  // Check Overdue
  if (daysRemaining <= 0 || tenant.status === 'past_due' || tenant.status === 'suspended') {
    const overdueDays = Math.abs(daysRemaining);
    return {
      state: 'overdue',
      daysRemaining,
      isOverdue: true,
      isExpiringSoon: false,
      isApproved: false,
      title: 'Subscription Overdue Alert',
      message: `Subscription for ${tenant.businessName} expired ${overdueDays === 0 ? 'today' : `${overdueDays} day${overdueDays > 1 ? 's' : ''} ago`}. Grace period active. Renew immediately to maintain live POS till register operations.`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      bannerColor: 'bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-rose-600/50',
      textColor: 'text-rose-100',
      actionText: 'Resolve & Renew Now'
    };
  }

  // Critical Expiry (1 to 3 days remaining)
  if (daysRemaining <= 3) {
    return {
      state: 'expiring_critical',
      daysRemaining,
      isOverdue: false,
      isExpiringSoon: true,
      isApproved: false,
      title: 'Critical Expiry Alert',
      message: `Subscription for ${tenant.businessName} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}! Automatic renewal or Host approval required to prevent till downtime.`,
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      bannerColor: 'bg-gradient-to-r from-orange-950/90 via-amber-900/80 to-orange-950/90 border-orange-500/50',
      textColor: 'text-orange-100',
      actionText: 'Renew Subscription'
    };
  }

  // Warning Expiry (4 to 14 days remaining)
  if (daysRemaining <= 14) {
    return {
      state: 'expiring_warning',
      daysRemaining,
      isOverdue: false,
      isExpiringSoon: true,
      isApproved: false,
      title: 'Upcoming Subscription Expiry',
      message: `License renewal due in ${daysRemaining} days (expires ${new Date(expiry).toLocaleDateString()}). All ${tenant.activeTerminalsCount || 0} paired POS terminals remain active.`,
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      bannerColor: 'bg-gradient-to-r from-amber-950/70 via-yellow-950/60 to-amber-950/70 border-amber-500/40',
      textColor: 'text-amber-100',
      actionText: 'Review Subscription'
    };
  }

  // Recently Approved (within 7 days of approvedAt or newly approved)
  const isRecentlyApproved = tenant.approvedAt && (now - new Date(tenant.approvedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (isRecentlyApproved) {
    return {
      state: 'approved',
      daysRemaining,
      isOverdue: false,
      isExpiringSoon: false,
      isApproved: true,
      title: 'Subscription Approved & Active',
      message: `Host approved subscription tier (${tenant.customPlanName || tenant.plan}) with ${tenant.terminalQuota} terminal seats. Valid through ${new Date(expiry).toLocaleDateString()}.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      bannerColor: 'bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-emerald-950/70 border-emerald-500/40',
      textColor: 'text-emerald-100',
      actionText: 'View License'
    };
  }

  return {
    state: 'healthy',
    daysRemaining,
    isOverdue: false,
    isExpiringSoon: false,
    isApproved: false,
    title: 'Active Subscription',
    message: `Plan ${tenant.customPlanName || tenant.plan} healthy. Expires in ${daysRemaining} days (${new Date(expiry).toLocaleDateString()}).`,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bannerColor: 'bg-slate-900 border-slate-800',
    textColor: 'text-slate-300',
    actionText: 'Manage Plan'
  };
}

/**
 * Checks whether a specific inner submodule is permitted for a tenant by Hive
 */
export function isSubmoduleEnabled<M extends keyof SubmoduleControlConfig>(
  tenant: TenantContext | null | undefined,
  mainModule: M,
  submoduleKey: keyof NonNullable<SubmoduleControlConfig[M]>
): boolean {
  if (!tenant) return false;
  // If the parent main module is disabled, all its inner submodules are automatically cut off
  const mainModuleKey = mainModule as keyof ModuleControlConfig;
  if (tenant.enabledModules && tenant.enabledModules[mainModuleKey] === false) {
    return false;
  }
  // If explicit submodule gating exists, check it; otherwise default to true if main module is active
  const subConfig = tenant.enabledSubmodules?.[mainModule];
  if (subConfig && typeof (subConfig as any)[submoduleKey] === 'boolean') {
    return (subConfig as any)[submoduleKey] !== false;
  }
  return true;
}

/**
 * Returns true if the shop has an active subscription enabling full read & write capabilities.
 * Unsubscribed shops operate in Guest Mode (can roam & read, but cannot write).
 */
export function isShopSubscribed(tenant: TenantContext | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status === 'suspended' || tenant.status === 'unsubscribed') return false;
  return tenant.isSubscribed !== false;
}

/**
 * Returns true if the shop is in Guest Mode (unsubscribed: roam and read, but cannot write).
 */
export function isShopGuestMode(tenant: TenantContext | null | undefined): boolean {
  return !isShopSubscribed(tenant);
}

export interface TerminalDevice {
  id: string;
  terminalCode: string; // e.g. "REG-01"
  name: string;
  tenantId: string;
  businessId: string;
  businessName: string;
  deviceType: PlatformMode;
  operatingSystem: string;
  ipAddress: string;
  appVersion: string;
  status: 'online' | 'offline' | 'syncing';
  lastHeartbeat: string;
  unprocessedQueueCount: number;
  assignedCashierId?: string;
  assignedCashierName?: string;
  batteryLevel?: number;
  isRegistered: boolean;
}

export interface HivePlatformMetrics {
  totalTenants: number;
  activeBusinesses: number;
  onlineTerminals: number;
  totalTerminals: number;
  syncedTransactionsToday: number;
  pendingSyncQueue: number;
  redisQueueDepth: number;
  databaseLatencyMs: number;
  mrrTotal: number;
  systemHealthPercent: number;
}

export interface DeviceInvite {
  id: string;
  inviteCode: string; // e.g. "PAIR-BN-8821"
  tenantId: string;
  businessId: string;
  businessName: string;
  terminalName: string; // e.g. "Lane 3 Self-Checkout"
  terminalCode: string; // e.g. "REG-03"
  deviceType: PlatformMode; // 'browser' | 'android' | 'desktop'
  branchId: string;
  branchName: string;
  assignedCashierId?: string;
  assignedCashierName?: string;
  status: 'pending' | 'paired' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt: string;
  pairedAt?: string;
  pairedDeviceId?: string;
  notes?: string;
}

// ==========================================
// TENANT SHOP BACK OFFICE & FRONTEND MODULES
// ==========================================

export interface ShopSalesPOSConfig {
  enabled: boolean;
  quickCashButtons: number[]; // e.g. [10, 20, 50, 100]
  allowCashierDiscounts: boolean;
  maxDiscountPercentWithoutManager: number;
  allowPriceOverride: boolean;
  customerFacingDisplay: boolean;
  autoKickCashDrawer: boolean;
  barcodeContinuousMode: boolean;
  paperlessDigitalReceipts: boolean;
  allowParkedOrders: boolean;
  allowSplitPayments: boolean;
  requireCashFloatVerification: boolean;
}

export interface ShopStoreroomConfig {
  enabled: boolean;
  lowStockBannerAtPOS: boolean;
  lowStockThreshold: number;
  preventNegativeStockSales: boolean;
  requireManagerApprovalStockAdjustment: boolean;
  rapidBarcodeReceiving: boolean;
}

export interface ShopAccountsConfig {
  enabled: boolean;
  autoGenerateZReportAtMidnight: boolean;
  allowExpenseVouchersAtPOS: boolean;
  enforceShiftBalancing: boolean;
}

export interface ShopHRConfig {
  enabled: boolean;
  requireClockInBeforeSale: boolean;
  biometricClockInEnforced: boolean;
  overtimeAlerts: boolean;
}

export interface ShopFrontendModulesConfig {
  salesPOS: ShopSalesPOSConfig;
  storeroom: ShopStoreroomConfig;
  accounts: ShopAccountsConfig;
  hr: ShopHRConfig;
  managerReports: boolean;
  itDiagnostics: boolean;
}

export interface ShopBrandingConfig {
  shopDisplayName: string;
  taxRatePercent: number;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  taxRegistrationNumber: string;
  returnPolicyDays: number;
  supportPhone?: string;
  supportEmail?: string;
}

export interface TenantShopConfig {
  id: string;
  tenantId: string;
  businessName: string;
  branchName: string;
  branding: ShopBrandingConfig;
  modules: ShopFrontendModulesConfig;
  rolePermissions: {
    cashier: string[];
    receiver: string[];
    accountant: string[];
    store_manager: string[];
    tenant_admin: string[];
  };
  updatedAt: string;
  updatedBy: string;
}

export interface DailyZReport {
  id: string;
  tenantId: string;
  reportDate: string;
  openedAt: string;
  closedAt: string;
  generatedBy: string;
  totalTransactions: number;
  grossSales: number;
  discountTotal: number;
  netSales: number;
  taxCollected: number;
  cashTenders: number;
  cardTenders: number;
  nfcTenders: number;
  splitTenders: number;
  openingFloat: number;
  cashInDrawerExpected: number;
  actualCashCounted: number;
  variance: number;
  voidCount: number;
  voidTotal: number;
  refundCount: number;
  refundTotal: number;
  isReconciled: boolean;
}

export interface FrontendAnomaly {
  id: string;
  type: 'negative_stock' | 'stuck_transaction' | 'calculation_drift' | 'drawer_mismatch' | 'corrupted_queue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId?: string;
  suggestedAction: string;
  status: 'detected' | 'resolved';
  timestamp: string;
}

export interface TenantBackupSnapshot {
  id: string;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  scope: 'tenant_isolated';
  folderPath: string;
  notes?: string;
  version?: string;
  productsCount?: number;
  transactionsCount?: number;
  stats: {
    productsCount: number;
    transactionsCount: number;
    zReportsCount: number;
    hasConfig: boolean;
  };
  dataSnapshot?: {
    config?: TenantShopConfig;
    products?: Product[];
    transactions?: Transaction[];
    dailyZReport?: DailyZReport | null;
  };
}

export interface HiveCentralBackupSnapshot {
  id: string;
  createdAt: string;
  createdBy: string;
  scope: 'hive_central';
  folderPath: string;
  notes?: string;
  version?: string;
  totalTenants?: number;
  stats: {
    tenantsCount: number;
    totalTerminals: number;
    platformVersion: string;
  };
  dataSnapshot?: any;
}

export interface RepairActionLog {
  id: string;
  tenantId: string;
  anomalyType: string;
  actionTaken: string;
  resolvedAt: string;
  resolvedBy: string;
  itemsAffected: number;
}

// =============================================================
// RICH TENANT BACKEND CONTROL MODULE DATA TYPES
// =============================================================

// 1. SALES
export interface SalesSummaryAggregate {
  period: string;
  totalTransactions: number;
  grossSales: number;
  netSales: number;
  totalTax: number;
  totalDiscount: number;
  byProduct: { productId: string; name: string; quantity: number; revenue: number }[];
  byCategory: { category: string; count: number; revenue: number }[];
  byPaymentType: { type: string; count: number; amount: number }[];
  byDiscount: { name: string; timesUsed: number; totalSaved: number }[];
}

export interface RefundItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  restockInventory: boolean;
}

export interface RefundRecord {
  id: string;
  tenantId: string;
  refundNumber: string;
  receiptNumber: string;
  originalTransactionId?: string;
  customerName?: string;
  items: RefundItem[];
  totalRefunded: number;
  refundMethod: PaymentType;
  reason: string;
  authorizedBy: string;
  timestamp: string;
  status: 'completed' | 'pending_approval' | 'rejected';
}

export interface StoreChargeRule {
  id: string;
  tenantId: string;
  name: string;
  type: 'surcharge' | 'service_fee' | 'delivery' | 'eco_levy' | 'tip';
  rateType: 'percentage' | 'fixed';
  value: number; // e.g. 2 for 2% or 5 for $5
  appliesTo: 'all' | 'card_only' | 'dine_in' | 'delivery';
  isActive: boolean;
}

export interface SuspiciousActivityReport {
  id: string;
  tenantId: string;
  type: 'void_after_print' | 'excessive_discount' | 'drawer_no_sale' | 'price_override' | 'abnormal_refund';
  severity: 'low' | 'medium' | 'high';
  cashierName: string;
  orderId?: string;
  amount?: number;
  details: string;
  timestamp: string;
  flaggedBy: string;
}

// 2. PRODUCTS
export interface ProductCategoryItem {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  parentId?: string | null;
  taxRatePercent?: number;
  colorCode: string;
  itemCount?: number;
  sortOrder: number;
}

export interface ProductModifierGroup {
  id: string;
  tenantId: string;
  name: string; // e.g. "Size", "Milk Choice", "Toppings"
  minSelect: number;
  maxSelect: number;
  options: { id: string; name: string; priceDelta: number; isDefault?: boolean }[];
}

export interface UnitOfMeasurement {
  id: string;
  tenantId: string;
  name: string; // e.g. "Kilogram", "Litre", "Piece"
  symbol: string; // e.g. "kg", "L", "pcs"
  isFractional: boolean;
  ratioToBase: number;
  baseUnit: string;
}

export interface ClassificationCodeItem {
  id: string;
  tenantId: string;
  code: string; // e.g. "0901.21.00"
  standard: 'HS_CODE' | 'UNSPSC' | 'TAX_FISCAL';
  description: string;
}

// 3. CUSTOMER BASE & DEBTORS
export interface CustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  customerGroup: 'retail' | 'vip' | 'wholesale';
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  creditLimit: number;
  currentDebt: number;
  taxNumber?: string;
  notes?: string;
  createdAt: string;
  totalOrdersCount: number;
  totalSpent: number;
}

export interface DebtorInvoice {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'settled';
}

export interface CreditSettlementRecord {
  id: string;
  tenantId: string;
  settlementNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentType: PaymentType;
  reference: string;
  allocatedInvoiceId?: string;
  recordedBy: string;
  timestamp: string;
  notes?: string;
}

// 4. DISCOUNT & PRICING PLANS
export interface DiscountPlanItem {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed_amount' | 'bogo' | 'basket_threshold';
  value: number; // e.g. 10 for 10% or $10
  minBasketTotal?: number;
  bogoConfig?: { buyQty: number; getQty: number; discountPercent: number };
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

export interface PricingPlanTier {
  id: string;
  tenantId: string;
  name: string; // e.g. "Retail Standard", "VIP Club", "Wholesale Bulk"
  tierCode: 'retail' | 'vip' | 'wholesale' | 'distributor';
  priceMultiplier: number; // e.g. 1.0, 0.90 (-10%), 0.75 (-25%)
  isDefault: boolean;
}

export interface ScheduledPriceChangeItem {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  currentPrice: number;
  newPrice: number;
  effectiveDate: string;
  status: 'scheduled' | 'executed' | 'cancelled';
  scheduledBy: string;
}

// 5. STAFF HR ADMIN
export interface StaffCommissionRule {
  id: string;
  tenantId: string;
  name: string;
  type: 'percentage_sales' | 'flat_per_item';
  rate: number; // e.g. 5% or $2 per item
  appliesToRole: string;
  isActive: boolean;
}

export interface StaffCommissionPayout {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  period: string;
  salesTotal: number;
  commissionEarned: number;
  status: 'pending' | 'approved' | 'paid';
}

export interface StaffAccessLogItem {
  id: string;
  tenantId: string;
  timestamp: string;
  employeeName: string;
  role: string;
  action: string;
  ipAddress: string;
  deviceType: string;
  status: 'success' | 'blocked';
}

// 6. APP CONTROL & IT BACKEND
export interface TenantApiKeyItem {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  secretKeyMasked: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

export interface TenantWebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastDeliveryStatus?: 'success' | 'failed';
  lastDeliveryAt?: string;
}

export interface CustomPaymentTypeItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  enabled: boolean;
  requiresReference: boolean;
  chargeFeePercent?: number;
}

export interface ReceiptDesignExtended {
  headerLogoUrl?: string;
  showBarcode: boolean;
  showTaxNumber: boolean;
  fontSize: 'compact' | 'standard' | 'large';
  footerCustomMessage: string;
  socialMediaHandle: string;
}

// 7. HELP CENTRE & SUPPORT
export interface HelpArticleItem {
  id: string;
  title: string;
  category: 'POS Sales' | 'Inventory & Products' | 'Customer Debtors' | 'Hardware Setup' | 'Accounting & Tax';
  content: string;
  readTime: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicketItem {
  id: string;
  tenantId: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  messages: SupportChatMessage[];
}

export type ProductClassificationCode = ClassificationCodeItem;
export type DebtorInvoiceRecord = DebtorInvoice;
export type DebtorSettlementRecord = CreditSettlementRecord;
export type PricingTierPlan = PricingPlanTier;
export type ScheduledPriceChange = ScheduledPriceChangeItem;
export type StaffAccessLog = StaffAccessLogItem;
export type TenantApiKeyRecord = TenantApiKeyItem;
export type WebhookConfigRecord = TenantWebhookSubscription;
export type HelpCenterArticle = HelpArticleItem;
export type LiveSupportTicket = SupportTicketItem;

export interface PosDeviceRegistration {
  id?: string;
  deviceName: string;
  ipAddress: string;
  printerModel: string;
  status: 'online' | 'offline';
  lastPing?: string;
}

export type CommunicationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'live_chat' | 'both' | 'all';

// Hive Master <-> Tenant In-App, Email, SMS, WhatsApp & Live Chat Communications
export interface TenantCommunication {
  id: string;
  tenantId: string; // or 'ALL_TENANTS'
  tenantName: string;
  recipientEmail: string; // The email used on tenant's account credentials (can be empty if not provided yet)
  recipientPhone?: string; // Essential mobile number for SMS/calls
  recipientWhatsApp?: string; // WhatsApp number
  senderRole: 'hive_master' | 'tenant';
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  channel: CommunicationChannel;
  priority: 'normal' | 'important' | 'critical';
  status: 'delivered' | 'read' | 'pending';
  createdAt: string;
  readAt?: string;
  isLiveChat?: boolean;
  replyToId?: string;
  chatSessionId?: string;
}

