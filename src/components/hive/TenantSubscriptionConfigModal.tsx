import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Lock, 
  DollarSign, 
  CreditCard, 
  Layers, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Cpu, 
  Sparkles, 
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  ShieldAlert,
  Clock,
  ExternalLink,
  Award
} from 'lucide-react';
import { 
  TenantContext, 
  ModuleControlConfig, 
  SubmoduleControlConfig,
  SubscriptionPlanTier, 
  TenantSubscriptionStatus,
  getSubscriptionAlertState
} from '../../types';
import { 
  MODULE_DEFINITIONS, 
  SUBSCRIPTION_PLAN_TIERS, 
  calculateStandaloneValue, 
  ModuleDefinition 
} from '../../data/subscriptionPlans';
import { posAudio } from '../../services/hardware';
import { dbService } from '../../services/db';

interface TenantSubscriptionConfigModalProps {
  isOpen: boolean;
  tenant: TenantContext;
  onClose: () => void;
  onSave: (updatedTenant: TenantContext) => Promise<void>;
}

export const TenantSubscriptionConfigModal: React.FC<TenantSubscriptionConfigModalProps> = ({
  isOpen,
  tenant,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>(tenant.plan || 'Professional');
  const [monthlyFee, setMonthlyFee] = useState<number>(tenant.monthlyFee || 299);
  const [subscriptionStatus, setSubscriptionStatus] = useState<TenantSubscriptionStatus>(tenant.status || 'active');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(tenant.billingCycle || 'monthly');
  const [terminalQuota, setTerminalQuota] = useState<number>(tenant.terminalQuota || 8);
  const [modules, setModules] = useState<ModuleControlConfig>({
    sales: tenant.enabledModules?.sales ?? true,
    storeroom: tenant.enabledModules?.storeroom ?? true,
    accounts: tenant.enabledModules?.accounts ?? true,
    hr: tenant.enabledModules?.hr ?? false,
    manager: tenant.enabledModules?.manager ?? true,
    it: tenant.enabledModules?.it ?? false
  });
  const [contractId, setContractId] = useState<string>(tenant.contractId || `SUB-${tenant.tenantId.toUpperCase().slice(-8)}`);
  const [expiresAt, setExpiresAt] = useState<string>(
    tenant.expiresAt ? tenant.expiresAt.slice(0, 10) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  
  // Custom Subscription Data (Host Enters Custom Specifications)
  const [customPlanName, setCustomPlanName] = useState<string>(tenant.customPlanName || (tenant.plan === 'Custom' ? 'Bespoke Custom Modular' : ''));
  const [customSla, setCustomSla] = useState<string>(tenant.customSla || '99.9% High Availability SLA');
  const [customGraceDays, setCustomGraceDays] = useState<number>(tenant.customGraceDays ?? 7);
  const [customMaxSku, setCustomMaxSku] = useState<number>(tenant.customMaxSku ?? 10000);
  const [customMaxDailyTx, setCustomMaxDailyTx] = useState<number>(tenant.customMaxDailyTx ?? 1500);
  const [approvedAt, setApprovedAt] = useState<string>(tenant.approvedAt || '');
  const [approvedBy, setApprovedBy] = useState<string>(tenant.approvedBy || '');
  
  // Email Alert States
  const [emailSending, setEmailSending] = useState(false);
  const [emailNoticeSent, setEmailNoticeSent] = useState<string | null>(null);

  const [submodules, setSubmodules] = useState<SubmoduleControlConfig>(
    tenant.enabledSubmodules || {
      sales: {
        quickCashButtons: true,
        cashierDiscounts: true,
        allowPriceOverride: true,
        customerFacingDisplay: true,
        autoKickCashDrawer: true,
        parkedOrders: true,
        splitPayments: true,
        paperlessReceipts: true,
      },
      storeroom: {
        stockReplenishment: true,
        lowStockAlerts: true,
        stockAdjustments: true,
        barcodeReceiving: true,
        preventNegativeStock: true,
      },
      accounts: {
        arApInvoicing: true,
        midnightZReport: true,
        expenseVouchers: true,
        taxFiling: true,
        ledgerExport: true,
      },
      manager: {
        grossMarginAnalysis: true,
        cashDrawerReconciliation: true,
        pdfExecutiveReports: true,
        hourlyPeakAnalytics: true,
      },
      it: {
        hardwarePairing: true,
        cloudBackups: true,
        redisTelemetry: true,
        gdprErasure: true,
      },
      hr: {
        shiftScheduling: true,
        timeclockStamps: true,
        wageTracking: true,
        tipPooling: true,
        biometricEnforcement: true,
      }
    }
  );
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [subscriptionNotes, setSubscriptionNotes] = useState<string>(
    tenant.subscriptionNotes || `Subscription configured according to agreed monthly fee of $${tenant.monthlyFee || 299}.`
  );
  const [isSaving, setIsSaving] = useState(false);

  // Current alert status for live preview
  const currentAlert = getSubscriptionAlertState({
    ...tenant,
    status: subscriptionStatus,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    approvedAt
  });

  // Total standalone valuation of active modules
  const standaloneValue = calculateStandaloneValue(modules);

  // Apply plan defaults
  const handleSelectPlan = (tierId: SubscriptionPlanTier) => {
    setSelectedPlan(tierId);
    const tierConfig = SUBSCRIPTION_PLAN_TIERS[tierId];
    if (tierConfig) {
      setMonthlyFee(tierConfig.monthlyFee);
      setTerminalQuota(tierConfig.terminalQuota);
      setModules({ ...tierConfig.defaultModules });
      if (tierId === 'Custom' && !customPlanName) {
        setCustomPlanName(`${tenant.businessName} Bespoke Plan`);
      }
    }
    posAudio.playButtonPress();
  };

  // Toggle individual module
  const handleToggleModule = (key: keyof ModuleControlConfig) => {
    setModules(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const matchingTier = (['Starter', 'Professional', 'Enterprise'] as const).find(t => {
        const d = SUBSCRIPTION_PLAN_TIERS[t].defaultModules;
        return (
          d.sales === next.sales &&
          d.storeroom === next.storeroom &&
          d.accounts === next.accounts &&
          d.hr === next.hr &&
          d.manager === next.manager &&
          d.it === next.it
        );
      });
      if (matchingTier) {
        setSelectedPlan(matchingTier);
      } else {
        setSelectedPlan('Custom');
      }
      return next;
    });
    posAudio.playScanBeep();
  };

  const handleApproveLicense = () => {
    const nowIso = new Date().toISOString();
    setApprovedAt(nowIso);
    setApprovedBy('aqutewavedev@gmail.com');
    setSubscriptionStatus('active');
    posAudio.playSuccessChime();
  };

  const handleSendEmailAlert = async (alertType: 'overdue_warning' | 'expiry_alert' | 'subscription_approved') => {
    setEmailSending(true);
    try {
      await dbService.sendSubscriptionEmailAlert({
        tenantId: tenant.id,
        alertType,
        recipientEmail: tenant.ownerEmail || tenant.contactEmail,
        sentBy: 'aqutewavedev@gmail.com'
      });
      setEmailNoticeSent(`Notice email (${alertType.replace('_', ' ')}) dispatched to ${tenant.ownerEmail || tenant.contactEmail}`);
      posAudio.playSuccessChime();
      setTimeout(() => setEmailNoticeSent(null), 4000);
    } catch (err) {
      console.error('Failed to send email alert:', err);
    } finally {
      setEmailSending(false);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: TenantContext = {
        ...tenant,
        plan: selectedPlan,
        customPlanName: selectedPlan === 'Custom' ? customPlanName : (customPlanName || undefined),
        customSla,
        customGraceDays: Number(customGraceDays) || 7,
        customMaxSku: Number(customMaxSku) || 10000,
        customMaxDailyTx: Number(customMaxDailyTx) || 1500,
        approvedAt: approvedAt || undefined,
        approvedBy: approvedBy || undefined,
        monthlyFee: Number(monthlyFee) || 0,
        status: subscriptionStatus,
        billingCycle,
        terminalQuota: Number(terminalQuota) || 1,
        enabledModules: modules,
        enabledSubmodules: submodules,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        contractId,
        subscriptionNotes
      };
      await onSave(updated);
      posAudio.playSuccessChime();
      onClose();
    } catch (err) {
      console.error('Error saving subscription config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'BarChart3': return <BarChart3 className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="modal-subscription-configurator"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Configure Tenant Subscription & Module Access
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  HIVE MASTER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-slate-200">{tenant.tenantName}</strong> • {tenant.businessName} ({tenant.subdomain})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-200">
          
          {/* Real-time Email Dispatch Toast Banner */}
          {emailNoticeSent && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{emailNoticeSent}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEmailNoticeSent(null)} 
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Real-time Subscription Alert Health Status & Host Notice Dispatch */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            currentAlert.state === 'overdue'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : currentAlert.state === 'expiring_critical' || currentAlert.state === 'expiring_warning'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : currentAlert.state === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl border mt-0.5 shrink-0 ${
                currentAlert.state === 'overdue'
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : currentAlert.state === 'expiring_critical' || currentAlert.state === 'expiring_warning'
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : currentAlert.state === 'approved'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {currentAlert.state === 'overdue' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : currentAlert.state === 'approved' ? (
                  <Award className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Subscription Health: {currentAlert.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    currentAlert.state === 'overdue'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : currentAlert.state === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {currentAlert.state.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                  {currentAlert.message}
                </p>
                {approvedAt && (
                  <p className="text-[11px] text-emerald-400/90 font-mono mt-1">
                    ✓ Officially Approved by Host: {approvedBy || 'aqutewavedev@gmail.com'} on {new Date(approvedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Email Dispatch Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={emailSending}
                onClick={() => handleSendEmailAlert('overdue_warning')}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                title="Dispatch Overdue Grace Notice Email to Tenant Owner"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Overdue Email</span>
              </button>

              <button
                type="button"
                disabled={emailSending}
                onClick={() => handleSendEmailAlert('expiry_alert')}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                title="Dispatch Expiry Countdown Alert Email to Tenant Owner"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Send Expiry Email</span>
              </button>

              <button
                type="button"
                disabled={emailSending}
                onClick={() => handleSendEmailAlert('subscription_approved')}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
                title="Dispatch Formal License Approval Certificate Email"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Send Approval Email</span>
              </button>
            </div>
          </div>
          
          {/* SECTION 1: Subscription Tier Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Subscription Tier & Preset Packaging</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Hive controls module access based on fees paid
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(Object.keys(SUBSCRIPTION_PLAN_TIERS) as SubscriptionPlanTier[]).map(tierKey => {
                const plan = SUBSCRIPTION_PLAN_TIERS[tierKey];
                const isSelected = selectedPlan === tierKey;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => handleSelectPlan(tierKey)}
                    className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${plan.badgeClass}`}>
                          {plan.id}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white mt-1">{plan.name}</div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                      <div className="text-base font-extrabold text-white font-mono">
                        ${plan.monthlyFee}
                        <span className="text-[10px] font-normal text-slate-400">/mo</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {plan.terminalQuota} Tills
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Pricing & Payment Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Fee Paid & Billing Terms</span>
              </label>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>Standalone Value:</span>
                <span className="text-slate-200 line-through">${standaloneValue}/mo</span>
                <span className="text-emerald-400 font-bold">
                  {standaloneValue > monthlyFee 
                    ? `Save $${standaloneValue - monthlyFee}/mo (${Math.round(((standaloneValue - monthlyFee) / standaloneValue) * 100)}% off)`
                    : 'Included'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Monthly Fee Input */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Agreed Monthly Fee (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[149, 249, 299, 499, 599].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMonthlyFee(p)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition ${
                        monthlyFee === p
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Billing Cycle
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      billingCycle === 'monthly'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                      billingCycle === 'annual'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold">
                      -15%
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment & Subscription Status */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Subscription Status
                </label>
                <select
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value as TenantSubscriptionStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                >
                  <option value="active">Active (Fee Paid & In Good Standing)</option>
                  <option value="trial">Trial Evaluation (30 Days)</option>
                  <option value="past_due">Past Due (Grace Period Active)</option>
                  <option value="suspended">Suspended (All Modules Gated)</option>
                </select>
                <span className={`text-[10px] block mt-1 ${
                  subscriptionStatus === 'active' ? 'text-emerald-400' :
                  subscriptionStatus === 'trial' ? 'text-amber-400' :
                  subscriptionStatus === 'past_due' ? 'text-orange-400' : 'text-rose-400'
                }`}>
                  {subscriptionStatus === 'active' && '✓ Tenant possesses active commercial license'}
                  {subscriptionStatus === 'trial' && '⏳ Temporary evaluation access granted'}
                  {subscriptionStatus === 'past_due' && '⚠️ Invoicing grace period expires in 7 days'}
                  {subscriptionStatus === 'suspended' && '🛑 Terminal fleet and modules locked'}
                </span>
              </div>

              {/* Terminal Fleet Quota */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Authorized Till Device Quota
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={terminalQuota}
                    onChange={(e) => setTerminalQuota(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">Tills</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Currently {tenant.activeTerminalsCount} of {terminalQuota} paired
                </span>
              </div>

              {/* License Expiration */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  License Expiry (expiresAt)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setExpiresAt(d.toISOString().slice(0, 10));
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono border bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  >
                    +30d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      setExpiresAt(d.toISOString().slice(0, 10));
                    }}
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono border bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                  >
                    +1yr
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2.5: Custom Subscription Specifications & Host Approval */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>2.5 Custom Subscription Data & Host Authorization</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Platform Host enters bespoke subscription parameters, enterprise SLAs, and signs license approvals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApproveLicense}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    approvedAt
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{approvedAt ? 'License Approved ✓' : 'Approve Commercial License'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Custom Plan Name */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Custom Plan Designation / Suffix
                </label>
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="e.g. Pacific Coast Enterprise Platinum"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-hidden focus:border-amber-500 placeholder:text-slate-600"
                />
              </div>

              {/* Service Level Agreement (SLA) */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Guaranteed SLA Commitment
                </label>
                <input
                  type="text"
                  value={customSla}
                  onChange={(e) => setCustomSla(e.target.value)}
                  placeholder="e.g. 99.99% High-Availability with 1hr Response"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Grace Period Days */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Overdue Grace Period (Days before Lockdown)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={customGraceDays}
                    onChange={(e) => setCustomGraceDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Days</span>
                </div>
              </div>

              {/* Max Catalog SKU Capacity */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Custom SKU Catalog Ceiling
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={customMaxSku}
                    onChange={(e) => setCustomMaxSku(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">SKUs</span>
                </div>
              </div>

              {/* Max Daily Transactions */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Max Daily Transactions Quota
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="250"
                    value={customMaxDailyTx}
                    onChange={(e) => setCustomMaxDailyTx(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Tx / Day</span>
                </div>
              </div>

              {/* Approval Stamping Info */}
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  License Approval Status
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {approvedAt ? `Approved ${new Date(approvedAt).toLocaleDateString()}` : 'Pending Host Stamp'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {approvedBy || 'aqutewavedev@gmail.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Six-Module Entitlement Switchboard */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. Module Entitlements Controlled by Hive</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Turn modules on or off for this tenant. Gated modules display a lock icon in the business header and prevent unauthorized use.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModules({
                    sales: true,
                    storeroom: true,
                    accounts: true,
                    hr: true,
                    manager: true,
                    it: true
                  })}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Enable All
                </button>
                <button
                  type="button"
                  onClick={() => setModules({
                    sales: true,
                    storeroom: false,
                    accounts: false,
                    hr: false,
                    manager: false,
                    it: false
                  })}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Minimal POS Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODULE_DEFINITIONS.map(mod => {
                const isEnabled = modules[mod.key];
                const Icon = getModuleIcon(mod.iconName);

                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggleModule(mod.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer select-none transition ${
                      isEnabled
                        ? 'bg-slate-900/90 border-indigo-600/80 shadow-md shadow-indigo-600/5'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isEnabled 
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' 
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {Icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{mod.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                              ${mod.standaloneMonthlyFee}/mo value
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-mono block">
                            {mod.category}
                          </span>
                        </div>
                      </div>

                      {/* Switch Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleModule(mod.key);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                          isEnabled
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Gated</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {mod.tagline}
                    </p>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {mod.coreFeatures.slice(0, 2).map((feat, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                              • {feat}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedModule(expandedModule === mod.key ? null : mod.key);
                          }}
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-2 py-0.5 px-1.5 rounded bg-slate-900 border border-slate-800"
                        >
                          <span>Submodules</span>
                          {expandedModule === mod.key ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {expandedModule === mod.key && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 animate-in fade-in slide-in-from-top-1"
                        >
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Granular {mod.name} Features
                          </span>
                          {Object.entries((submodules as any)[mod.key] || {}).map(([subKey, subVal]) => (
                            <label key={subKey} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-900/80 cursor-pointer">
                              <span className="text-slate-300 font-mono text-[11px] capitalize">
                                {subKey.replace(/([A-Z])/g, ' $1')}
                              </span>
                              <input
                                type="checkbox"
                                checked={Boolean(subVal)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSubmodules(prev => ({
                                    ...prev,
                                    [mod.key]: {
                                      ...(prev as any)[mod.key],
                                      [subKey]: checked
                                    }
                                  }));
                                }}
                                className="w-3.5 h-3.5 rounded text-amber-500 accent-amber-500 cursor-pointer"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Live Preview of Tenant's Navigation Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Live Tenant Header Preview
              </span>
              <span className="text-[10px] text-slate-500">
                What employees of {tenant.tenantName} will see in the navigation bar
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center gap-1 overflow-x-auto">
              {[
                { key: 'sales', label: 'Sales POS', icon: ShoppingBag },
                { key: 'storeroom', label: 'Storeroom & PO', icon: Package },
                { key: 'accounts', label: 'Accounts', icon: DollarSign },
                { key: 'hr', label: 'HR Workforce', icon: Users },
                { key: 'manager', label: 'Manager', icon: BarChart3 },
                { key: 'it', label: 'IT & Security', icon: Cpu }
              ].map(tab => {
                const isPermitted = modules[tab.key as keyof ModuleControlConfig];
                const TabIcon = tab.icon;
                return (
                  <div
                    key={tab.key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                      isPermitted
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-slate-950/60 text-slate-600 border-slate-900 opacity-60'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {!isPermitted && <Lock className="w-2.5 h-2.5 text-rose-400 ml-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: Subscription Contract & Internal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Contract Reference / Invoice ID
              </label>
              <input
                type="text"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="e.g. SUB-BLUENILLA-2026-Q3"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Hive Host Module Allocation Notes
              </label>
              <input
                type="text"
                value={subscriptionNotes}
                onChange={(e) => setSubscriptionNotes(e.target.value)}
                placeholder="Notes on fee paid, custom discounts, or module agreements"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 font-mono">
              Changes take effect immediately across all active tenant registers and browser windows.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 font-bold" />
                <span>{isSaving ? 'Enforcing...' : 'Save & Enforce Subscription'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
