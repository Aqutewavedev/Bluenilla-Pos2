/**
 * Client API Service for Tenant Back Office and Shop Operations
 * Talks to the Express Backend API at /api/tenant/:tenantId/backoffice
 * Automatically attaches RBAC and Multi-Tenant headers:
 * - X-Tenant-ID
 * - X-User-Role
 * - X-User-ID
 * - X-User-Name
 * - X-User-Category
 */

import {
  TenantShopConfig,
  DailyZReport,
  User,
  Product,
  Transaction,
  FrontendAnomaly,
  TenantBackupSnapshot,
  HiveCentralBackupSnapshot,
  RepairActionLog
} from '../types';

function getHeaders(tenantId: string, user?: User | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-User-Role': user?.role || 'cashier',
    'X-User-ID': user?.id || 'anon',
    'X-User-Name': user?.name || 'Shop Staff',
    'X-User-Category': user?.userCategory || 'staff'
  };
}

export const backOfficeApi = {
  /**
   * Fetch Shop Back Office Configuration
   */
  async getConfig(tenantId: string, user?: User | null): Promise<{ success: boolean; config: TenantShopConfig; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/config`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackOfficeApi] Fetch failed, returning offline fallback:', err);
      return {
        success: false,
        error: err.message || 'Network request failed',
        config: null as any
      };
    }
  },

  /**
   * Save Updated Shop Back Office Configuration
   */
  async updateConfig(
    tenantId: string,
    updates: Partial<TenantShopConfig>,
    user?: User | null
  ): Promise<{ success: boolean; config: TenantShopConfig; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/config`, {
        method: 'PUT',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackOfficeApi] Update failed:', err);
      return {
        success: false,
        error: err.message || 'Network request failed',
        config: null as any
      };
    }
  },

  /**
   * Get Live End-Of-Day Z-Report
   */
  async getDailyZReport(tenantId: string, user?: User | null): Promise<{ success: boolean; report: DailyZReport; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/reports/daily-z`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackOfficeApi] Z-Report fetch failed:', err);
      return {
        success: false,
        error: err.message || 'Network request failed',
        report: null as any
      };
    }
  },

  /**
   * Reconcile Register & Close Shift
   */
  async reconcileDailyZReport(
    tenantId: string,
    actualCashCounted: number,
    notes: string,
    user?: User | null
  ): Promise<{ success: boolean; report: DailyZReport; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/reports/daily-z/reconcile`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify({ actualCashCounted, notes })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network request failed',
        report: null as any
      };
    }
  },

  /**
   * Push Frontend Preset Override to a Terminal Till
   */
  async pushTerminalConfig(
    tenantId: string,
    terminalId: string,
    settings: any,
    user?: User | null
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/terminals/${encodeURIComponent(terminalId)}/push-config`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network request failed'
      };
    }
  },

  // =========================================================
  // PRODUCTS CRUD (Admin control & catalog management)
  // =========================================================
  async getProducts(tenantId: string, user?: User | null): Promise<{ success: boolean; products: Product[]; count?: number; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/products`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, products: [], error: err.message };
    }
  },

  async createProduct(tenantId: string, productData: Partial<Product>, user?: User | null): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/products`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(productData)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async updateProduct(tenantId: string, productId: string, updates: Partial<Product>, user?: User | null): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteProduct(tenantId: string, productId: string, user?: User | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // TRANSACTIONS CRUD (Admin control & transactions repair)
  // =========================================================
  async getTransactions(tenantId: string, user?: User | null): Promise<{ success: boolean; transactions: Transaction[]; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/transactions`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, transactions: [], error: err.message };
    }
  },

  async updateTransaction(tenantId: string, txId: string, updates: Partial<Transaction>, user?: User | null): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/transactions/${encodeURIComponent(txId)}`, {
        method: 'PUT',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteTransaction(tenantId: string, txId: string, user?: User | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/transactions/${encodeURIComponent(txId)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // FRONTEND ANOMALIES & ERROR AID
  // =========================================================
  async getAnomalies(tenantId: string, user?: User | null): Promise<{ success: boolean; anomalies: FrontendAnomaly[]; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/anomalies`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, anomalies: [], error: err.message };
    }
  },

  async autoRepairAnomalies(tenantId: string, user?: User | null): Promise<{ success: boolean; repairedCount: number; logs: RepairActionLog[]; message: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/anomalies/auto-repair`, {
        method: 'POST',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, repairedCount: 0, logs: [], message: 'Auto repair failed', error: err.message };
    }
  },

  async getRepairLogs(tenantId: string, user?: User | null): Promise<{ success: boolean; logs: RepairActionLog[]; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/anomalies/logs`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, logs: [], error: err.message };
    }
  },

  // =========================================================
  // TENANT ISOLATED BACKUP & RESTORE (Shop own partition)
  // =========================================================
  async getTenantBackups(tenantId: string, user?: User | null): Promise<{ success: boolean; partition: string; backups: TenantBackupSnapshot[]; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/backups`, {
        method: 'GET',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, partition: `tenants/${tenantId}/backups`, backups: [], error: err.message };
    }
  },

  async createTenantBackup(tenantId: string, notes?: string, user?: User | null): Promise<{ success: boolean; backup?: TenantBackupSnapshot; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/backups/create`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify({ notes })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async restoreTenantBackup(tenantId: string, backupId: string, user?: User | null): Promise<{ success: boolean; message?: string; details?: any; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/backups/${encodeURIComponent(backupId)}/restore`, {
        method: 'POST',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteTenantBackup(tenantId: string, backupId: string, user?: User | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/backups/${encodeURIComponent(backupId)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // HIVE CENTRAL BACKUP CONTROL (Platform level - Tenant restricted)
  // =========================================================
  async getHiveBackups(user?: User | null): Promise<{ success: boolean; backups: HiveCentralBackupSnapshot[]; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/hive/backups', {
        method: 'GET',
        headers: getHeaders('hive_system', user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, backups: [], error: err.message };
    }
  },

  async createHiveBackup(notes?: string, user?: User | null): Promise<{ success: boolean; backup?: HiveCentralBackupSnapshot; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/hive/backups/create', {
        method: 'POST',
        headers: getHeaders('hive_system', user),
        body: JSON.stringify({ notes })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async restoreHiveBackup(backupId: string, user?: User | null): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/hive/backups/${encodeURIComponent(backupId)}/restore`, {
        method: 'POST',
        headers: getHeaders('hive_system', user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // MODULE 1: SALES & REPORTING API
  // =========================================================
  async getSalesSummary(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/reports/sales-summary`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getRefunds(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/refunds`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, refunds: [], error: err.message };
    }
  },

  async createRefund(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/refunds`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getStoreCharges(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/charges`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, charges: [], error: err.message };
    }
  },

  async createStoreCharge(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/charges`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteStoreCharge(tenantId: string, id: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/charges/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getSuspiciousReports(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/suspicious-reports`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, reports: [], error: err.message };
    }
  },

  // =========================================================
  // MODULE 2: PRODUCTS, CATEGORIES, MODIFIERS, UOM & CODES
  // =========================================================
  async getCategories(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/categories`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, categories: [], error: err.message };
    }
  },

  async createCategory(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/categories`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteCategory(tenantId: string, id: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getModifiers(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/modifiers`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, modifiers: [], error: err.message };
    }
  },

  async createModifier(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/modifiers`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getUOM(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/uom`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, uom: [], error: err.message };
    }
  },

  async createUOM(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/uom`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getClassificationCodes(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/classification-codes`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, codes: [], error: err.message };
    }
  },

  // =========================================================
  // MODULE 3: CUSTOMERS, LOYALTY & DEBTORS
  // =========================================================
  async getCustomers(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/customers`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, customers: [], error: err.message };
    }
  },

  async createCustomer(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/customers`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getDebtors(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/debtors`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, totalOutstanding: 0, invoices: [], settlements: [], error: err.message };
    }
  },

  async settleDebtorCredit(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/debtors/settle`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // MODULE 4: DISCOUNT PLANS & PRICING
  // =========================================================
  async getDiscounts(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/discounts`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, discounts: [], error: err.message };
    }
  },

  async createDiscount(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/discounts`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteDiscount(tenantId: string, id: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/discounts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getPricingPlans(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/pricing-plans`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, plans: [], error: err.message };
    }
  },

  async getPriceChanges(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/price-changes`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, changes: [], error: err.message };
    }
  },

  async schedulePriceChange(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/price-changes`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // MODULE 5: STAFF HR & COMMISSIONS
  // =========================================================
  async getStaffCommissionRules(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/staff/commission-rules`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, rules: [], error: err.message };
    }
  },

  async createStaffCommissionRule(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/staff/commission-rules`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getStaffAccessLogs(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/staff/access-logs`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, logs: [], error: err.message };
    }
  },

  // =========================================================
  // MODULE 6: APP CONTROL, I.T. BACKEND & DEVELOPER TOOLS
  // =========================================================
  async getApiKeys(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/developer/api-keys`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, keys: [], error: err.message };
    }
  },

  async createApiKey(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/developer/api-keys`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteApiKey(tenantId: string, id: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/developer/api-keys/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getWebhooks(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/developer/webhooks`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, webhooks: [], error: err.message };
    }
  },

  async createWebhook(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/developer/webhooks`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getCustomPaymentTypes(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/custom-payment-types`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, types: [], error: err.message };
    }
  },

  async createCustomPaymentType(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/custom-payment-types`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getReceiptDesign(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/receipt-design`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, design: null, error: err.message };
    }
  },

  async updateReceiptDesign(tenantId: string, design: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/receipt-design`, {
        method: 'PUT',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(design)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getPosDevices(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/pos-devices`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, devices: [], error: err.message };
    }
  },

  async registerPosDevice(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/pos-devices`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // =========================================================
  // MODULE 7: HELP CENTRE, ARTICLES & SUPPORT TICKETS
  // =========================================================
  async getHelpArticles(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/help/articles`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, articles: [], error: err.message };
    }
  },

  async getSupportTickets(tenantId: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/help/tickets`, {
        headers: getHeaders(tenantId, user)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, tickets: [], error: err.message };
    }
  },

  async createSupportTicket(tenantId: string, payload: any, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/help/tickets`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async sendTicketMessage(tenantId: string, ticketId: string, text: string, user?: User | null) {
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantId)}/backoffice/help/tickets/${encodeURIComponent(ticketId)}/messages`, {
        method: 'POST',
        headers: getHeaders(tenantId, user),
        body: JSON.stringify({ text })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};

