import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  DollarSign, 
  Layers, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  ArrowRight,
  Monitor, 
  Calendar,
  AlertCircle,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { SubscriptionPackage, TenantContext, SubscriptionPlanTier, ModuleControlConfig } from '../../types';
import { dbService, subscribeToSyncEvents } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface SubscriptionPackagesManagerProps {
  tenants: TenantContext[];
  onTenantUpdated?: () => void;
}

export const SubscriptionPackagesManager: React.FC<SubscriptionPackagesManagerProps> = ({
  tenants,
  onTenantUpdated
}) => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Package Edit/Create Modal
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTier, setFormTier] = useState<SubscriptionPlanTier>('Professional');
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(299);
  const [formAnnualFee, setFormAnnualFee] = useState<number>(2990);
  const [formTerminalQuota, setFormTerminalQuota] = useState<number>(8);
  const [formDescription, setFormDescription] = useState('');
  const [formSla, setFormSla] = useState('99.9% High Availability SLA');
  const [formHighlights, setFormHighlights] = useState<string>('Unlimited transactions\nMulti-till sync\nAutomated daily Z-Report');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formModules, setFormModules] = useState<ModuleControlConfig>({
    sales: true,
    storeroom: true,
    accounts: true,
    hr: false,
    manager: true,
    it: false
  });

  // Assign Package to Tenant Modal
  const [assigningPackage, setAssigningPackage] = useState<SubscriptionPackage | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getSubscriptionPackages();
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
    const unsub = subscribeToSyncEvents((event) => {
      if (event.type === 'SUBSCRIPTION_PACKAGES_UPDATED' || event.type === 'TENANTS_UPDATED') {
        loadPackages();
      }
    });
    return unsub;
  }, []);

  const openCreateModal = () => {
    setEditingPackage(null);
    setIsCreating(true);
    setFormName('');
    setFormSlug('');
    setFormTier('Professional');
    setFormMonthlyFee(299);
    setFormAnnualFee(2990);
    setFormTerminalQuota(8);
    setFormDescription('Standard multi-terminal retail suite with live inventory and accounting.');
    setFormSla('99.9% High Availability SLA');
    setFormHighlights('Omni-channel register tills\nLive storeroom deduction\nCloud Z-Report ledger');
    setFormStatus('active');
    setFormModules({
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    });
  };

  const openEditModal = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    setIsCreating(false);
    setFormName(pkg.name);
    setFormSlug(pkg.slug);
    setFormTier(pkg.tier);
    setFormMonthlyFee(pkg.monthlyFee);
    setFormAnnualFee(pkg.annualFee);
    setFormTerminalQuota(pkg.terminalQuota);
    setFormDescription(pkg.description);
    setFormSla(pkg.sla || '99.9% High Availability SLA');
    setFormHighlights(pkg.highlightFeatures ? pkg.highlightFeatures.join('\n') : '');
    setFormStatus(pkg.status);
    setFormModules({ ...pkg.includedModules });
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const highlights = formHighlights
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newSlug = formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const badgeColor = formTier === 'Starter' 
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : formTier === 'Professional'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : formTier === 'Enterprise'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

    const borderColor = formTier === 'Starter'
      ? 'border-blue-500/30'
      : formTier === 'Professional'
      ? 'border-amber-500/30'
      : formTier === 'Enterprise'
      ? 'border-purple-500/30'
      : 'border-emerald-500/30';

    const pkgRecord: SubscriptionPackage = {
      id: editingPackage?.id || `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: formName,
      slug: newSlug,
      tier: formTier,
      monthlyFee: Number(formMonthlyFee) || 0,
      annualFee: Number(formAnnualFee) || 0,
      currency: 'USD',
      terminalQuota: Number(formTerminalQuota) || 1,
      description: formDescription,
      badgeClass: badgeColor,
      borderClass: borderColor,
      highlightFeatures: highlights,
      includedModules: formModules,
      sla: formSla,
      status: formStatus,
      subscriberCount: editingPackage?.subscriberCount || 0,
      createdAt: editingPackage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveSubscriptionPackage(pkgRecord);
      posAudio.playSuccessChime();
      setEditingPackage(null);
      setIsCreating(false);
      await loadPackages();
      setActionFeedback(`Pricing package "${pkgRecord.name}" saved successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to save package:', err);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await dbService.deleteSubscriptionPackage(id);
      posAudio.playButtonPress();
      await loadPackages();
      setActionFeedback(`Deleted pricing package "${name}".`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
  };

  const handleApplyPackageToTenant = async () => {
    if (!assigningPackage || !selectedTenantId) return;
    try {
      await dbService.applyPackageToTenant(selectedTenantId, assigningPackage, selectedBillingCycle);
      posAudio.playSuccessChime();
      const targetTenant = tenants.find(t => t.id === selectedTenantId);
      setActionFeedback(`Package "${assigningPackage.name}" successfully applied to ${targetTenant?.tenantName || 'Tenant'}!`);
      setAssigningPackage(null);
      setSelectedTenantId('');
      if (onTenantUpdated) onTenantUpdated();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to apply package:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Subscription Pricing Packages CRUD & Provisioning
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                HOST MANAGEMENT
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create, edit, delete, and dynamically assign commercial tier packages and quotas across business tenants.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Pricing Pack</span>
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => {
          const matchingTenants = tenants.filter(t => t.plan === pkg.tier || t.customPlanName === pkg.name);
          return (
            <div
              key={pkg.id}
              className={`p-5 rounded-3xl bg-slate-900 border flex flex-col justify-between transition relative ${
                pkg.borderClass || 'border-slate-800'
              } hover:border-slate-700`}
            >
              <div>
                {/* Top Badge & Tier */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${pkg.badgeClass}`}>
                    {pkg.tier}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      pkg.status === 'active' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {pkg.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-extrabold text-white">{pkg.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {pkg.description}
                </p>

                {/* Price Display */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-white font-mono">
                      ${pkg.monthlyFee}
                      <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    {pkg.annualFee > 0 && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        ${pkg.annualFee}/yr billed annually
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {pkg.terminalQuota} Till Seats
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {matchingTenants.length} Subscribers
                    </div>
                  </div>
                </div>

                {/* Included Modules list */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Included Modules</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(pkg.includedModules).map(([modKey, isEnabled]) => (
                      <span
                        key={modKey}
                        className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-bold uppercase transition ${
                          isEnabled
                            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-950/60 text-slate-600 line-through'
                        }`}
                      >
                        {modKey}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SLA */}
                <div className="mt-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  SLA: <strong className="text-slate-300">{pkg.sla}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssigningPackage(pkg);
                    setSelectedTenantId(tenants[0]?.id || '');
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Assign to Tenant</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(pkg)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Package"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition"
                    title="Delete Package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PACKAGE MODAL */}
      {(isCreating || editingPackage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isCreating ? 'Create New Subscription Package' : `Edit Package: ${editingPackage?.name}`}
                  </h4>
                  <p className="text-xs text-slate-400">Configure package pricing, included modules, and terminal quotas.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPackage(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Package Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Enterprise Omni-Till Suite"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Tier Classification</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as SubscriptionPlanTier)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Monthly Fee (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formMonthlyFee}
                      onChange={(e) => setFormMonthlyFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Annual Fee (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formAnnualFee}
                      onChange={(e) => setFormAnnualFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Terminal Seat Quota</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formTerminalQuota}
                      onChange={(e) => setFormTerminalQuota(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Package Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summary of package scope, commercial intent, and target business size..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">SLA Commitment</label>
                <input
                  type="text"
                  value={formSla}
                  onChange={(e) => setFormSla(e.target.value)}
                  placeholder="e.g. 99.99% Cloud POS SLA with Dedicated Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Module Toggles */}
              <div>
                <label className="text-slate-400 block mb-2 font-medium">Included Platform Modules</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sales', 'storeroom', 'accounts', 'hr', 'manager', 'it'] as const).map(modKey => (
                    <button
                      key={modKey}
                      type="button"
                      onClick={() => setFormModules(prev => ({ ...prev, [modKey]: !prev[modKey] }))}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        formModules[modKey]
                          ? 'bg-indigo-950/80 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="capitalize font-bold">{modKey}</span>
                      {formModules[modKey] && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Package Status</label>
                <div className="flex gap-2">
                  {(['active', 'draft', 'archived'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`px-3 py-1.5 rounded-xl capitalize font-semibold border transition ${
                        formStatus === st
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPackage(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PACKAGE TO TENANT MODAL */}
      {assigningPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Apply Package to Tenant</h4>
              </div>
              <button onClick={() => setAssigningPackage(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-medium">Selected Package:</div>
              <div className="text-sm font-bold text-white">{assigningPackage.name}</div>
              <div className="text-amber-400 font-mono font-bold">
                ${assigningPackage.monthlyFee}/mo • {assigningPackage.terminalQuota} Tills
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Select Target Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-hidden focus:border-amber-500"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tenantName} ({t.businessName}) - Current: {t.customPlanName || t.plan}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Billing Cycle</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle('monthly')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    selectedBillingCycle === 'monthly'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Monthly ($ {assigningPackage.monthlyFee}/mo)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingCycle('annual')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    selectedBillingCycle === 'annual'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Annual (${assigningPackage.annualFee}/yr)
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPackageToTenant}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enforce Package Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
