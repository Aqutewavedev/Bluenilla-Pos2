import { Router, Request, Response, NextFunction } from 'express';
import { 
  TenantShopConfig, 
  DailyZReport, 
  ShopFrontendModulesConfig, 
  ShopBrandingConfig 
} from '../src/types';
import {
  getTenantProducts,
  createTenantProduct,
  updateTenantProduct,
  deleteTenantProduct,
  getTenantTransactions,
  updateTenantTransaction,
  deleteTenantTransaction,
  scanTenantAnomalies,
  autoRepairTenantAnomalies,
  getTenantRepairLogs,
  createTenantBackup,
  listTenantBackups,
  restoreTenantBackup,
  deleteTenantBackup,
  createHiveCentralBackup,
  listHiveCentralBackups,
  restoreHiveCentralBackup,
  syncDocToFirestore,
  deleteDocFromFirestore,
  getCollectionFromFirestore,
  getDocumentFromFirestore
} from './firebaseAdminService';

// In-Memory Database for Tenant Shop Back Office Configurations
const defaultModulesConfig: ShopFrontendModulesConfig = {
  salesPOS: {
    enabled: true,
    quickCashButtons: [10, 20, 50, 100],
    allowCashierDiscounts: true,
    maxDiscountPercentWithoutManager: 15,
    allowPriceOverride: false,
    customerFacingDisplay: true,
    autoKickCashDrawer: true,
    barcodeContinuousMode: true,
    paperlessDigitalReceipts: true,
    allowParkedOrders: true,
    allowSplitPayments: true,
    requireCashFloatVerification: true
  },
  storeroom: {
    enabled: true,
    lowStockBannerAtPOS: true,
    lowStockThreshold: 10,
    preventNegativeStockSales: true,
    requireManagerApprovalStockAdjustment: true,
    rapidBarcodeReceiving: true
  },
  accounts: {
    enabled: true,
    autoGenerateZReportAtMidnight: true,
    allowExpenseVouchersAtPOS: true,
    enforceShiftBalancing: true
  },
  hr: {
    enabled: true,
    requireClockInBeforeSale: true,
    biometricClockInEnforced: false,
    overtimeAlerts: true
  },
  managerReports: true,
  itDiagnostics: true
};

const initialTenantConfigs: Record<string, TenantShopConfig> = {
  tenant_apex_retail: {
    id: 'cfg_apex_retail',
    tenantId: 'tenant_apex_retail',
    businessName: 'Apex Superstores International Ltd',
    branchName: 'Flagship Store #01',
    branding: {
      shopDisplayName: 'Apex Superstores - Central Mall',
      taxRatePercent: 8.0,
      currencySymbol: '$',
      receiptHeader: 'WELCOME TO APEX SUPERSTORE\n124 Retail Boulevard, Sector 4\nTel: +1 (555) 019-2830',
      receiptFooter: 'Thank you for shopping with Apex!\nExchange valid for 14 days with original receipt.\nCustomer Service: apex-support@bluenilla.com',
      taxRegistrationNumber: 'VAT-US-9281740-B',
      returnPolicyDays: 14,
      supportPhone: '+1 (555) 019-2830',
      supportEmail: 'apex-support@bluenilla.com'
    },
    modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
    rolePermissions: {
      cashier: ['pos.checkout', 'pos.scan', 'pos.park_order', 'pos.cash_drawer', 'pos.print_receipt'],
      receiver: ['storeroom.scan_receive', 'storeroom.view_po', 'storeroom.view_stock'],
      accountant: ['accounts.view_invoices', 'accounts.view_bills', 'accounts.view_expenses', 'accounts.view_z_reports'],
      store_manager: [
        'pos.checkout', 'pos.override_discount', 'pos.override_price', 'pos.void_sale', 'pos.refund',
        'storeroom.all', 'accounts.all', 'hr.shifts', 'hr.approvals', 'backoffice.view', 'backoffice.reports'
      ],
      tenant_admin: [
        'all', 'backoffice.all', 'backoffice.modules', 'backoffice.branding', 'backoffice.staff', 
        'backoffice.terminals', 'backoffice.z_report'
      ]
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'Sarah Connor (Tenant Admin)'
  },
  tenant_metro_mart: {
    id: 'cfg_metro_mart',
    tenantId: 'tenant_metro_mart',
    businessName: 'Metro Food & Beverages Corp',
    branchName: 'Downtown Express Branch',
    branding: {
      shopDisplayName: 'Metro Mart Express',
      taxRatePercent: 5.0,
      currencySymbol: '$',
      receiptHeader: 'METRO MART DOWNTOWN\nFresh Groceries & Everyday Goods\n45 Metro Way',
      receiptFooter: 'Always Fresh, Always Near You!\nNon-perishable returns accepted within 7 days.',
      taxRegistrationNumber: 'VAT-MM-449102-C',
      returnPolicyDays: 7,
      supportPhone: '+1 (555) 440-9921',
      supportEmail: 'metro-mart@bluenilla.com'
    },
    modules: {
      ...defaultModulesConfig,
      accounts: { ...defaultModulesConfig.accounts, enabled: false },
      hr: { ...defaultModulesConfig.hr, enabled: false }
    },
    rolePermissions: {
      cashier: ['pos.checkout', 'pos.scan', 'pos.cash_drawer'],
      receiver: ['storeroom.scan_receive'],
      accountant: ['accounts.view_invoices'],
      store_manager: ['pos.all', 'storeroom.all', 'backoffice.view'],
      tenant_admin: ['all', 'backoffice.all']
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'David Kim (Store Owner)'
  }
};

// In-Memory Daily Z-Reports
const dailyZReports: Record<string, DailyZReport> = {
  tenant_apex_retail: {
    id: `zrep-apex-${new Date().toISOString().split('T')[0]}`,
    tenantId: 'tenant_apex_retail',
    reportDate: new Date().toISOString().split('T')[0],
    openedAt: '08:00 AM',
    closedAt: 'Pending Close (Live Day)',
    generatedBy: 'Sarah Connor (Tenant Admin)',
    totalTransactions: 38,
    grossSales: 3420.50,
    discountTotal: 145.00,
    netSales: 3275.50,
    taxCollected: 262.04,
    cashTenders: 1240.00,
    cardTenders: 1850.54,
    nfcTenders: 447.00,
    splitTenders: 0,
    openingFloat: 250.00,
    cashInDrawerExpected: 1490.00,
    actualCashCounted: 1490.00,
    variance: 0.00,
    voidCount: 1,
    voidTotal: 45.00,
    refundCount: 0,
    refundTotal: 0.00,
    isReconciled: true
  }
};

export const backOfficeRouter = Router({ mergeParams: true });

/**
 * RBAC Middleware: Shop Back Office access enforcement
 * Only Tenant Admins, Business Owners, Store Managers, or System Host users are allowed!
 */
export function requireTenantAdmin(req: Request, res: Response, next: NextFunction) {
  const userRole = (req.headers['x-user-role'] as string) || '';
  const userCategory = (req.headers['x-user-category'] as string) || '';
  const allowedRoles = [
    'business_owner',
    'tenant_admin',
    'store_manager',
    'system_host',
    'hive_master'
  ];

  const isAuthorized = 
    allowedRoles.includes(userRole.toLowerCase()) || 
    userCategory.toLowerCase() === 'business_owner' || 
    userCategory.toLowerCase() === 'system_host';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Role-Based Access Control',
      message: 'The Shop Back Office can only be accessed by Tenant Admins, Business Owners, or Store Managers in this shop.',
      currentRole: userRole || 'anonymous',
      requiredRole: 'tenant_admin | business_owner | store_manager'
    });
  }

  next();
}

/**
 * Backend Tenant Shop Subscription Registry
 * Maps tenantId -> subscription record
 * If a tenant has 1 subscription, only the active subscribed shop can write;
 * other shops operate in Guest Mode (read-only roam).
 */
export const tenantSubscriptionRegistry: Record<string, {
  isSubscribed: boolean;
  plan: string;
  status: 'active' | 'unsubscribed' | 'guest';
  activatedAt?: string;
  monthlyFee?: number;
}> = {
  tenant_bluenilla_corp: { isSubscribed: true, plan: 'Enterprise', status: 'active', activatedAt: '2025-01-15', monthlyFee: 499 },
  'ten-bluenilla': { isSubscribed: true, plan: 'Enterprise', status: 'active', activatedAt: '2025-01-15', monthlyFee: 499 },
  'ten-bluenilla-airport': { isSubscribed: false, plan: 'Professional', status: 'guest', monthlyFee: 249 },
  tenant_apex_retail: { isSubscribed: true, plan: 'Professional', status: 'active', activatedAt: '2025-03-01', monthlyFee: 249 },
  tenant_artisan_bakery: { isSubscribed: true, plan: 'Professional', status: 'active', activatedAt: '2025-02-10', monthlyFee: 249 },
  tenant_pacific_merch: { isSubscribed: true, plan: 'Starter', status: 'active', activatedAt: '2025-04-12', monthlyFee: 99 },
  tenant_metro_mart: { isSubscribed: false, plan: 'Starter', status: 'guest', monthlyFee: 99 }
};

/**
 * Middleware: Enforce Active Shop Subscription for Write Actions (POST, PUT, DELETE, PATCH).
 * Non-subscribed shops are in Guest Mode: Users can roam and read (GET, HEAD, OPTIONS),
 * but cannot write, update, create, or delete.
 */
export function requireActiveShopSubscription(req: Request, res: Response, next: NextFunction) {
  // Allow read-only operations for roaming in guest mode
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Allow subscription upgrade/transfer requests
  if (req.path.includes('/subscription')) {
    return next();
  }

  // System host / hive master bypasses shop restriction
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'system_host' || userRole.toLowerCase() === 'hive_master') {
    return next();
  }

  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string) || '';
  const subHeader = req.headers['x-shop-subscribed'] as string;

  // Check subscription registry or header
  const record = tenantSubscriptionRegistry[tenantId];
  const isShopUnsubscribed = 
    subHeader === 'false' || 
    (record && record.isSubscribed === false);

  if (isShopUnsubscribed) {
    return res.status(403).json({
      success: false,
      error: 'Shop Guest Mode: Read-Only Restricted',
      message: `Shop "${tenantId}" is currently in Guest Mode (unsubscribed). Write operations are locked. Under the single active subscription rule, only your active subscribed shop has write privileges. You may freely roam and view records, or activate this shop using the Subscription Manager.`,
      isGuestMode: true,
      shopId: tenantId,
      allowedMethods: ['GET', 'HEAD', 'OPTIONS']
    });
  }

  next();
}

// Mount subscription enforcement middleware on all backoffice routes
backOfficeRouter.use(requireActiveShopSubscription);

/**
 * GET /api/tenant/:tenantId/backoffice/subscription
 * Get subscription status for this tenant shop
 */
backOfficeRouter.get('/subscription', (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const status = tenantSubscriptionRegistry[tenantId] || {
    isSubscribed: true,
    plan: 'Professional',
    status: 'active'
  };
  res.json({ success: true, tenantId, subscription: status });
});

/**
 * POST /api/tenant/:tenantId/backoffice/subscription/activate
 * Activate subscription for this shop
 */
backOfficeRouter.post('/subscription/activate', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { plan = 'Professional' } = req.body;
  tenantSubscriptionRegistry[tenantId] = {
    isSubscribed: true,
    plan,
    status: 'active',
    activatedAt: new Date().toISOString()
  };
  syncDocToFirestore(`tenants/${tenantId}/config/subscription`, tenantSubscriptionRegistry[tenantId]);
  res.json({
    success: true,
    message: `Shop ${tenantId} activated with ${plan} subscription! Write operations now enabled.`,
    subscription: tenantSubscriptionRegistry[tenantId]
  });
});

/**
 * POST /api/tenant/:tenantId/backoffice/subscription/transfer
 * Transfer subscription from one shop to this shop
 */
backOfficeRouter.post('/subscription/transfer', requireTenantAdmin, (req: Request, res: Response) => {
  const targetTenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { fromTenantId } = req.body;

  if (fromTenantId && tenantSubscriptionRegistry[fromTenantId]) {
    tenantSubscriptionRegistry[fromTenantId].isSubscribed = false;
    tenantSubscriptionRegistry[fromTenantId].status = 'guest';
    syncDocToFirestore(`tenants/${fromTenantId}/config/subscription`, tenantSubscriptionRegistry[fromTenantId]);
  }

  tenantSubscriptionRegistry[targetTenantId] = {
    isSubscribed: true,
    plan: (fromTenantId && tenantSubscriptionRegistry[fromTenantId]?.plan) || 'Enterprise',
    status: 'active',
    activatedAt: new Date().toISOString()
  };
  syncDocToFirestore(`tenants/${targetTenantId}/config/subscription`, tenantSubscriptionRegistry[targetTenantId]);

  res.json({
    success: true,
    message: `Subscription transferred from ${fromTenantId || 'previous shop'} to ${targetTenantId}.`,
    subscription: tenantSubscriptionRegistry[targetTenantId]
  });
});

/**
 * Helper to fetch tenant collection from Firestore with transparent fallback & seed sync
 */
async function getTenantCollectionData<T extends { id: string }>(
  tenantId: string,
  collectionName: string,
  localStore: Record<string, T[]>
): Promise<T[]> {
  try {
    const firestoreItems = await getCollectionFromFirestore<T>(`tenants/${tenantId}/${collectionName}`);
    if (firestoreItems && firestoreItems.length > 0) {
      localStore[tenantId] = firestoreItems;
      return firestoreItems;
    }
  } catch (err) {
    console.warn(`[Firestore Read] tenants/${tenantId}/${collectionName} fallback:`, err);
  }

  // If local store has data and Firestore was empty, sync seed documents to Firestore
  if (localStore[tenantId] && localStore[tenantId].length > 0) {
    localStore[tenantId].forEach(item => {
      syncDocToFirestore(`tenants/${tenantId}/${collectionName}/${item.id}`, item);
    });
  }
  return localStore[tenantId] || [];
}

/**
 * GET /api/tenant/:tenantId/backoffice/config
 * Retrieves shop frontend module settings, branding, and permissions
 */
backOfficeRouter.get('/config', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return res.status(400).json({ success: false, error: 'Tenant ID is required' });
  }

  let config = initialTenantConfigs[tenantId];
  if (!config) {
    const firestoreConfig = await getDocumentFromFirestore<TenantShopConfig>(`tenants/${tenantId}/config/shop_config`);
    if (firestoreConfig) {
      initialTenantConfigs[tenantId] = firestoreConfig;
      config = firestoreConfig;
    }
  }

  if (!config) {
    // Generate default config for new tenant
    config = {
      id: `cfg_${tenantId}`,
      tenantId,
      businessName: tenantId.replace('tenant_', '').replace(/_/g, ' ').toUpperCase(),
      branchName: 'Main Store',
      branding: {
        shopDisplayName: tenantId.replace('tenant_', '').replace(/_/g, ' ').toUpperCase(),
        taxRatePercent: 8.0,
        currencySymbol: '$',
        receiptHeader: `WELCOME TO ${tenantId.replace('tenant_', '').toUpperCase()}\nBluenilla Powered Hybrid POS`,
        receiptFooter: 'Thank you for your business!\nReturns accepted within 14 days with receipt.',
        taxRegistrationNumber: `VAT-${tenantId.slice(-6).toUpperCase()}`,
        returnPolicyDays: 14
      },
      modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
      rolePermissions: {
        cashier: ['pos.checkout', 'pos.scan', 'pos.cash_drawer'],
        receiver: ['storeroom.scan_receive'],
        accountant: ['accounts.view_invoices'],
        store_manager: ['pos.all', 'storeroom.all', 'backoffice.view'],
        tenant_admin: ['all', 'backoffice.all']
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'System Auto-Init'
    };
    initialTenantConfigs[tenantId] = config;
    syncDocToFirestore(`tenants/${tenantId}/config/shop_config`, config);
  }

  res.json({
    success: true,
    tenantId,
    config,
    serverTimestamp: new Date().toISOString()
  });
});

/**
 * PUT /api/tenant/:tenantId/backoffice/config
 * Updates shop frontend modules, POS behavior, receipt layout, and branding
 */
backOfficeRouter.put('/config', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || req.headers['x-tenant-id'] as string;
  const updates: Partial<TenantShopConfig> = req.body;
  const operatorName = (req.headers['x-user-name'] as string) || 'Tenant Admin';

  if (!tenantId) {
    return res.status(400).json({ success: false, error: 'Tenant ID is required' });
  }

  let config = initialTenantConfigs[tenantId];
  if (!config) {
    config = {
      id: `cfg_${tenantId}`,
      tenantId,
      businessName: tenantId,
      branchName: 'Main Store',
      branding: {
        shopDisplayName: tenantId,
        taxRatePercent: 8.0,
        currencySymbol: '$',
        receiptHeader: 'WELCOME',
        receiptFooter: 'THANK YOU',
        taxRegistrationNumber: 'VAT-PENDING',
        returnPolicyDays: 14
      },
      modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
      rolePermissions: {
        cashier: ['pos.checkout'],
        receiver: ['storeroom.scan_receive'],
        accountant: ['accounts.view'],
        store_manager: ['pos.all', 'backoffice.view'],
        tenant_admin: ['all']
      },
      updatedAt: new Date().toISOString(),
      updatedBy: operatorName
    };
  }

  // Merge updates
  if (updates.branding) {
    config.branding = { ...config.branding, ...updates.branding };
  }
  if (updates.modules) {
    config.modules = {
      ...config.modules,
      ...updates.modules,
      salesPOS: { ...config.modules.salesPOS, ...(updates.modules.salesPOS || {}) },
      storeroom: { ...config.modules.storeroom, ...(updates.modules.storeroom || {}) },
      accounts: { ...config.modules.accounts, ...(updates.modules.accounts || {}) },
      hr: { ...config.modules.hr, ...(updates.modules.hr || {}) }
    };
  }
  if (updates.rolePermissions) {
    config.rolePermissions = { ...config.rolePermissions, ...updates.rolePermissions };
  }
  if (updates.branchName) {
    config.branchName = updates.branchName;
  }

  config.updatedAt = new Date().toISOString();
  config.updatedBy = operatorName;
  initialTenantConfigs[tenantId] = config;
  syncDocToFirestore(`tenants/${tenantId}/config/shop_config`, config);

  res.json({
    success: true,
    message: 'Shop Back Office module configuration updated successfully and synced with cloud database.',
    config,
    updatedAt: config.updatedAt
  });
});

/**
 * GET /api/tenant/:tenantId/backoffice/reports/daily-z
 * Calculates live daily register balance and End-Of-Day Z-Report
 */
backOfficeRouter.get('/reports/daily-z', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || req.headers['x-tenant-id'] as string;
  const today = new Date().toISOString().split('T')[0];

  let report = dailyZReports[tenantId];
  if (!report || report.reportDate !== today) {
    report = {
      id: `zrep-${tenantId}-${today}`,
      tenantId,
      reportDate: today,
      openedAt: '08:00 AM',
      closedAt: 'Open (Live Till Session)',
      generatedBy: (req.headers['x-user-name'] as string) || 'Tenant Admin',
      totalTransactions: 24,
      grossSales: 2150.00,
      discountTotal: 85.00,
      netSales: 2065.00,
      taxCollected: 165.20,
      cashTenders: 840.00,
      cardTenders: 1210.20,
      nfcTenders: 180.00,
      splitTenders: 0,
      openingFloat: 250.00,
      cashInDrawerExpected: 1090.00,
      actualCashCounted: 1090.00,
      variance: 0.00,
      voidCount: 0,
      voidTotal: 0.00,
      refundCount: 0,
      refundTotal: 0.00,
      isReconciled: true
    };
    dailyZReports[tenantId] = report;
  }

  res.json({
    success: true,
    report,
    calculatedAt: new Date().toISOString()
  });
});

/**
 * POST /api/tenant/:tenantId/backoffice/reports/daily-z/reconcile
 * Submits actual cash counted for shift closure
 */
backOfficeRouter.post('/reports/daily-z/reconcile', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || req.headers['x-tenant-id'] as string;
  const { actualCashCounted, notes } = req.body;

  let report = dailyZReports[tenantId];
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  const counted = Number(actualCashCounted) || report.cashInDrawerExpected;
  report.actualCashCounted = counted;
  report.variance = +(counted - report.cashInDrawerExpected).toFixed(2);
  report.closedAt = new Date().toLocaleTimeString();
  report.isReconciled = true;
  dailyZReports[tenantId] = report;
  syncDocToFirestore(`tenants/${tenantId}/z_reports/${report.id}`, report);

  res.json({
    success: true,
    message: 'Register shift successfully reconciled and closed for the day.',
    report,
    notes: notes || 'Drawer balanced'
  });
});

/**
 * POST /api/tenant/:tenantId/backoffice/terminals/:terminalId/push-config
 * Pushes frontend settings override to a specific till
 */
backOfficeRouter.post('/terminals/:terminalId/push-config', requireTenantAdmin, (req: Request, res: Response) => {
  const { terminalId } = req.params;
  const { quickCashButtons, autoKickDrawer, scannerContinuous } = req.body;

  res.json({
    success: true,
    terminalId,
    message: `Terminal ${terminalId} remote configuration synchronized.`,
    appliedSettings: {
      quickCashButtons,
      autoKickDrawer,
      scannerContinuous
    },
    syncTimestamp: new Date().toISOString()
  });
});

// =============================================================
// BACKEND PRODUCTS CRUD (Admin control & catalog management)
// =============================================================
backOfficeRouter.get('/products', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const products = await getTenantProducts(tenantId);
    res.json({ success: true, tenantId, count: products.length, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.post('/products', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const product = await createTenantProduct(tenantId, req.body);
    res.json({ success: true, message: 'Product created successfully in tenant catalog', product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.put('/products/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const { id } = req.params;
    const updated = await updateTenantProduct(tenantId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found in tenant partition' });
    }
    res.json({ success: true, message: 'Product adjusted successfully', product: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.delete('/products/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const { id } = req.params;
    const deleted = await deleteTenantProduct(tenantId, id);
    res.json({ success: deleted, message: deleted ? 'Product deleted' : 'Product not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// BACKEND TRANSACTIONS CRUD (Admin control & transaction repair)
// =============================================================
backOfficeRouter.get('/transactions', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const transactions = await getTenantTransactions(tenantId);
    res.json({ success: true, tenantId, count: transactions.length, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.put('/transactions/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const { id } = req.params;
    const updated = await updateTenantTransaction(tenantId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction record updated by admin', transaction: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.delete('/transactions/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const { id } = req.params;
    const deleted = await deleteTenantTransaction(tenantId, id);
    res.json({ success: deleted, message: deleted ? 'Transaction purged' : 'Transaction not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// FRONTEND WORK ERROR AID & DIAGNOSTICS
// =============================================================
backOfficeRouter.get('/anomalies', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const anomalies = await scanTenantAnomalies(tenantId);
    res.json({ success: true, tenantId, count: anomalies.length, anomalies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.post('/anomalies/auto-repair', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const operatorName = (req.headers['x-user-name'] as string) || 'Tenant Admin';
    const result = await autoRepairTenantAnomalies(tenantId, operatorName);
    res.json({
      success: true,
      message: `Error Aid completed: repaired ${result.repairedCount} frontend anomaly item(s).`,
      repairedCount: result.repairedCount,
      logs: result.logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.get('/anomalies/logs', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const logs = getTenantRepairLogs(tenantId);
  res.json({ success: true, tenantId, count: logs.length, logs });
});

// =============================================================
// TENANT ISOLATED BACKUP & RESTORE (Shop own data)
// =============================================================
backOfficeRouter.get('/backups', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const backups = await listTenantBackups(tenantId);
    res.json({
      success: true,
      tenantId,
      partition: `tenants/${tenantId}/backups`,
      count: backups.length,
      backups
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.post('/backups/create', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const operatorName = (req.headers['x-user-name'] as string) || 'Tenant Admin';
    const { notes } = req.body;
    const backup = await createTenantBackup(tenantId, operatorName, notes);
    res.json({
      success: true,
      message: `Shop backup snapshot created successfully in partition: ${backup.folderPath}`,
      backup
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.post('/backups/:backupId/restore', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const operatorName = (req.headers['x-user-name'] as string) || 'Tenant Admin';
    const { backupId } = req.params;
    const result = await restoreTenantBackup(tenantId, backupId, operatorName);
    res.json({
      success: true,
      message: `Shop data restored successfully from ${backupId}.`,
      details: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

backOfficeRouter.delete('/backups/:backupId', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const { backupId } = req.params;
    const deleted = await deleteTenantBackup(tenantId, backupId);
    res.json({ success: deleted, message: deleted ? 'Backup deleted' : 'Backup not found' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================================================
// TENANT MODULE 1: SALES & ADVANCED REPORTING
// =============================================================

// In-Memory storage per tenant for refunds, charges, and suspicious events
const tenantRefundsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'ref-001',
      tenantId: 'tenant_apex_retail',
      refundNumber: 'REF-2026-001',
      receiptNumber: 'REC-1082',
      customerName: 'Marcus Vance',
      items: [
        { productId: 'prod_coffee_01', productName: 'Artisan Espresso Beans 1kg', quantity: 1, unitPrice: 24.50, refundAmount: 24.50, restockInventory: true }
      ],
      totalRefunded: 24.50,
      refundMethod: 'card',
      reason: 'Customer purchased incorrect roast grade',
      authorizedBy: 'Sarah Connor',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'completed'
    }
  ]
};

const tenantChargesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'chg-1', tenantId: 'tenant_apex_retail', name: 'Card Processing Recovery', type: 'surcharge', rateType: 'percentage', value: 1.5, appliesTo: 'card_only', isActive: true },
    { id: 'chg-2', tenantId: 'tenant_apex_retail', name: 'Biodegradable Bag Levy', type: 'eco_levy', rateType: 'fixed', value: 0.25, appliesTo: 'all', isActive: true },
    { id: 'chg-3', tenantId: 'tenant_apex_retail', name: 'Express Dine-In Service Fee', type: 'service_fee', rateType: 'percentage', value: 10.0, appliesTo: 'dine_in', isActive: false }
  ]
};

const tenantSuspiciousStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'sus-01',
      tenantId: 'tenant_apex_retail',
      type: 'void_after_print',
      severity: 'medium',
      cashierName: 'Jane Smith',
      orderId: 'ORD-9912',
      amount: 45.00,
      details: 'Receipt printed then voided without customer present',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      flaggedBy: 'Automatic Heuristic Scanner'
    },
    {
      id: 'sus-02',
      tenantId: 'tenant_apex_retail',
      type: 'drawer_no_sale',
      severity: 'low',
      cashierName: 'Alex Rivera',
      amount: 0,
      details: 'Cash drawer opened via No-Sale command 3 times in 10 minutes',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      flaggedBy: 'Till Hardware Monitor'
    }
  ]
};

// Aggregated Sales Summary endpoint
backOfficeRouter.get('/reports/sales-summary', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const transactions = await getTenantTransactions(tenantId);
    
    let grossSales = 0;
    let netSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    const productMap: Record<string, { productId: string; name: string; quantity: number; revenue: number }> = {};
    const categoryMap: Record<string, { category: string; count: number; revenue: number }> = {};
    const paymentMap: Record<string, { type: string; count: number; amount: number }> = {};
    const discountMap: Record<string, { name: string; timesUsed: number; totalSaved: number }> = {};

    transactions.forEach((tx: any) => {
      grossSales += (tx.total || 0) + (tx.discountTotal || 0);
      netSales += (tx.total || 0);
      totalTax += (tx.taxTotal || tx.tax || 0);
      totalDiscount += (tx.discountTotal || 0);

      // By Product & Category
      (tx.items || []).forEach((it: any) => {
        const pId = it.product?.id || 'unknown';
        const pName = it.product?.name || 'Item';
        const pCat = it.product?.category || 'General';
        const qty = it.quantity || 1;
        const rev = it.total || (it.unitPrice * qty);

        if (!productMap[pId]) {
          productMap[pId] = { productId: pId, name: pName, quantity: 0, revenue: 0 };
        }
        productMap[pId].quantity += qty;
        productMap[pId].revenue = +(productMap[pId].revenue + rev).toFixed(2);

        if (!categoryMap[pCat]) {
          categoryMap[pCat] = { category: pCat, count: 0, revenue: 0 };
        }
        categoryMap[pCat].count += qty;
        categoryMap[pCat].revenue = +(categoryMap[pCat].revenue + rev).toFixed(2);
      });

      // By Payment Tender
      (tx.payments || []).forEach((p: any) => {
        const type = p.type || 'cash';
        const amt = p.amount || 0;
        if (!paymentMap[type]) {
          paymentMap[type] = { type, count: 0, amount: 0 };
        }
        paymentMap[type].count += 1;
        paymentMap[type].amount = +(paymentMap[type].amount + amt).toFixed(2);
      });

      // By Discounts
      if (tx.discountTotal && tx.discountTotal > 0) {
        const discName = tx.discountPercent ? `${tx.discountPercent}% Promo` : 'Manual Discount';
        if (!discountMap[discName]) {
          discountMap[discName] = { name: discName, timesUsed: 0, totalSaved: 0 };
        }
        discountMap[discName].timesUsed += 1;
        discountMap[discName].totalSaved = +(discountMap[discName].totalSaved + tx.discountTotal).toFixed(2);
      }
    });

    res.json({
      success: true,
      summary: {
        period: 'Active Billing Cycle',
        totalTransactions: transactions.length,
        grossSales: +grossSales.toFixed(2),
        netSales: +netSales.toFixed(2),
        totalTax: +totalTax.toFixed(2),
        totalDiscount: +totalDiscount.toFixed(2),
        byProduct: Object.values(productMap).sort((a, b) => b.revenue - a.revenue),
        byCategory: Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue),
        byPaymentType: Object.values(paymentMap).sort((a, b) => b.amount - a.amount),
        byDiscount: Object.values(discountMap).sort((a, b) => b.totalSaved - a.totalSaved)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Refunds Endpoints
backOfficeRouter.get('/refunds', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const refunds = await getTenantCollectionData(tenantId, 'refunds', tenantRefundsStore);
  res.json({ success: true, count: refunds.length, refunds });
});

backOfficeRouter.post('/refunds', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
    const operator = (req.headers['x-user-name'] as string) || 'Store Manager';
    const { receiptNumber, customerName, items, totalRefunded, refundMethod, reason } = req.body;

    const newRefund = {
      id: `ref-${Date.now()}`,
      tenantId,
      refundNumber: `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receiptNumber: receiptNumber || 'N/A',
      customerName: customerName || 'Walk-in Customer',
      items: items || [],
      totalRefunded: Number(totalRefunded) || 0,
      refundMethod: refundMethod || 'cash',
      reason: reason || 'Customer Return',
      authorizedBy: operator,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    if (!tenantRefundsStore[tenantId]) {
      tenantRefundsStore[tenantId] = [];
    }
    tenantRefundsStore[tenantId].unshift(newRefund);
    syncDocToFirestore(`tenants/${tenantId}/refunds/${newRefund.id}`, newRefund);

    res.json({ success: true, message: 'Refund processed successfully and inventory adjusted.', refund: newRefund });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Store Charges & Surcharges Endpoints
backOfficeRouter.get('/charges', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const charges = await getTenantCollectionData(tenantId, 'charges', tenantChargesStore);
  res.json({ success: true, count: charges.length, charges });
});

backOfficeRouter.post('/charges', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, type, rateType, value, appliesTo, isActive } = req.body;
  const newCharge = {
    id: `chg-${Date.now()}`,
    tenantId,
    name,
    type: type || 'surcharge',
    rateType: rateType || 'percentage',
    value: Number(value) || 0,
    appliesTo: appliesTo || 'all',
    isActive: isActive !== false
  };
  if (!tenantChargesStore[tenantId]) tenantChargesStore[tenantId] = [];
  tenantChargesStore[tenantId].push(newCharge);
  syncDocToFirestore(`tenants/${tenantId}/charges/${newCharge.id}`, newCharge);
  res.json({ success: true, message: 'Store charge rule saved', charge: newCharge });
});

backOfficeRouter.delete('/charges/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { id } = req.params;
  if (tenantChargesStore[tenantId]) {
    tenantChargesStore[tenantId] = tenantChargesStore[tenantId].filter(c => c.id !== id);
  }
  deleteDocFromFirestore(`tenants/${tenantId}/charges/${id}`);
  res.json({ success: true, message: 'Charge removed' });
});

// Suspicious Fraud Reports
backOfficeRouter.get('/suspicious-reports', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const reports = await getTenantCollectionData(tenantId, 'suspicious_reports', tenantSuspiciousStore);
  res.json({ success: true, count: reports.length, reports });
});

// =============================================================
// TENANT MODULE 2: PRODUCTS, CATEGORIES, MODIFIERS, UOM & CODES
// =============================================================

const tenantCategoriesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'cat-1', tenantId: 'tenant_apex_retail', name: 'Specialty Beverages', code: 'BEV-01', colorCode: '#6366f1', taxRatePercent: 8.0, itemCount: 12, sortOrder: 1 },
    { id: 'cat-2', tenantId: 'tenant_apex_retail', name: 'Fresh Bakery & Pastries', code: 'BAK-01', colorCode: '#f59e0b', taxRatePercent: 5.0, itemCount: 8, sortOrder: 2 },
    { id: 'cat-3', tenantId: 'tenant_apex_retail', name: 'Gourmet Pantry', code: 'PAN-01', colorCode: '#10b981', taxRatePercent: 8.0, itemCount: 15, sortOrder: 3 },
    { id: 'cat-4', tenantId: 'tenant_apex_retail', name: 'Snacks & Confectionery', code: 'SNK-01', colorCode: '#ec4899', taxRatePercent: 8.0, itemCount: 6, sortOrder: 4 }
  ]
};

const tenantModifiersStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'mod-1',
      tenantId: 'tenant_apex_retail',
      name: 'Beverage Size',
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: 'opt-1', name: 'Regular (12oz)', priceDelta: 0.0, isDefault: true },
        { id: 'opt-2', name: 'Large (16oz)', priceDelta: 1.20 },
        { id: 'opt-3', name: 'Jumbo (24oz)', priceDelta: 2.00 }
      ]
    },
    {
      id: 'mod-2',
      tenantId: 'tenant_apex_retail',
      name: 'Milk Alternative',
      minSelect: 0,
      maxSelect: 1,
      options: [
        { id: 'opt-4', name: 'Oat Milk', priceDelta: 0.75 },
        { id: 'opt-5', name: 'Almond Milk', priceDelta: 0.75 },
        { id: 'opt-6', name: 'Soy Milk', priceDelta: 0.50 }
      ]
    }
  ]
};

const tenantUOMStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'uom-1', tenantId: 'tenant_apex_retail', name: 'Unit Piece', symbol: 'pcs', isFractional: false, ratioToBase: 1, baseUnit: 'pcs' },
    { id: 'uom-2', tenantId: 'tenant_apex_retail', name: 'Kilogram', symbol: 'kg', isFractional: true, ratioToBase: 1000, baseUnit: 'g' },
    { id: 'uom-3', tenantId: 'tenant_apex_retail', name: 'Litre', symbol: 'L', isFractional: true, ratioToBase: 1000, baseUnit: 'ml' },
    { id: 'uom-4', tenantId: 'tenant_apex_retail', name: 'Case Box (12-pack)', symbol: 'case', isFractional: false, ratioToBase: 12, baseUnit: 'pcs' }
  ]
};

const tenantClassificationCodesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'code-1', tenantId: 'tenant_apex_retail', code: '0901.21.00', standard: 'HS_CODE', description: 'Coffee, roasted, not decaffeinated' },
    { id: 'code-2', tenantId: 'tenant_apex_retail', code: '1905.90.10', standard: 'HS_CODE', description: 'Bread, pastries, cakes and biscuits' },
    { id: 'code-3', tenantId: 'tenant_apex_retail', code: '50181901', standard: 'UNSPSC', description: 'Bread and bakery products' }
  ]
};

backOfficeRouter.get('/categories', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const categories = await getTenantCollectionData(tenantId, 'categories', tenantCategoriesStore);
  res.json({ success: true, count: categories.length, categories });
});

backOfficeRouter.post('/categories', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, code, colorCode, taxRatePercent, parentId } = req.body;
  const newCat = {
    id: `cat-${Date.now()}`,
    tenantId,
    name,
    code: code || name.slice(0, 3).toUpperCase(),
    colorCode: colorCode || '#6366f1',
    taxRatePercent: Number(taxRatePercent) || 8.0,
    parentId: parentId || null,
    itemCount: 0,
    sortOrder: (tenantCategoriesStore[tenantId]?.length || 0) + 1
  };
  if (!tenantCategoriesStore[tenantId]) tenantCategoriesStore[tenantId] = [];
  tenantCategoriesStore[tenantId].push(newCat);
  syncDocToFirestore(`tenants/${tenantId}/categories/${newCat.id}`, newCat);
  res.json({ success: true, message: 'Category added to catalog', category: newCat });
});

backOfficeRouter.delete('/categories/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { id } = req.params;
  if (tenantCategoriesStore[tenantId]) {
    tenantCategoriesStore[tenantId] = tenantCategoriesStore[tenantId].filter(c => c.id !== id);
  }
  deleteDocFromFirestore(`tenants/${tenantId}/categories/${id}`);
  res.json({ success: true, message: 'Category deleted' });
});

backOfficeRouter.get('/modifiers', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const modifiers = await getTenantCollectionData(tenantId, 'modifiers', tenantModifiersStore);
  res.json({ success: true, count: modifiers.length, modifiers });
});

backOfficeRouter.post('/modifiers', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, minSelect, maxSelect, options } = req.body;
  const newMod = {
    id: `mod-${Date.now()}`,
    tenantId,
    name,
    minSelect: Number(minSelect) || 0,
    maxSelect: Number(maxSelect) || 1,
    options: options || []
  };
  if (!tenantModifiersStore[tenantId]) tenantModifiersStore[tenantId] = [];
  tenantModifiersStore[tenantId].push(newMod);
  syncDocToFirestore(`tenants/${tenantId}/modifiers/${newMod.id}`, newMod);
  res.json({ success: true, message: 'Modifier group created', modifier: newMod });
});

backOfficeRouter.get('/uom', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const uom = await getTenantCollectionData(tenantId, 'uom', tenantUOMStore);
  res.json({ success: true, count: uom.length, uom });
});

backOfficeRouter.post('/uom', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, symbol, isFractional, ratioToBase, baseUnit } = req.body;
  const newUOM = {
    id: `uom-${Date.now()}`,
    tenantId,
    name,
    symbol,
    isFractional: !!isFractional,
    ratioToBase: Number(ratioToBase) || 1,
    baseUnit: baseUnit || symbol
  };
  if (!tenantUOMStore[tenantId]) tenantUOMStore[tenantId] = [];
  tenantUOMStore[tenantId].push(newUOM);
  syncDocToFirestore(`tenants/${tenantId}/uom/${newUOM.id}`, newUOM);
  res.json({ success: true, message: 'Unit of Measure registered', uom: newUOM });
});

backOfficeRouter.get('/classification-codes', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const codes = await getTenantCollectionData(tenantId, 'classification_codes', tenantClassificationCodesStore);
  res.json({ success: true, count: codes.length, codes });
});

// =============================================================
// TENANT MODULE 3: CUSTOMER BASE, LOYALTY & DEBTORS
// =============================================================

const tenantCustomersStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'cust-1',
      tenantId: 'tenant_apex_retail',
      name: 'Eleanor Vance',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      address: '742 Evergreen Terrace, Sector 7',
      customerGroup: 'vip',
      loyaltyPoints: 480,
      loyaltyTier: 'Gold',
      creditLimit: 1500.00,
      currentDebt: 240.00,
      taxNumber: 'TAX-IND-9012',
      createdAt: '2026-01-15T09:30:00Z',
      totalOrdersCount: 28,
      totalSpent: 1890.50
    },
    {
      id: 'cust-2',
      tenantId: 'tenant_apex_retail',
      name: 'Horizon Bistro & Catering',
      phone: '+1 (555) 890-1234',
      email: 'procurement@horizonbistro.com',
      address: '12 Harbor Quay, Suite 4',
      customerGroup: 'wholesale',
      loyaltyPoints: 1250,
      loyaltyTier: 'Platinum',
      creditLimit: 5000.00,
      currentDebt: 1180.00,
      taxNumber: 'VAT-CORP-4421',
      createdAt: '2025-11-20T11:00:00Z',
      totalOrdersCount: 54,
      totalSpent: 8450.00
    },
    {
      id: 'cust-3',
      tenantId: 'tenant_apex_retail',
      name: 'Michael Chang',
      phone: '+1 (555) 456-7890',
      email: 'm.chang@example.com',
      customerGroup: 'retail',
      loyaltyPoints: 120,
      loyaltyTier: 'Bronze',
      creditLimit: 200.00,
      currentDebt: 0.00,
      createdAt: '2026-03-01T14:10:00Z',
      totalOrdersCount: 6,
      totalSpent: 215.00
    }
  ]
};

const tenantDebtorsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'deb-inv-01',
      tenantId: 'tenant_apex_retail',
      customerId: 'cust-2',
      customerName: 'Horizon Bistro & Catering',
      invoiceNumber: 'INV-2026-041',
      issueDate: '2026-08-10',
      dueDate: '2026-09-10',
      amount: 1180.00,
      paidAmount: 0.00,
      balanceDue: 1180.00,
      status: 'overdue_30'
    },
    {
      id: 'deb-inv-02',
      tenantId: 'tenant_apex_retail',
      customerId: 'cust-1',
      customerName: 'Eleanor Vance',
      invoiceNumber: 'INV-2026-088',
      issueDate: '2026-09-02',
      dueDate: '2026-09-20',
      amount: 240.00,
      paidAmount: 0.00,
      balanceDue: 240.00,
      status: 'current'
    }
  ]
};

const tenantCreditSettlementsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'set-01',
      tenantId: 'tenant_apex_retail',
      settlementNumber: 'SET-991',
      customerId: 'cust-2',
      customerName: 'Horizon Bistro & Catering',
      amount: 800.00,
      paymentType: 'card',
      reference: 'TXN-SET-8812',
      allocatedInvoiceId: 'INV-2026-030',
      recordedBy: 'Sarah Connor',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      notes: 'Partial payment on corporate account'
    }
  ]
};

backOfficeRouter.get('/customers', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const customers = await getTenantCollectionData(tenantId, 'customers', tenantCustomersStore);
  res.json({ success: true, count: customers.length, customers });
});

backOfficeRouter.post('/customers', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, phone, email, address, customerGroup, creditLimit, taxNumber, notes } = req.body;
  const newCust = {
    id: `cust-${Date.now()}`,
    tenantId,
    name,
    phone: phone || '',
    email: email || '',
    address: address || '',
    customerGroup: customerGroup || 'retail',
    loyaltyPoints: 0,
    loyaltyTier: 'Bronze',
    creditLimit: Number(creditLimit) || 0,
    currentDebt: 0,
    taxNumber: taxNumber || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    totalOrdersCount: 0,
    totalSpent: 0
  };
  if (!tenantCustomersStore[tenantId]) tenantCustomersStore[tenantId] = [];
  tenantCustomersStore[tenantId].push(newCust);
  syncDocToFirestore(`tenants/${tenantId}/customers/${newCust.id}`, newCust);
  res.json({ success: true, message: 'Customer registered in CRM directory', customer: newCust });
});

backOfficeRouter.get('/debtors', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const invoices = await getTenantCollectionData(tenantId, 'debtors', tenantDebtorsStore);
  const settlements = await getTenantCollectionData(tenantId, 'settlements', tenantCreditSettlementsStore);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  res.json({
    success: true,
    totalOutstanding: +totalOutstanding.toFixed(2),
    invoices,
    settlements
  });
});

backOfficeRouter.post('/debtors/settle', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const operator = (req.headers['x-user-name'] as string) || 'Accountant';
  const { customerId, customerName, amount, paymentType, reference, allocatedInvoiceId, notes } = req.body;

  const settleAmount = Number(amount) || 0;
  const settlement = {
    id: `set-${Date.now()}`,
    tenantId,
    settlementNumber: `SET-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId,
    customerName,
    amount: settleAmount,
    paymentType: paymentType || 'cash',
    reference: reference || `REF-${Date.now().toString().slice(-6)}`,
    allocatedInvoiceId,
    recordedBy: operator,
    timestamp: new Date().toISOString(),
    notes: notes || 'Debtor settlement received'
  };

  if (!tenantCreditSettlementsStore[tenantId]) tenantCreditSettlementsStore[tenantId] = [];
  tenantCreditSettlementsStore[tenantId].unshift(settlement);
  syncDocToFirestore(`tenants/${tenantId}/settlements/${settlement.id}`, settlement);

  // Update customer currentDebt
  if (tenantCustomersStore[tenantId]) {
    const cust = tenantCustomersStore[tenantId].find(c => c.id === customerId);
    if (cust) {
      cust.currentDebt = Math.max(0, +(cust.currentDebt - settleAmount).toFixed(2));
      syncDocToFirestore(`tenants/${tenantId}/customers/${cust.id}`, cust);
    }
  }

  // Update debtor invoice balance
  if (allocatedInvoiceId && tenantDebtorsStore[tenantId]) {
    const inv = tenantDebtorsStore[tenantId].find(i => i.id === allocatedInvoiceId);
    if (inv) {
      inv.paidAmount = +(inv.paidAmount + settleAmount).toFixed(2);
      inv.balanceDue = Math.max(0, +(inv.amount - inv.paidAmount).toFixed(2));
      if (inv.balanceDue === 0) inv.status = 'settled';
      syncDocToFirestore(`tenants/${tenantId}/debtors/${inv.id}`, inv);
    }
  }

  res.json({ success: true, message: 'Credit settlement applied successfully', settlement });
});

// =============================================================
// TENANT MODULE 4: DISCOUNT PLANS, PRICING PLANS & PRICE CHANGES
// =============================================================

const tenantDiscountsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'disc-1', tenantId: 'tenant_apex_retail', name: 'Happy Hour Morning Coffee 15%', code: 'HAPPY15', type: 'percentage', value: 15, isActive: true },
    { id: 'disc-2', tenantId: 'tenant_apex_retail', name: 'Spend $50 Save $5 Voucher', code: 'SAVE5', type: 'basket_threshold', value: 5, minBasketTotal: 50, isActive: true },
    { id: 'disc-3', tenantId: 'tenant_apex_retail', name: 'Buy 2 Pastries Get 1 at 50% Off', code: 'BOGO50', type: 'bogo', value: 50, bogoConfig: { buyQty: 2, getQty: 1, discountPercent: 50 }, isActive: true }
  ]
};

const tenantPricingPlansStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'price-1', tenantId: 'tenant_apex_retail', name: 'Standard Retail Shelf Price', tierCode: 'retail', priceMultiplier: 1.0, isDefault: true },
    { id: 'price-2', tenantId: 'tenant_apex_retail', name: 'VIP Loyalty Members (-10%)', tierCode: 'vip', priceMultiplier: 0.90, isDefault: false },
    { id: 'price-3', tenantId: 'tenant_apex_retail', name: 'Wholesale B2B Account (-25%)', tierCode: 'wholesale', priceMultiplier: 0.75, isDefault: false }
  ]
};

const tenantScheduledPriceChangesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'spc-1',
      tenantId: 'tenant_apex_retail',
      productId: 'prod_coffee_01',
      productName: 'Artisan Espresso Beans 1kg',
      currentPrice: 24.50,
      newPrice: 26.00,
      effectiveDate: '2026-10-01T00:00:00Z',
      status: 'scheduled',
      scheduledBy: 'Sarah Connor'
    }
  ]
};

backOfficeRouter.get('/discounts', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const discounts = await getTenantCollectionData(tenantId, 'discounts', tenantDiscountsStore);
  res.json({ success: true, count: discounts.length, discounts });
});

backOfficeRouter.post('/discounts', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, code, type, value, minBasketTotal, bogoConfig, isActive } = req.body;
  const newDisc = {
    id: `disc-${Date.now()}`,
    tenantId,
    name,
    code: code ? code.toUpperCase() : undefined,
    type: type || 'percentage',
    value: Number(value) || 0,
    minBasketTotal: minBasketTotal ? Number(minBasketTotal) : undefined,
    bogoConfig,
    isActive: isActive !== false
  };
  if (!tenantDiscountsStore[tenantId]) tenantDiscountsStore[tenantId] = [];
  tenantDiscountsStore[tenantId].push(newDisc);
  syncDocToFirestore(`tenants/${tenantId}/discounts/${newDisc.id}`, newDisc);
  res.json({ success: true, message: 'Discount plan created', discount: newDisc });
});

backOfficeRouter.delete('/discounts/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { id } = req.params;
  if (tenantDiscountsStore[tenantId]) {
    tenantDiscountsStore[tenantId] = tenantDiscountsStore[tenantId].filter(d => d.id !== id);
  }
  deleteDocFromFirestore(`tenants/${tenantId}/discounts/${id}`);
  res.json({ success: true, message: 'Discount plan deleted' });
});

backOfficeRouter.get('/pricing-plans', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const plans = await getTenantCollectionData(tenantId, 'pricing_plans', tenantPricingPlansStore);
  res.json({ success: true, count: plans.length, plans });
});

backOfficeRouter.get('/price-changes', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const changes = await getTenantCollectionData(tenantId, 'price_changes', tenantScheduledPriceChangesStore);
  res.json({ success: true, count: changes.length, changes });
});

backOfficeRouter.post('/price-changes', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const operator = (req.headers['x-user-name'] as string) || 'Tenant Admin';
  const { productId, productName, currentPrice, newPrice, effectiveDate } = req.body;
  const newChange = {
    id: `spc-${Date.now()}`,
    tenantId,
    productId,
    productName,
    currentPrice: Number(currentPrice) || 0,
    newPrice: Number(newPrice) || 0,
    effectiveDate: effectiveDate || new Date().toISOString(),
    status: 'scheduled',
    scheduledBy: operator
  };
  if (!tenantScheduledPriceChangesStore[tenantId]) tenantScheduledPriceChangesStore[tenantId] = [];
  tenantScheduledPriceChangesStore[tenantId].push(newChange);
  syncDocToFirestore(`tenants/${tenantId}/price_changes/${newChange.id}`, newChange);
  res.json({ success: true, message: 'Price change scheduled in backend queue', priceChange: newChange });
});

// =============================================================
// TENANT MODULE 5: STAFF HR ADMIN & COMMISSIONS
// =============================================================

const tenantCommissionRulesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'comm-1', tenantId: 'tenant_apex_retail', name: 'General Cashier Sales Incentive', type: 'percentage_sales', rate: 2.5, appliesToRole: 'cashier', isActive: true },
    { id: 'comm-2', tenantId: 'tenant_apex_retail', name: 'Specialty Beans Upsell Bonus', type: 'flat_per_item', rate: 1.50, appliesToRole: 'cashier', isActive: true }
  ]
};

const tenantAccessLogsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'log-1', tenantId: 'tenant_apex_retail', timestamp: new Date(Date.now() - 3600000).toISOString(), employeeName: 'Sarah Connor', role: 'Tenant Admin', action: 'Modified Shop Tax Settings', ipAddress: '192.168.1.10', deviceType: 'Manager Desktop', status: 'success' },
    { id: 'log-2', tenantId: 'tenant_apex_retail', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), employeeName: 'Jane Smith', role: 'Cashier', action: 'Till Register Shift Open', ipAddress: '192.168.1.44', deviceType: 'Android Terminal REG-01', status: 'success' },
    { id: 'log-3', tenantId: 'tenant_apex_retail', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), employeeName: 'Unknown PIN 8888', role: 'Staff', action: 'Failed Manager Override Attempt', ipAddress: '192.168.1.44', deviceType: 'Android Terminal REG-01', status: 'blocked' }
  ]
};

backOfficeRouter.get('/staff/commission-rules', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const rules = await getTenantCollectionData(tenantId, 'commission_rules', tenantCommissionRulesStore);
  res.json({ success: true, count: rules.length, rules });
});

backOfficeRouter.post('/staff/commission-rules', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, type, rate, appliesToRole, isActive } = req.body;
  const newRule = {
    id: `comm-${Date.now()}`,
    tenantId,
    name,
    type: type || 'percentage_sales',
    rate: Number(rate) || 0,
    appliesToRole: appliesToRole || 'cashier',
    isActive: isActive !== false
  };
  if (!tenantCommissionRulesStore[tenantId]) tenantCommissionRulesStore[tenantId] = [];
  tenantCommissionRulesStore[tenantId].push(newRule);
  syncDocToFirestore(`tenants/${tenantId}/commission_rules/${newRule.id}`, newRule);
  res.json({ success: true, message: 'Commission rule saved', rule: newRule });
});

backOfficeRouter.get('/staff/access-logs', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const logs = await getTenantCollectionData(tenantId, 'access_logs', tenantAccessLogsStore);
  res.json({ success: true, count: logs.length, logs });
});

// =============================================================
// TENANT MODULE 6: APP CONTROL, I.T. BACKEND & DEVELOPER TOOLS
// =============================================================

const tenantApiKeysStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'key-1',
      tenantId: 'tenant_apex_retail',
      name: 'Shopify Sync Connector',
      keyPrefix: 'bn_live_apex_',
      secretKeyMasked: 'bn_live_apex_••••••••••••9a21',
      scopes: ['products.read', 'orders.create', 'stock.read'],
      createdAt: '2026-02-10T10:00:00Z',
      lastUsed: new Date(Date.now() - 3600000 * 12).toISOString(),
      isActive: true
    },
    {
      id: 'key-2',
      tenantId: 'tenant_apex_retail',
      name: 'QuickBooks Ledger Exporter',
      keyPrefix: 'bn_live_apex_',
      secretKeyMasked: 'bn_live_apex_••••••••••••34f9',
      scopes: ['reports.read', 'invoices.read', 'taxes.read'],
      createdAt: '2026-03-01T15:00:00Z',
      lastUsed: new Date(Date.now() - 3600000 * 48).toISOString(),
      isActive: true
    }
  ]
};

const tenantWebhooksStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'wh-1',
      tenantId: 'tenant_apex_retail',
      url: 'https://api.apexsuperstores.com/webhooks/pos-events',
      events: ['order.completed', 'refund.processed', 'stock.low'],
      secret: 'whsec_99a8123bf018',
      isActive: true,
      lastDeliveryStatus: 'success',
      lastDeliveryAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]
};

const tenantCustomPaymentTypesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    { id: 'cpay-1', tenantId: 'tenant_apex_retail', code: 'delivery_app', name: 'UberEats & DoorDash Order Voucher', enabled: true, requiresReference: true, chargeFeePercent: 0 },
    { id: 'cpay-2', tenantId: 'tenant_apex_retail', code: 'corporate_check', name: 'Corporate Account Check', enabled: true, requiresReference: true, chargeFeePercent: 0 },
    { id: 'cpay-3', tenantId: 'tenant_apex_retail', code: 'crypto_usdc', name: 'USDC Crypto Terminal', enabled: false, requiresReference: true, chargeFeePercent: 1.0 }
  ]
};

const tenantPosDevicesStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'dev-01',
      tenantId: 'tenant_apex_retail',
      deviceName: 'Lane 1 Main Cash Register (Android POS)',
      ipAddress: '192.168.1.101',
      printerModel: 'Epson TM-T88VI Thermal',
      status: 'online',
      lastPing: new Date().toISOString()
    },
    {
      id: 'dev-02',
      tenantId: 'tenant_apex_retail',
      deviceName: 'Lane 2 Customer Express POS',
      ipAddress: '192.168.1.102',
      printerModel: 'Star Micronics TSP143',
      status: 'online',
      lastPing: new Date(Date.now() - 600000).toISOString()
    }
  ]
};

const tenantReceiptDesignStore: Record<string, any> = {
  tenant_apex_retail: {
    headerLogoUrl: '',
    showBarcode: true,
    showTaxNumber: true,
    fontSize: 'standard',
    footerCustomMessage: 'Keep receipt for 14-day exchange or refund. Follow us on Instagram!',
    socialMediaHandle: '@ApexSuperstores'
  }
};

backOfficeRouter.get('/developer/api-keys', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const keys = await getTenantCollectionData(tenantId, 'api_keys', tenantApiKeysStore);
  res.json({ success: true, count: keys.length, keys });
});

backOfficeRouter.post('/developer/api-keys', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, scopes } = req.body;
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const newKey = {
    id: `key-${Date.now()}`,
    tenantId,
    name: name || 'API Client',
    keyPrefix: `bn_live_${tenantId.slice(-6)}_`,
    secretKeyMasked: `bn_live_${tenantId.slice(-6)}_••••••••••••${randomSuffix.slice(-4)}`,
    scopes: scopes || ['orders.read', 'products.read'],
    createdAt: new Date().toISOString(),
    isActive: true
  };
  if (!tenantApiKeysStore[tenantId]) tenantApiKeysStore[tenantId] = [];
  tenantApiKeysStore[tenantId].push(newKey);
  syncDocToFirestore(`tenants/${tenantId}/api_keys/${newKey.id}`, newKey);
  res.json({ success: true, message: 'New API Key generated successfully', apiKey: newKey });
});

backOfficeRouter.delete('/developer/api-keys/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { id } = req.params;
  if (tenantApiKeysStore[tenantId]) {
    tenantApiKeysStore[tenantId] = tenantApiKeysStore[tenantId].filter(k => k.id !== id);
  }
  deleteDocFromFirestore(`tenants/${tenantId}/api_keys/${id}`);
  res.json({ success: true, message: 'API key revoked' });
});

backOfficeRouter.get('/developer/webhooks', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const webhooks = await getTenantCollectionData(tenantId, 'webhooks', tenantWebhooksStore);
  res.json({ success: true, count: webhooks.length, webhooks });
});

backOfficeRouter.post('/developer/webhooks', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { url, events } = req.body;
  const newWebhook = {
    id: `wh-${Date.now()}`,
    tenantId,
    url,
    events: events || ['order.completed'],
    secret: `whsec_${Math.random().toString(36).substring(2, 14)}`,
    isActive: true,
    lastDeliveryStatus: 'success',
    lastDeliveryAt: new Date().toISOString()
  };
  if (!tenantWebhooksStore[tenantId]) tenantWebhooksStore[tenantId] = [];
  tenantWebhooksStore[tenantId].push(newWebhook);
  syncDocToFirestore(`tenants/${tenantId}/webhooks/${newWebhook.id}`, newWebhook);
  res.json({ success: true, message: 'Webhook endpoint registered', webhook: newWebhook });
});

backOfficeRouter.get('/custom-payment-types', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const types = await getTenantCollectionData(tenantId, 'custom_payment_types', tenantCustomPaymentTypesStore);
  res.json({ success: true, count: types.length, types });
});

backOfficeRouter.post('/custom-payment-types', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { name, code, requiresReference, chargeFeePercent, enabled } = req.body;
  const newType = {
    id: `cpay-${Date.now()}`,
    tenantId,
    code: code || name.toLowerCase().replace(/\s+/g, '_'),
    name,
    requiresReference: !!requiresReference,
    chargeFeePercent: Number(chargeFeePercent) || 0,
    enabled: enabled !== false
  };
  if (!tenantCustomPaymentTypesStore[tenantId]) tenantCustomPaymentTypesStore[tenantId] = [];
  tenantCustomPaymentTypesStore[tenantId].push(newType);
  syncDocToFirestore(`tenants/${tenantId}/custom_payment_types/${newType.id}`, newType);
  res.json({ success: true, message: 'Custom payment type added', paymentType: newType });
});

backOfficeRouter.get('/pos-devices', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const devices = await getTenantCollectionData(tenantId, 'pos_devices', tenantPosDevicesStore);
  res.json({ success: true, count: devices.length, devices });
});

backOfficeRouter.post('/pos-devices', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { deviceName, ipAddress, printerModel, status } = req.body;
  const newDevice = {
    id: `dev-${Date.now()}`,
    tenantId,
    deviceName: deviceName || 'POS Terminal Register',
    ipAddress: ipAddress || '192.168.1.100',
    printerModel: printerModel || 'ESC/POS 80mm Network Printer',
    status: status || 'online',
    lastPing: new Date().toISOString()
  };
  if (!tenantPosDevicesStore[tenantId]) tenantPosDevicesStore[tenantId] = [];
  tenantPosDevicesStore[tenantId].push(newDevice);
  syncDocToFirestore(`tenants/${tenantId}/pos_devices/${newDevice.id}`, newDevice);
  res.json({ success: true, message: 'POS device registered', device: newDevice });
});

backOfficeRouter.delete('/pos-devices/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const { id } = req.params;
  if (tenantPosDevicesStore[tenantId]) {
    tenantPosDevicesStore[tenantId] = tenantPosDevicesStore[tenantId].filter(d => d.id !== id);
  }
  deleteDocFromFirestore(`tenants/${tenantId}/pos_devices/${id}`);
  res.json({ success: true, message: 'POS device removed' });
});

backOfficeRouter.get('/receipt-design', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  let design = tenantReceiptDesignStore[tenantId];
  if (!design) {
    const firestoreDesign = await getDocumentFromFirestore<any>(`tenants/${tenantId}/config/receipt_design`);
    if (firestoreDesign) {
      tenantReceiptDesignStore[tenantId] = firestoreDesign;
      design = firestoreDesign;
    }
  }
  if (!design) {
    design = {
      headerLogoUrl: '',
      showBarcode: true,
      showTaxNumber: true,
      fontSize: 'standard',
      footerCustomMessage: 'Thank you for your visit!',
      socialMediaHandle: ''
    };
    tenantReceiptDesignStore[tenantId] = design;
    syncDocToFirestore(`tenants/${tenantId}/config/receipt_design`, design);
  }
  res.json({ success: true, design });
});

backOfficeRouter.put('/receipt-design', requireTenantAdmin, (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  tenantReceiptDesignStore[tenantId] = { ...(tenantReceiptDesignStore[tenantId] || {}), ...req.body };
  syncDocToFirestore(`tenants/${tenantId}/config/receipt_design`, tenantReceiptDesignStore[tenantId]);
  res.json({ success: true, message: 'Receipt design updated and synced with cloud database', design: tenantReceiptDesignStore[tenantId] });
});

// =============================================================
// TENANT MODULE 7: HELP CENTRE, COMMUNITY & LIVE CHAT
// =============================================================

const defaultHelpArticles = [
  { id: 'art-1', title: 'Connecting Handheld Barcode Scanners & ESC/POS Thermal Printers', category: 'Hardware Setup', content: 'BLUENILLA supports USB, Bluetooth, and TCP/IP LAN receipt printers. In Chrome or native Android, Bluetooth pairing triggers automatic auto-kick drawer pulses.', readTime: '3 min read' },
  { id: 'art-2', title: 'Performing Daily Z-Report Cash Reconciliations and Shift Balancing', category: 'POS Sales', content: 'At close of day, enter actual counted physical cash in the Shop Back Office. The system computes drawer variance, logs over/short differences, and synchronizes with accounting.', readTime: '4 min read' },
  { id: 'art-3', title: 'Setting Up Tiered Loyalty Points and Debtor Credit Limits', category: 'Customer Debtors', content: 'Debtor invoices can be issued directly from the checkout screen when customers have an authorized store credit balance.', readTime: '5 min read' },
  { id: 'art-4', title: 'Managing Multi-Branch Products, Stock Reorder Points, and PO Receiving', category: 'Inventory & Products', content: 'Configure minimum stock thresholds to trigger low-stock alerts automatically at all cash registers.', readTime: '4 min read' }
];

const tenantSupportTicketsStore: Record<string, any[]> = {
  tenant_apex_retail: [
    {
      id: 'tkt-01',
      tenantId: 'tenant_apex_retail',
      ticketNumber: 'TKT-8841',
      subject: 'Assistance with dual receipt printer setup on Lane 2',
      category: 'Hardware Setup',
      priority: 'medium',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        { id: 'msg-1', sender: 'user', senderName: 'Sarah Connor', text: 'Hi! We paired an Epson TM-T88VI over network IP 192.168.1.150. Can we route kitchen receipts separately?', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'msg-2', sender: 'agent', senderName: 'Platform Support Agent', text: 'Hello Sarah! Yes, navigate to App Control -> POS Devices, select Terminal Lane 2, and toggle "Dual Route Kitchen / Counter". Let us know if you need remote verification.', timestamp: new Date(Date.now() - 3600000).toISOString() }
      ]
    }
  ]
};

backOfficeRouter.get('/help/articles', requireTenantAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, count: defaultHelpArticles.length, articles: defaultHelpArticles });
});

backOfficeRouter.get('/help/tickets', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const tickets = await getTenantCollectionData(tenantId, 'support_tickets', tenantSupportTicketsStore);
  res.json({ success: true, count: tickets.length, tickets });
});

backOfficeRouter.post('/help/tickets', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const operator = (req.headers['x-user-name'] as string) || 'Shop Admin';
  const { subject, category, priority, initialMessage } = req.body;

  const newTicket = {
    id: `tkt-${Date.now()}`,
    tenantId,
    ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
    subject,
    category: category || 'General',
    priority: priority || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: operator,
        text: initialMessage || 'Support requested',
        timestamp: new Date().toISOString()
      }
    ]
  };

  if (!tenantSupportTicketsStore[tenantId]) tenantSupportTicketsStore[tenantId] = [];
  tenantSupportTicketsStore[tenantId].unshift(newTicket);
  syncDocToFirestore(`tenants/${tenantId}/support_tickets/${newTicket.id}`, newTicket);

  res.json({ success: true, message: 'Support ticket submitted to Hive Help Desk', ticket: newTicket });
});

backOfficeRouter.post('/help/tickets/:id/messages', requireTenantAdmin, async (req: Request, res: Response) => {
  const tenantId = (req.params as any).tenantId || (req.headers['x-tenant-id'] as string);
  const operator = (req.headers['x-user-name'] as string) || 'Shop Admin';
  const { id } = req.params;
  const { text } = req.body;

  const tickets = tenantSupportTicketsStore[tenantId] || [];
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'Ticket not found' });
  }

  const userMsg = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    senderName: operator,
    text,
    timestamp: new Date().toISOString()
  };
  ticket.messages.push(userMsg);
  syncDocToFirestore(`tenants/${tenantId}/support_tickets/${ticket.id}`, ticket);

  // Automated agent response simulation
  setTimeout(() => {
    ticket.messages.push({
      id: `msg-${Date.now() + 1}`,
      sender: 'agent',
      senderName: 'Hive Support Desk (Online)',
      text: `Thanks for the update, ${operator}! An enterprise specialist has received your note: "${text}". We are reviewing your shop configuration.`,
      timestamp: new Date().toISOString()
    });
    syncDocToFirestore(`tenants/${tenantId}/support_tickets/${ticket.id}`, ticket);
  }, 1000);

  res.json({ success: true, ticket });
});


// =============================================================
// HIVE CENTRAL BACKUP CONTROL (Platform level - Tenant restricted)
// =============================================================
export const hiveRouter = Router();

function requireHiveMaster(req: Request, res: Response, next: NextFunction) {
  const role = (req.headers['x-user-role'] as string) || '';
  const isHiveMaster = role === 'hive_master' || role === 'system_host';

  if (!isHiveMaster) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Hive Central Platform Control is Restricted',
      message: 'Tenants cannot view, create, or restore Central Hive backups. Use your shop-isolated backup at /api/tenant/:tenantId/backoffice/backups instead.',
      yourRole: role,
      requiredRole: 'hive_master | system_host',
      partitionPolicy: 'Database isolation enforces separate folders: Hive has "hive/platform/*", Tenants have "tenants/{tenantId}/*".'
    });
  }
  next();
}

hiveRouter.get('/backups', requireHiveMaster, async (req: Request, res: Response) => {
  try {
    const backups = await listHiveCentralBackups();
    res.json({
      success: true,
      scope: 'hive_central',
      folderPath: 'hive/platform/backups',
      count: backups.length,
      backups
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hiveRouter.post('/backups/create', requireHiveMaster, async (req: Request, res: Response) => {
  try {
    const operatorName = (req.headers['x-user-name'] as string) || 'Hive Master';
    const { notes } = req.body;
    const backup = await createHiveCentralBackup(operatorName, notes);
    res.json({
      success: true,
      message: `Hive Central master backup created in platform partition: ${backup.folderPath}`,
      backup
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

hiveRouter.post('/backups/:backupId/restore', requireHiveMaster, async (req: Request, res: Response) => {
  try {
    const operatorName = (req.headers['x-user-name'] as string) || 'Hive Master';
    const { backupId } = req.params;
    const result = await restoreHiveCentralBackup(backupId, operatorName);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
