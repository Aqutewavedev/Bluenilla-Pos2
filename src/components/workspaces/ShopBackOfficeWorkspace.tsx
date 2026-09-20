import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Sliders, 
  Receipt, 
  Users, 
  FileText, 
  Terminal, 
  Smartphone, 
  Check, 
  X, 
  RefreshCw, 
  DollarSign, 
  Store, 
  Percent, 
  Clock, 
  Printer, 
  Scan, 
  Layers, 
  Eye, 
  ChevronRight,
  Database,
  ArrowRight,
  Key,
  Wrench,
  FolderLock,
  Table,
  Server,
  TrendingUp,
  Package,
  BookOpen,
  Tag,
  HelpCircle,
  Cpu,
  Sparkles
} from 'lucide-react';
import { 
  TenantContext, 
  User, 
  TenantShopConfig, 
  DailyZReport, 
  isTenantAdminUser, 
  isSystemHostUser,
  isShopGuestMode,
  isShopSubscribed,
  isSubmoduleEnabled
} from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { backOfficeApi } from '../../services/apiClient';
import { DatabaseTableViewer } from '../common/DatabaseTableViewer';
import { AdminCrudAndErrorAid } from '../backoffice/AdminCrudAndErrorAid';
import { TenantBackupManager } from '../backoffice/TenantBackupManager';
import { SalesReportsControl } from '../backoffice/SalesReportsControl';
import { CatalogManagement } from '../backoffice/CatalogManagement';
import { CustomerDebtorManagement } from '../backoffice/CustomerDebtorManagement';
import { DiscountPricingPlans } from '../backoffice/DiscountPricingPlans';
import { StaffAdminControl } from '../backoffice/StaffAdminControl';
import { AppControlITBackend } from '../backoffice/AppControlITBackend';
import { HelpDeskSupport } from '../backoffice/HelpDeskSupport';

interface ShopBackOfficeWorkspaceProps {
  tenant: TenantContext | null;
  currentUser: User | null;
  availableUsers: User[];
  onSwitchUser: (user: User) => void;
  onOpenHiveMaster?: () => void;
  onOpenSubscriptionManager?: () => void;
  onOpenCreateShop?: () => void;
}

export const ShopBackOfficeWorkspace: React.FC<ShopBackOfficeWorkspaceProps> = ({
  tenant,
  currentUser,
  availableUsers,
  onSwitchUser,
  onOpenHiveMaster,
  onOpenSubscriptionManager,
  onOpenCreateShop
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'sales_reports'
    | 'catalog'
    | 'customers'
    | 'discounts'
    | 'staff_hr'
    | 'app_control'
    | 'help_support'
    | 'modules'
    | 'branding'
    | 'crud_repair'
    | 'shop_backup'
    | 'staff'
    | 'z_report'
    | 'api_explorer'
    | 'db_tables'
  >('sales_reports');
  const [config, setConfig] = useState<TenantShopConfig | null>(null);
  const [zReport, setZReport] = useState<DailyZReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiLogs, setApiLogs] = useState<{ timestamp: string; method: string; url: string; status: number; data: any }[]>([]);

  // RBAC Bypass / PIN modal state for non-admin users
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [temporaryAdminUnlocked, setTemporaryAdminUnlocked] = useState(false);

  // Cash count state for Daily Z-Report
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconcileSuccess, setReconcileSuccess] = useState(false);

  // New quick cash denomination input
  const [newCashDenom, setNewCashDenom] = useState<string>('');

  const isAuthorized = !currentUser ? true : (isTenantAdminUser(currentUser) || temporaryAdminUnlocked);

  const loadData = async () => {
    if (!tenant || !currentUser) {
      setConfig(null);
      setZReport(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const shopConfig = await dbService.getTenantShopConfig(tenant.id, currentUser);
      setConfig(shopConfig);

      const report = await dbService.getDailyZReport(tenant.id, currentUser);
      setZReport(report);
      if (report) {
        setActualCashInput(report.actualCashCounted || report.cashInDrawerExpected);
      }
    } catch (err) {
      console.error('Failed to load shop back office data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.id, currentUser?.id]);

  const logApiCall = (method: string, url: string, status: number, data: any) => {
    setApiLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        method,
        url,
        status,
        data
      },
      ...prev.slice(0, 9)
    ]);
  };

  // Handle saving shop configuration
  const handleSaveConfig = async () => {
    if (!tenant || !config) return;
    if (isShopGuestMode(tenant)) {
      posAudio.playErrorTone();
      alert(`Shop Guest Mode (Read-Only): Saving configurations is locked on unsubscribed shop "${tenant.businessName}". Under the 1-subscription rule, only your active subscribed shop has write access. You can roam and inspect all modules freely, or activate this shop using the Subscription Manager.`);
      return;
    }
    if (!currentUser) {
      posAudio.playErrorTone();
      alert('Survey Mode: Store settings and rules cannot be saved to the database. Sign in with a tenant subscription to save store configurations.');
      return;
    }
    setIsSaving(true);
    posAudio.playButtonPress();
    try {
      const updated = await dbService.updateTenantShopConfig(tenant.id, config, currentUser);
      setConfig(updated);
      posAudio.playSuccessChime();
      setSaveSuccess(true);
      logApiCall('PUT', `/api/tenant/${tenant.id}/backoffice/config`, 200, { success: true, updatedAt: updated.updatedAt });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      logApiCall('PUT', `/api/tenant/${tenant.id}/backoffice/config`, 500, { error: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Daily Z-Report reconciliation
  const handleReconcileShift = async () => {
    if (!tenant) return;
    if (isShopGuestMode(tenant)) {
      posAudio.playErrorTone();
      alert(`Shop Guest Mode (Read-Only): Z-Report reconciliation is locked on unsubscribed shop "${tenant.businessName}".`);
      return;
    }
    if (!currentUser) {
      posAudio.playErrorTone();
      alert('Survey Mode: Z-Report reconciliation cannot be written to the database. Sign in with subscription to save.');
      return;
    }
    try {
      const res = await backOfficeApi.reconcileDailyZReport(
        tenant.id,
        actualCashInput,
        reconcileNotes,
        currentUser
      );
      if (res && res.success && res.report) {
        setZReport(res.report);
        setReconcileSuccess(true);
        posAudio.playSuccessChime();
        logApiCall('POST', `/api/tenant/${tenant.id}/backoffice/reports/daily-z/reconcile`, 200, res.report);
        setTimeout(() => setReconcileSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Reconciliation failed:', err);
    }
  };

  // Quick cash buttons modifier
  const handleAddCashDenom = () => {
    const val = parseInt(newCashDenom);
    if (!val || val <= 0 || !config) return;
    if (!config.modules.salesPOS.quickCashButtons.includes(val)) {
      const updatedList = [...config.modules.salesPOS.quickCashButtons, val].sort((a, b) => a - b);
      setConfig({
        ...config,
        modules: {
          ...config.modules,
          salesPOS: {
            ...config.modules.salesPOS,
            quickCashButtons: updatedList
          }
        }
      });
    }
    setNewCashDenom('');
  };

  const handleRemoveCashDenom = (denom: number) => {
    if (!config) return;
    const updatedList = config.modules.salesPOS.quickCashButtons.filter(x => x !== denom);
    setConfig({
      ...config,
      modules: {
        ...config.modules,
        salesPOS: {
          ...config.modules.salesPOS,
          quickCashButtons: updatedList
        }
      }
    });
  };

  // PIN Unlock Verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === '1234' || enteredPin === '9999') {
      posAudio.playSuccessChime();
      setTemporaryAdminUnlocked(true);
      setPinError(false);
    } else {
      posAudio.playErrorTone();
      setPinError(true);
    }
  };

  if (!tenant) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 text-white">
        <div className="text-center max-w-md">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold">No Active Shop Selected</h2>
          <p className="text-xs text-slate-400 mt-1">
            Please select a tenant business to configure shop frontend modules and back office operations.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RBAC GATE: UNAUTHORIZED ROLE SCREEN
  // =========================================================================
  if (!isAuthorized) {
    const adminUsers = availableUsers.filter(u => isTenantAdminUser(u));

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 text-slate-100 overflow-y-auto">
        <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="text-center">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800">
              Role-Based Access Control Enforced
            </span>
            <h2 className="text-xl font-black text-white mt-3">
              Shop Back Office Restricted
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The Back Office manages frontend module availability, POS operational rules, and shop branding for <strong className="text-white">{tenant?.tenantName || 'Shop Workspace'}</strong>. Access is restricted to <strong className="text-slate-200">Tenant Admin, Business Owner, or Store Manager</strong> roles.
            </p>
          </div>

          <div className="mt-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'} 
                alt={currentUser?.name || 'User'} 
                className="w-9 h-9 rounded-xl border border-slate-700" 
              />
              <div>
                <span className="font-bold text-white block">{currentUser?.name || 'Guest User'}</span>
                <span className="text-[10px] text-slate-400 font-mono">Current Role: {currentUser?.role || 'Guest'} ({currentUser?.workspace || 'Public'})</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950 text-rose-400 border border-rose-800 font-mono uppercase font-bold">
              Unauthorized
            </span>
          </div>

          {/* Quick Option 1: Unlock with Admin PIN */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <form onSubmit={handleVerifyPin} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Authorize with Tenant Admin or Manager PIN:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter PIN (e.g. 1234 or 9999)"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>
              </div>
              {pinError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3 h-3" />
                  <span>Invalid administrator PIN. Try 1234 or 9999.</span>
                </p>
              )}
            </form>
          </div>

          {/* Quick Option 2: Switch to Tenant Admin Account */}
          {adminUsers.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Or switch to an authorized administrator:
              </span>
              <div className="space-y-2">
                {adminUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      posAudio.playSuccessChime();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between text-xs transition text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg border border-slate-700" />
                      <div>
                        <span className="font-bold text-slate-200 group-hover:text-amber-400 transition">{u.name}</span>
                        <span className="text-[10px] text-slate-500 block">{u.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-400 text-[11px] font-mono">
                      <span>Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED BACK OFFICE WORKSPACE
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner & Control Bar */}
      <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-white tracking-tight">
                {config?.branding?.shopDisplayName || tenant.tenantName}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {tenant.subdomain}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                {tenant.plan} Plan
              </span>
              {isSystemHostUser(currentUser) ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 font-bold">
                  <Server className="w-3 h-3 text-amber-400" />
                  <span>Hive Admin (Tenant Oversight: Read-Only)</span>
                </span>
              ) : isShopSubscribed(tenant) ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Subscribed (Read & Write)</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 font-bold">
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>Guest Mode (Read-Only)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {config?.branchName || 'Main Store'} • {tenant.businessName} • Backend API :3000 Active
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Synced with Backend</span>
            </span>
          )}

          {isShopGuestMode(tenant) && onOpenSubscriptionManager && (
            <button
              onClick={onOpenSubscriptionManager}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activate Subscription</span>
            </button>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={isSaving || isSystemHostUser(currentUser)}
            title={
              isSystemHostUser(currentUser)
                ? "Hive Admin cannot write tenant data directly. Only tenant can write shop configuration."
                : "Save Shop Config"
            }
            className={`px-4 py-2 rounded-xl font-bold text-xs transition shadow-md flex items-center gap-1.5 ${
              isSystemHostUser(currentUser)
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-amber-500/10 cursor-pointer disabled:opacity-50'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSystemHostUser(currentUser) ? 'Tenant Config (Read Only)' : 'Save Shop Config'}</span>
          </button>

          {isSystemHostUser(currentUser) && onOpenHiveMaster && (
            <button
              onClick={onOpenHiveMaster}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700 flex items-center gap-1.5"
              title="Open Hive Master platform host"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Hive Master</span>
            </button>
          )}
        </div>
      </div>

      {/* Hive Admin Read-Only Notice Bar */}
      {isSystemHostUser(currentUser) && (
        <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Hive Admin Protection Policy:</strong> You have universal oversight of this shop, but <strong className="underline">cannot write or modify tenant data</strong>. Tenant data modification is reserved strictly for the shop owner. As Hive Admin, you can assist with <strong>central data backup & restore</strong>.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold whitespace-nowrap">
            Tenant Integrity Protected
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="px-5 bg-slate-900/60 border-b border-slate-800 flex gap-2 overflow-x-auto">
        {[
          { id: 'sales_reports', label: 'Sales & Refunds', icon: TrendingUp, badge: 'SALES' },
          { id: 'catalog', label: 'Products & Stock', icon: Package, badge: 'PRODUCTS' },
          { id: 'customers', label: 'Customers & Debtors', icon: BookOpen, badge: 'CRM' },
          { id: 'discounts', label: 'Discounts & Pricing', icon: Tag, badge: 'PLANS' },
          { id: 'staff_hr', label: 'Staff HR & Access', icon: Users, badge: 'HR' },
          { id: 'app_control', label: 'App Control IT', icon: Cpu, badge: 'I.T' },
          { id: 'help_support', label: 'Help & Live Chat', icon: HelpCircle, badge: 'SUPPORT' },
          { id: 'modules', label: 'POS Feature Switches', icon: Sliders },
          { id: 'branding', label: 'Receipt Layout', icon: Receipt },
          { id: 'crud_repair', label: 'Admin CRUD Aid', icon: Wrench },
          { id: 'shop_backup', label: 'Shop Backup', icon: FolderLock },
          { id: 'z_report', label: 'Daily Z-Balancing', icon: FileText },
          { id: 'db_tables', label: 'Database Inspector', icon: Table },
          { id: 'api_explorer', label: 'REST API Explorer', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                posAudio.playButtonPress();
              }}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {(tab as any).badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black ${
                  isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {(tab as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-7xl w-full mx-auto">
        {isLoading || !config ? (
          <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
            <span className="block ml-2 font-mono">Loading Shop Configuration...</span>
          </div>
        ) : (
          <>
            {/* =========================================================================
                NEW MODULES REQUESTED FOR TENANT BACKEND CONTROL
                ========================================================================= */}
            {activeTab === 'sales_reports' && (
              <SalesReportsControl tenant={tenant} currentUser={currentUser} />
            )}

            {activeTab === 'catalog' && (
              <CatalogManagement tenant={tenant} currentUser={currentUser} />
            )}

            {activeTab === 'customers' && (
              <CustomerDebtorManagement tenant={tenant} currentUser={currentUser} />
            )}

            {activeTab === 'discounts' && (
              <DiscountPricingPlans tenant={tenant} currentUser={currentUser} />
            )}

            {activeTab === 'staff_hr' && (
              <StaffAdminControl 
                tenant={tenant} 
                currentUser={currentUser} 
                availableUsers={availableUsers} 
              />
            )}

            {activeTab === 'app_control' && (
              <AppControlITBackend tenant={tenant} currentUser={currentUser} />
            )}

            {activeTab === 'help_support' && (
              <HelpDeskSupport tenant={tenant} currentUser={currentUser} />
            )}
            {/* =========================================================================
                TAB 1: FRONTEND MODULES & POS OPERATIONAL RULES
                ========================================================================= */}
            {activeTab === 'modules' && (
              <div className="space-y-6">
                {/* Notice on Hive Master limits */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Hive Master Subscription Gating Boundary
                      </h4>
                      <p className="text-xs text-indigo-200/80 mt-0.5 leading-relaxed">
                        As Tenant Admin, you can toggle frontend features and module workflows for your shop staff. Modules granted by your central Hive subscription (<strong className="text-white">{tenant.plan} Tier</strong>) are active.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                    <span className="text-slate-400">Subscription Status:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                      Active (${tenant.monthlyFee}/mo)
                    </span>
                  </div>
                </div>

                {/* Grid of Modules */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Sales POS Module Controls */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Sales POS Register</span>
                          {tenant.enabledModules.sales ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
                              Hive Permitted
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono border border-rose-800">
                              Gated by Hive
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Configure cashier register behavior, payment buttons, and checkout rules.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.modules.salesPOS.enabled && tenant.enabledModules.sales}
                          disabled={!tenant.enabledModules.sales}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              modules: {
                                ...config.modules,
                                salesPOS: { ...config.modules.salesPOS, enabled: e.target.checked }
                              }
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                      </label>
                    </div>

                    {/* Quick Cash Denominations */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Quick-Cash One-Tap Tenders</span>
                        <span className="text-[10px] text-slate-500">Displayed on payment screen</span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {config.modules.salesPOS.quickCashButtons.map(denom => (
                          <span
                            key={denom}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5"
                          >
                            <span>${denom}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCashDenom(denom)}
                              className="text-slate-500 hover:text-rose-400 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Add $"
                            value={newCashDenom}
                            onChange={(e) => setNewCashDenom(e.target.value)}
                            className="w-16 px-2 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddCashDenom}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Fine-grain POS switches */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                      {[
                        {
                          label: 'Allow Cashier Manual Discount',
                          desc: 'Permit discount input on the active sales cart',
                          key: 'allowCashierDiscounts' as const
                        },
                        {
                          label: 'Allow Manual Price Override',
                          desc: 'Permit custom item price entry for damaged or custom goods',
                          key: 'allowPriceOverride' as const
                        },
                        {
                          label: 'Auto-Kick Cash Drawer on Cash Sale',
                          desc: 'Send hardware pulse to solenoid drawer upon cash completion',
                          key: 'autoKickCashDrawer' as const
                        },
                        {
                          label: 'Customer-Facing Secondary Display Mode',
                          desc: 'Dual monitor support with customer live total and ads',
                          key: 'customerFacingDisplay' as const,
                          isGated: !isSubmoduleEnabled(tenant, 'sales', 'customerFacingDisplay')
                        },
                        {
                          label: 'Continuous Barcode Scanner Mode',
                          desc: 'Do not require clicking scan button; listen for rapid USB keystrokes',
                          key: 'barcodeContinuousMode' as const,
                          isGated: false
                        },
                        {
                          label: 'Allow Parked / Layaway Orders',
                          desc: 'Enable saving incomplete orders for later resume',
                          key: 'allowParkedOrders' as const,
                          isGated: !isSubmoduleEnabled(tenant, 'sales', 'parkedOrders')
                        },
                        {
                          label: 'Allow Split Tender Payments',
                          desc: 'Cash + Card combinations on single transaction',
                          key: 'allowSplitPayments' as const,
                          isGated: !isSubmoduleEnabled(tenant, 'sales', 'splitPayments')
                        },
                        {
                          label: 'Require Cash Float Verification at Shift Start',
                          desc: 'Cashier must count and verify opening cash float',
                          key: 'requireCashFloatVerification' as const,
                          isGated: false
                        }
                      ].map(sw => (
                        <div key={sw.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-200 block">{sw.label}</span>
                              {sw.isGated && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/80 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Hive Gated</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">{sw.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            disabled={sw.isGated}
                            checked={!sw.isGated && config.modules.salesPOS[sw.key]}
                            title={sw.isGated ? "Feature locked by Hive Master subscription" : ""}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                modules: {
                                  ...config.modules,
                                  salesPOS: {
                                    ...config.modules.salesPOS,
                                    [sw.key]: e.target.checked
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                      ))}

                      {/* Max discount slider */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">Max Discount Without Manager Override</span>
                          <span className="font-mono font-bold text-amber-400">{config.modules.salesPOS.maxDiscountPercentWithoutManager}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={5}
                          value={config.modules.salesPOS.maxDiscountPercentWithoutManager}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              modules: {
                                ...config.modules,
                                salesPOS: {
                                  ...config.modules.salesPOS,
                                  maxDiscountPercentWithoutManager: parseInt(e.target.value) || 0
                                }
                              }
                            });
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Storeroom, Accounts & HR Modules */}
                  <div className="space-y-5">
                    {/* Storeroom Module */}
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Storeroom & Stock Gating</span>
                            {tenant.enabledModules.storeroom ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono border border-rose-800">
                                Locked by Hive
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Inventory alerts, barcode PO receiving, and stock policies</p>
                        </div>

                        <input
                          type="checkbox"
                          checked={config.modules.storeroom.enabled && tenant.enabledModules.storeroom}
                          disabled={!tenant.enabledModules.storeroom}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              modules: {
                                ...config.modules,
                                storeroom: { ...config.modules.storeroom, enabled: e.target.checked }
                              }
                            });
                          }}
                          className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        {[
                          {
                            label: 'Low Stock Warning Banners at POS',
                            desc: 'Show visual banner when cashier selects item below threshold',
                            key: 'lowStockBannerAtPOS' as const
                          },
                          {
                            label: 'Prevent Negative Stock Sales',
                            desc: 'Hard stop checkout if available inventory is 0',
                            key: 'preventNegativeStockSales' as const
                          },
                          {
                            label: 'Require Manager Approval for Stock Adjustment',
                            desc: 'Shrinkage, damage, and manual reconciliation require sign-off',
                            key: 'requireManagerApprovalStockAdjustment' as const
                          },
                          {
                            label: 'Rapid Barcode Receiving Mode',
                            desc: 'Auto-increment received qty on barcode scan',
                            key: 'rapidBarcodeReceiving' as const
                          }
                        ].map(sw => (
                          <div key={sw.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">{sw.label}</span>
                              <span className="text-[10px] text-slate-500 block">{sw.desc}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={config.modules.storeroom[sw.key]}
                              onChange={(e) => {
                                setConfig({
                                  ...config,
                                  modules: {
                                    ...config.modules,
                                    storeroom: {
                                      ...config.modules.storeroom,
                                      [sw.key]: e.target.checked
                                    }
                                  }
                                });
                              }}
                              className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Accounts & HR Module settings */}
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Accounts & Staff Compliance</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Z-Reports, petty cash expense vouchers, and shift enforcement</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">Enforce Shift Clock-In Before Sale</span>
                            <span className="text-[10px] text-slate-500 block">Cashier cannot open till without clocking in first</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.modules.hr.requireClockInBeforeSale}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                modules: {
                                  ...config.modules,
                                  hr: { ...config.modules.hr, requireClockInBeforeSale: e.target.checked }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">Allow Petty Cash Vouchers at Register</span>
                            <span className="text-[10px] text-slate-500 block">Cashier can record till paid-outs for supplies with receipt</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.modules.accounts.allowExpenseVouchersAtPOS}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                modules: {
                                  ...config.modules,
                                  accounts: { ...config.modules.accounts, allowExpenseVouchersAtPOS: e.target.checked }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">Auto-Generate Daily Z-Report at Midnight</span>
                            <span className="text-[10px] text-slate-500 block">Summarize transactions and calculate expected cash</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.modules.accounts.autoGenerateZReportAtMidnight}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                modules: {
                                  ...config.modules,
                                  accounts: { ...config.modules.accounts, autoGenerateZReportAtMidnight: e.target.checked }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: SHOP BRANDING & 80MM THERMAL RECEIPT LAYOUT
                ========================================================================= */}
            {activeTab === 'branding' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Settings */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>Shop Profile & Receipt Identity</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Display Name</label>
                        <input
                          type="text"
                          value={config.branding.shopDisplayName}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              branding: { ...config.branding, shopDisplayName: e.target.value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Registration / VAT #</label>
                        <input
                          type="text"
                          value={config.branding.taxRegistrationNumber}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              branding: { ...config.branding, taxRegistrationNumber: e.target.value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tax / VAT Rate (%)</label>
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          max={35}
                          value={config.branding.taxRatePercent}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              branding: { ...config.branding, taxRatePercent: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Symbol</label>
                        <select
                          value={config.branding.currencySymbol}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              branding: { ...config.branding, currencySymbol: e.target.value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="$">$ (USD / CAD / AUD)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="£">£ (GBP)</option>
                          <option value="¥">¥ (JPY)</option>
                          <option value="₹">₹ (INR)</option>
                          <option value="AED">AED (Dirham)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Return Window (Days)</label>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={config.branding.returnPolicyDays}
                          onChange={(e) => {
                            setConfig({
                              ...config,
                              branding: { ...config.branding, returnPolicyDays: parseInt(e.target.value) || 0 }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Header Message</label>
                      <textarea
                        rows={3}
                        value={config.branding.receiptHeader}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            branding: { ...config.branding, receiptHeader: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Footer & Exchange Policy</label>
                      <textarea
                        rows={3}
                        value={config.branding.receiptFooter}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            branding: { ...config.branding, receiptFooter: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Live 80mm Thermal Receipt Preview */}
                <div className="lg:col-span-5">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-3">
                      Live 80mm Thermal Receipt Simulation
                    </span>

                    {/* Paper Preview */}
                    <div className="bg-amber-50 text-slate-900 p-5 rounded-xl shadow-xl font-mono text-xs border border-amber-200/60 max-w-sm mx-auto space-y-3">
                      <div className="text-center border-b border-dashed border-slate-400 pb-2">
                        <h4 className="font-extrabold text-sm uppercase tracking-wide">
                          {config.branding.shopDisplayName || 'BLUENILLA POS'}
                        </h4>
                        <div className="text-[11px] whitespace-pre-line text-slate-600 mt-1">
                          {config.branding.receiptHeader}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Tax ID: {config.branding.taxRegistrationNumber}
                        </div>
                      </div>

                      <div className="text-[10px] flex justify-between text-slate-600">
                        <span>TX #88291-01</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>

                      <div className="border-b border-dashed border-slate-300 pb-2 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span>1x Wireless Barcode Scanner</span>
                          <span>{config.branding.currencySymbol}45.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2x Thermal Receipt Paper 80mm</span>
                          <span>{config.branding.currencySymbol}12.00</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] pt-1 border-b border-dashed border-slate-400 pb-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{config.branding.currencySymbol}57.00</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tax ({config.branding.taxRatePercent}%):</span>
                          <span>{config.branding.currencySymbol}{(57 * (config.branding.taxRatePercent / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-400">
                          <span>TOTAL:</span>
                          <span>{config.branding.currencySymbol}{(57 * (1 + config.branding.taxRatePercent / 100)).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="text-center text-[10px] whitespace-pre-line text-slate-600 pt-1">
                        {config.branding.receiptFooter}
                      </div>

                      {/* Mock Barcode */}
                      <div className="text-center pt-2">
                        <div className="h-7 bg-slate-900 flex items-center justify-center text-white text-[9px] tracking-widest">
                          || | | |||| | ||| || ||| ||
                        </div>
                        <span className="text-[9px] text-slate-500">88291-01-2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: ADMIN CRUD & ERROR AID
                ========================================================================= */}
            {activeTab === 'crud_repair' && (
              <AdminCrudAndErrorAid tenant={tenant} currentUser={currentUser} />
            )}

            {/* =========================================================================
                TAB 4: SHOP-ISOLATED BACKUP & RESTORE
                ========================================================================= */}
            {activeTab === 'shop_backup' && (
              <TenantBackupManager tenant={tenant} currentUser={currentUser} />
            )}

            {/* =========================================================================
                TAB 5: STAFF ROLES & PERMISSIONS MATRIX
                ========================================================================= */}
            {activeTab === 'staff' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Shop Role-Based Access Control (RBAC) Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure operational privileges granted to each role within {tenant.tenantName}.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px]">
                        <th className="p-3.5">Permission Capability</th>
                        <th className="p-3.5 text-center">Cashier</th>
                        <th className="p-3.5 text-center">Receiver</th>
                        <th className="p-3.5 text-center">Accountant</th>
                        <th className="p-3.5 text-center">Store Manager</th>
                        <th className="p-3.5 text-center text-amber-400">Tenant Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-slate-200">
                      {[
                        { key: 'pos.checkout', label: 'Ring POS Sales & Tender Payments' },
                        { key: 'pos.override_discount', label: 'Override Cashier Discount Limit' },
                        { key: 'pos.void_sale', label: 'Void Completed / Parked Transactions' },
                        { key: 'pos.price_override', label: 'Manual Unit Price Modification' },
                        { key: 'storeroom.scan_receive', label: 'Scan & Receive PO Shipments' },
                        { key: 'accounts.view_z_reports', label: 'View & Reconcile Z-Reports' },
                        { key: 'backoffice.view', label: 'Access Shop Back Office Dashboard' },
                        { key: 'backoffice.modules', label: 'Configure Frontend Module Settings' }
                      ].map(perm => (
                        <tr key={perm.key} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-semibold">
                            <span>{perm.label}</span>
                            <span className="block text-[10px] font-mono text-slate-500">{perm.key}</span>
                          </td>
                          <td className="p-3.5 text-center">
                            {perm.key === 'pos.checkout' ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {perm.key.startsWith('storeroom') ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {perm.key.startsWith('accounts') ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {perm.key !== 'backoffice.modules' ? (
                              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-slate-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-3.5 text-center bg-amber-500/5">
                            <Check className="w-4 h-4 text-amber-400 mx-auto font-bold" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: DAILY Z-REPORT & REGISTER BALANCING
                ========================================================================= */}
            {activeTab === 'z_report' && zReport && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Gross Sales Today</span>
                    <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
                      ${zReport.grossSales.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-1 block font-mono">
                      {zReport.totalTransactions} Completed Orders
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Cash Tenders</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
                      ${zReport.cashTenders.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                      + ${zReport.openingFloat.toFixed(2)} Float
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Card & NFC Tenders</span>
                    <span className="text-2xl font-extrabold text-sky-400 font-mono mt-1 block">
                      ${(zReport.cardTenders + zReport.nfcTenders).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                      Electronic Bank Settlement
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Expected Drawer Cash</span>
                    <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
                      ${zReport.cashInDrawerExpected.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      Must match physical till
                    </span>
                  </div>
                </div>

                {/* Till Reconciliation Panel */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Physical Cash Drawer Count & Daily Shift Close</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Report Date: {zReport.reportDate} • Session: {zReport.closedAt}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Actual Physical Cash Counted ($)
                      </label>
                      <input
                        type="number"
                        step={0.01}
                        value={actualCashInput}
                        onChange={(e) => setActualCashInput(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
                      />
                      <div className="mt-2 text-xs font-mono flex items-center justify-between">
                        <span className="text-slate-400">Expected in Drawer:</span>
                        <span className="font-bold text-white">${zReport.cashInDrawerExpected.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 text-xs font-mono flex items-center justify-between">
                        <span className="text-slate-400">Drawer Discrepancy (Variance):</span>
                        <span className={`font-bold ${
                          actualCashInput - zReport.cashInDrawerExpected === 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          ${(actualCashInput - zReport.cashInDrawerExpected).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Shift Balancing & Audit Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Register balanced. Drawer float returned to safe."
                        value={reconcileNotes}
                        onChange={(e) => setReconcileNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleReconcileShift}
                        className="mt-3 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reconcile Shift & Close Register for Today</span>
                      </button>
                    </div>
                  </div>

                  {reconcileSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Shift reconciled! End-of-Day Z-Report sealed and transmitted to Accounts.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 5: LIVE BACKEND REST API EXPLORER
                ========================================================================= */}
            {activeTab === 'api_explorer' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Live Express Backend REST API Inspector</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      PORT 3000
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test live HTTP requests to the Node/Express backend. Requests enforce <code className="text-amber-400">X-Tenant-ID</code> and <code className="text-amber-400">X-User-Role</code> headers.
                  </p>
                </div>

                {/* API Tester Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={async () => {
                      const tenantId = tenant?.id || 'bluenilla_core';
                      const res = await backOfficeApi.getConfig(tenantId, currentUser);
                      logApiCall('GET', `/api/tenant/${tenantId}/backoffice/config`, 200, res);
                    }}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-bold">GET</span>
                      <span className="text-[10px] text-slate-500 font-mono">200 OK</span>
                    </div>
                    <span className="text-xs font-bold text-white mt-2 block">Fetch Shop Configuration</span>
                    <span className="text-[10px] text-slate-400 font-mono block">/backoffice/config</span>
                  </button>

                  <button
                    onClick={async () => {
                      const tenantId = tenant?.id || 'bluenilla_core';
                      const res = await backOfficeApi.getDailyZReport(tenantId, currentUser);
                      logApiCall('GET', `/api/tenant/${tenantId}/backoffice/reports/daily-z`, 200, res);
                    }}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-bold">GET</span>
                      <span className="text-[10px] text-slate-500 font-mono">200 OK</span>
                    </div>
                    <span className="text-xs font-bold text-white mt-2 block">Get Live Daily Z-Report</span>
                    <span className="text-[10px] text-slate-400 font-mono block">/reports/daily-z</span>
                  </button>

                  <button
                    onClick={async () => {
                      const tenantId = tenant?.id || 'bluenilla_core';
                      const res = await backOfficeApi.pushTerminalConfig(
                        tenantId,
                        'REG-01',
                        { quickCashButtons: [10, 20, 50, 100], autoKickDrawer: true },
                        currentUser
                      );
                      logApiCall('POST', `/api/tenant/${tenantId}/backoffice/terminals/REG-01/push-config`, 200, res);
                    }}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">POST</span>
                      <span className="text-[10px] text-slate-500 font-mono">200 OK</span>
                    </div>
                    <span className="text-xs font-bold text-white mt-2 block">Push Terminal Preset</span>
                    <span className="text-[10px] text-slate-400 font-mono block">/terminals/:id/push-config</span>
                  </button>
                </div>

                {/* API Request Logs Console */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-mono text-slate-400 font-semibold">Live HTTP Audit Trail:</span>
                    <span className="text-[10px] font-mono text-slate-500">Headers: X-Tenant-ID: {tenant?.id || 'guest'} | X-User-Role: {currentUser?.role || 'guest'}</span>
                  </div>

                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
                    {apiLogs.length === 0 ? (
                      <div className="text-slate-600 text-center py-6">
                        No requests triggered yet. Click one of the test buttons above or save shop configuration.
                      </div>
                    ) : (
                      apiLogs.map((log, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.method === 'GET' ? 'bg-sky-950 text-sky-400' : 'bg-emerald-950 text-emerald-400'
                              }`}>
                                {log.method}
                              </span>
                              <span className="text-slate-300">{log.url}</span>
                            </div>
                            <span className="text-slate-500">{log.timestamp}</span>
                          </div>
                          <pre className="mt-2 text-[10px] text-amber-300/80 bg-slate-900/80 p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 8: DATABASE TABLE INSPECTOR & CLOUD SYNC
                ========================================================================= */}
            {activeTab === 'db_tables' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <DatabaseTableViewer currentTenantId={tenant?.id || 'bluenilla_core'} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
