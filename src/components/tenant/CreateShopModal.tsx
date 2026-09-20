import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Building2, 
  MapPin, 
  Globe, 
  DollarSign, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  KeyRound,
  Trash2,
  PauseCircle,
  PlayCircle,
  Sliders,
  Layers,
  Clock,
  Edit3,
  Save,
  RotateCcw,
  Phone,
  MessageCircle,
  Mail
} from 'lucide-react';
import { TenantContext, SubscriptionPlanTier, User } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: TenantContext;
  availableTenants: TenantContext[];
  currentUser?: User | null;
  onShopCreated: (newShop: TenantContext) => void;
  onShopUpdated?: () => Promise<void>;
  onSelectShop?: (shop: TenantContext) => void;
}

export const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  availableTenants,
  currentUser,
  onShopCreated,
  onShopUpdated,
  onSelectShop
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // Existing shops belonging to this tenant/credentials
  const myShops = availableTenants.filter(t => 
    t.tenantId === activeTenant.tenantId || 
    (currentUser?.email && (t.ownerEmail === currentUser.email || t.contactEmail === currentUser.email))
  );

  const currentlySubscribedShop = myShops.find(t => t.isSubscribed && t.status !== 'unsubscribed');

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [currency, setCurrency] = useState(activeTenant.currency || 'USD');
  const [timezone, setTimezone] = useState(activeTenant.timezone || 'America/New_York');
  const [plan, setPlan] = useState<SubscriptionPlanTier>(activeTenant.plan || 'Professional');
  const [subscriptionChoice, setSubscriptionChoice] = useState<'activate' | 'hold'>('hold');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Shop management state
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setBusinessName(name);
    if (!subdomain || subdomain === businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      const generated = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSubdomain(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg('Please provide a shop or branch name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const shouldActivateNow = subscriptionChoice === 'activate';

      const newShop = await dbService.createTenantShop({
        tenantId: activeTenant.tenantId,
        tenantName: activeTenant.tenantName,
        businessName: businessName.trim(),
        branchAddress: branchAddress.trim() || 'Downtown Retail Branch',
        subdomain: subdomain.trim() || `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.bluenilla.com`,
        currency,
        timezone,
        plan,
        ownerEmail: currentUser?.email || activeTenant.contactEmail,
        activateNow: shouldActivateNow
      });

      if (!shouldActivateNow) {
        // Explicitly set as on hold / unsubscribed for later activation
        newShop.status = 'unsubscribed';
        newShop.isSubscribed = false;
        await dbService.saveTenant(newShop);
      }

      posAudio.playSuccessChime();
      onShopCreated(newShop);
      if (onShopUpdated) await onShopUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create new shop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Put a shop on hold or resume active subscription
  const handleToggleHoldShop = async (shop: TenantContext) => {
    setActionProcessingId(shop.id);
    setActionSuccessMsg(null);
    try {
      const isCurrentlyActive = shop.isSubscribed && shop.status === 'active';
      const newStatus = isCurrentlyActive ? 'unsubscribed' : 'active';
      
      await dbService.updateTenantSubscription(shop.id, {
        status: newStatus
      });

      if (onShopUpdated) await onShopUpdated();
      posAudio.playScanBeep();
      setActionSuccessMsg(
        isCurrentlyActive 
          ? `Shop "${shop.businessName}" is now ON HOLD. You can subscribe and activate it later.`
          : `Shop "${shop.businessName}" is now ACTIVATED with full subscription.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update shop status.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Permanently delete a shop
  const handleDeleteShop = async (shop: TenantContext) => {
    if (myShops.length <= 1) {
      alert('Cannot delete the only remaining shop in your account.');
      return;
    }

    setActionProcessingId(shop.id);
    try {
      await dbService.deleteTenant(shop.id);
      posAudio.playButtonPress();

      // If deleted shop was active, select another shop
      if (shop.id === activeTenant.id) {
        const remaining = myShops.filter(s => s.id !== shop.id);
        if (remaining.length > 0 && onSelectShop) {
          onSelectShop(remaining[0]);
        }
      }

      if (onShopUpdated) await onShopUpdated();
      setDeletingShopId(null);
      setActionSuccessMsg(`Shop "${shop.businessName}" was successfully deleted.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete shop.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Edit Shop Profile State & Handlers
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editIsWhatsAppAvailable, setEditIsWhatsAppAvailable] = useState(true);
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editTimezone, setEditTimezone] = useState('America/New_York');
  const [editPlan, setEditPlan] = useState<SubscriptionPlanTier>('Professional');

  const handleStartEdit = (shop: TenantContext) => {
    setEditingShopId(shop.id);
    setEditName(shop.businessName);
    setEditAddress(shop.branchAddress || '');
    setEditSubdomain(shop.subdomain || '');
    setEditContactEmail(shop.contactEmail || shop.ownerEmail || '');
    setEditMobileNumber(shop.mobileNumber || '');
    setEditIsWhatsAppAvailable(shop.isWhatsAppAvailable !== false);
    setEditWhatsappNumber(shop.whatsappNumber || shop.mobileNumber || '');
    setEditCurrency(shop.currency || 'USD');
    setEditTimezone(shop.timezone || 'America/New_York');
    setEditPlan(shop.plan || 'Professional');
    setErrorMsg(null);
  };

  const handleSaveEdit = async (shop: TenantContext) => {
    if (!editName.trim()) {
      setErrorMsg('Shop name cannot be empty.');
      return;
    }
    setActionProcessingId(shop.id);
    try {
      await dbService.updateTenantShopProfile(shop.id, {
        businessName: editName.trim(),
        branchAddress: editAddress.trim(),
        subdomain: editSubdomain.trim(),
        contactEmail: editContactEmail.trim(),
        mobileNumber: editMobileNumber.trim(),
        isWhatsAppAvailable: editIsWhatsAppAvailable,
        whatsappNumber: (editIsWhatsAppAvailable && editWhatsappNumber.trim()) ? editWhatsappNumber.trim() : editMobileNumber.trim(),
        currency: editCurrency,
        timezone: editTimezone,
        plan: editPlan
      });
      posAudio.playSuccessChime();
      setActionSuccessMsg(`Shop profile for "${editName.trim()}" updated successfully.`);
      setEditingShopId(null);
      if (onShopUpdated) await onShopUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update shop details.');
    } finally {
      setActionProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Multi-Shop Branch Manager
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tenant: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeTenant.tenantName}</strong> • {myShops.length} Registered Shop{myShops.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Create New Shop</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Manage Shops (Hold / Delete)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {myShops.length}
            </span>
          </button>
        </div>

        {/* Notifications & Status Alerts */}
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {actionSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Tab 1: Create New Shop */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Same Credentials Notice */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3 text-xs">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Same Credentials Shop Navigation
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  This shop is registered under your account (<span className="font-mono font-semibold">{currentUser?.email || activeTenant.contactEmail}</span>). Only shops with your verified credentials will appear in the shop navigation.
                </p>
              </div>
            </div>

            {/* Shop Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Shop / Branch Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Uptown Espresso Bar & Roastery"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Physical Address / Branch Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Location / Branch Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={branchAddress}
                  onChange={e => setBranchAddress(e.target.value)}
                  placeholder="e.g. 520 Madison Ave, Manhattan, NY"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Subdomain & Currency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subdomain Identifier
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value)}
                    placeholder="uptown-espresso"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency & Region
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                    <option value="KES">KES (KSh) - Kenyan Shilling</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Plan Tier Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Branch Configuration Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Starter', 'Professional', 'Enterprise'] as SubscriptionPlanTier[]).map(tier => (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => setPlan(tier)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      plan === tier
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{tier}</span>
                      {plan === tier && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      {tier === 'Starter' ? '4 Terminals' : tier === 'Professional' ? '8 Terminals' : '25 Terminals'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* User Choice: Hold Shop vs Activate Now */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Subscription Activation & Hold Options</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Hold Shop Option */}
                <div 
                  onClick={() => setSubscriptionChoice('hold')}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition ${
                    subscriptionChoice === 'hold'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PauseCircle className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs">Hold Shop (Save for Later)</span>
                    </div>
                    <input 
                      type="radio" 
                      name="subChoice" 
                      checked={subscriptionChoice === 'hold'} 
                      onChange={() => setSubscriptionChoice('hold')} 
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Preserves your shop configuration, catalog, and settings on hold. You can subscribe and activate it later whenever you choose.
                  </p>
                </div>

                {/* Activate Now Option */}
                <div 
                  onClick={() => setSubscriptionChoice('activate')}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition ${
                    subscriptionChoice === 'activate'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-950 dark:text-blue-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs">Activate Immediately</span>
                    </div>
                    <input 
                      type="radio" 
                      name="subChoice" 
                      checked={subscriptionChoice === 'activate'} 
                      onChange={() => setSubscriptionChoice('activate')} 
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Activates full POS read/write privileges and module access under your subscription license immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Store className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating...' : subscriptionChoice === 'hold' ? 'Create & Hold Shop' : 'Create & Activate Shop'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manage Existing Shops (Hold / Delete / Switch) */}
        {activeTab === 'manage' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Your Registered Shops ({myShops.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your shop fleet. Put non-subscribed shops on hold to save them for later, or delete unwanted shop branches.
              </p>
            </div>

            <div className="space-y-2.5">
              {myShops.map(shop => {
                const isCurrent = shop.id === activeTenant.id;
                const isSub = shop.isSubscribed && shop.status !== 'unsubscribed';
                const isOnHold = shop.status === 'unsubscribed' || shop.status === 'suspended';

                return (
                  <div
                    key={shop.id}
                    className={`p-4 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {shop.businessName}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              Active Workspace
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{shop.branchAddress || 'Main Branch'}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{shop.subdomain}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{shop.plan} Plan</span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          {isSub ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                              <Check className="w-3 h-3" />
                              <span>Subscribed & Active</span>
                            </span>
                          ) : isOnHold ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 font-bold">
                              <PauseCircle className="w-3 h-3" />
                              <span>On Hold (Held for Later)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              <span>Trial / Standby</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Edit Shop Details */}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingShopId === shop.id) {
                              setEditingShopId(null);
                            } else {
                              handleStartEdit(shop);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            editingShopId === shop.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                          }`}
                          title="Edit shop details, address and subdomain"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{editingShopId === shop.id ? 'Close' : 'Edit'}</span>
                        </button>

                        {/* Switch to Shop button */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectShop) onSelectShop(shop);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                          >
                            Switch To
                          </button>
                        )}

                        {/* Hold / Resume Button */}
                        <button
                          type="button"
                          disabled={actionProcessingId === shop.id}
                          onClick={() => handleToggleHoldShop(shop)}
                          title={isSub ? 'Put shop on hold if not subscribed now' : 'Activate and subscribe shop'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                            isSub
                              ? 'bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {isSub ? (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Hold Shop</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* Delete Shop Button */}
                        {deletingShopId === shop.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 p-1 rounded-lg border border-rose-200 dark:border-rose-800">
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold px-1">Confirm delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteShop(shop)}
                              disabled={actionProcessingId === shop.id}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingShopId(null)}
                              className="px-1.5 py-1 rounded text-slate-500 hover:text-slate-700 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingShopId(shop.id)}
                            title="Delete this shop branch permanently"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Shop Profile Editor */}
                    {editingShopId === shop.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/60 dark:bg-slate-900/40 p-3.5 rounded-xl animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Edit Shop Details ({shop.businessName})</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {shop.id}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Business / Shop Name
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Branch Physical Address
                            </label>
                            <input
                              type="text"
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Subdomain Slug
                            </label>
                            <input
                              type="text"
                              value={editSubdomain}
                              onChange={(e) => setEditSubdomain(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-blue-500" />
                                <span>Official Business / Account Login Email</span>
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">Login Credentials</span>
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. owner@business.com (Used for store login credentials)"
                              value={editContactEmail}
                              onChange={(e) => setEditContactEmail(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              When saved, this email becomes your store's authenticated business login credential and syncs across all user accounts.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-amber-500" />
                                <span>Essential Mobile Number</span>
                              </span>
                              <span className="text-amber-500 text-[10px] font-bold">Essential</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. +1 555-019-2834"
                              value={editMobileNumber}
                              onChange={(e) => setEditMobileNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="w-3 h-3 text-emerald-500" />
                                <span>WhatsApp Communication</span>
                              </span>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsWhatsAppAvailable}
                                  onChange={(e) => setEditIsWhatsAppAvailable(e.target.checked)}
                                  className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300"
                                />
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Available</span>
                              </label>
                            </label>
                            <input
                              type="tel"
                              disabled={!editIsWhatsAppAvailable}
                              placeholder={editMobileNumber || "WhatsApp Number (defaults to mobile)"}
                              value={editWhatsappNumber}
                              onChange={(e) => setEditWhatsappNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Currency
                            </label>
                            <select
                              value={editCurrency}
                              onChange={(e) => setEditCurrency(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="USD">USD ($ - US Dollar)</option>
                              <option value="EUR">EUR (€ - Euro)</option>
                              <option value="GBP">GBP (£ - British Pound)</option>
                              <option value="CAD">CAD ($ - Canadian Dollar)</option>
                              <option value="AUD">AUD ($ - Australian Dollar)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Plan Tier
                            </label>
                            <select
                              value={editPlan}
                              onChange={(e) => setEditPlan(e.target.value as SubscriptionPlanTier)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="Starter">Starter ($99/mo)</option>
                              <option value="Growth">Growth ($179/mo)</option>
                              <option value="Professional">Professional ($299/mo)</option>
                              <option value="Enterprise">Enterprise ($499/mo)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingShopId(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={actionProcessingId === shop.id}
                            onClick={() => handleSaveEdit(shop)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{actionProcessingId === shop.id ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                How Shop Hold Works:
              </p>
              <p className="mt-1 leading-relaxed text-[11px]">
                Placing a shop on hold retains its items, customer tickets, and settings in Firestore without active subscription billing. You can reactivate the shop whenever you are ready to resume operations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
