import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Activity, 
  CreditCard, 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Smartphone, 
  Monitor, 
  Globe, 
  Database, 
  RefreshCw, 
  Sliders, 
  KeyRound, 
  ArrowUpRight,
  Filter,
  Check,
  X,
  Radio,
  FileSpreadsheet,
  Lock,
  ShieldAlert,
  QrCode,
  Mail,
  Send,
  Phone,
  MessageCircle
} from 'lucide-react';
import { TenantContext, TerminalDevice, HivePlatformMetrics, User, ModuleControlConfig, SystemAuditLog, DeviceInvite, isSystemHostUser } from '../../types';
import { dbService, subscribeToSyncEvents } from '../../services/db';
import { TenantSubscriptionConfigModal } from '../hive/TenantSubscriptionConfigModal';
import { SUBSCRIPTION_PLAN_TIERS, calculateStandaloneValue, MODULE_DEFINITIONS } from '../../data/subscriptionPlans';
import { HiveCentralBackupManager } from '../hive/HiveCentralBackupManager';
import { SubscriptionPackagesManager } from '../hive/SubscriptionPackagesManager';
import { MultiTenantConcurrencyLab } from '../hive/MultiTenantConcurrencyLab';
import { HiveCommunicationsHub } from '../hive/HiveCommunicationsHub';

interface HiveMasterWorkspaceProps {
  currentUser: User | null;
  onSelectTenant?: (tenant: TenantContext) => void;
  onExitHive?: () => void;
}

export const HiveMasterWorkspace: React.FC<HiveMasterWorkspaceProps> = ({
  currentUser,
  onSelectTenant,
  onExitHive
}) => {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'modules' | 'users' | 'fleet' | 'security' | 'backups' | 'packages' | 'scalability' | 'communications'>('onboarding');
  const [selectedCommTenantId, setSelectedCommTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantContext[]>([]);
  const [terminals, setTerminals] = useState<TerminalDevice[]>([]);
  const [invites, setInvites] = useState<DeviceInvite[]>([]);
  const [metrics, setMetrics] = useState<HivePlatformMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');

  // Modal: Onboard New Tenant
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Professional' | 'Enterprise'>('Professional');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newIsWhatsAppAvailable, setNewIsWhatsAppAvailable] = useState(true);
  const [newWhatsappNumber, setNewWhatsappNumber] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newQuota, setNewQuota] = useState(8);

  // Subscription Configuration Modal
  const [subscriptionConfigTenant, setSubscriptionConfigTenant] = useState<TenantContext | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tList, termList, met, uList, logs, invList] = await Promise.all([
        dbService.getTenants(),
        dbService.getTerminals(),
        dbService.getHivePlatformMetrics(),
        dbService.getUsers(),
        dbService.getAuditLogs(),
        dbService.getDeviceInvites()
      ]);
      setTenants(tList);
      setTerminals(termList);
      setMetrics(met);
      setUsers(uList);
      setAuditLogs(logs.slice(-20).reverse());
      setInvites(invList);
    } catch (e) {
      console.warn('Failed to load Hive Master data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToSyncEvents(() => {
      loadData();
    });
    return unsub;
  }, [currentUser]);

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = !searchQuery || 
      t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Module Toggle for a Tenant
  const handleToggleModule = async (tenant: TenantContext, moduleKey: keyof ModuleControlConfig) => {
    if (!currentUser || !isSystemHostUser(currentUser)) {
      alert('Survey Mode: Hive Master modifications require System Host authentication. Changes cannot be saved to the database.');
      return;
    }
    const updatedModules = {
      ...tenant.enabledModules,
      [moduleKey]: !tenant.enabledModules[moduleKey]
    };
    await dbService.updateTenantModuleControl(tenant.id, updatedModules);
    await loadData();
  };

  // Quick Preset Applier for Tenant
  const handleApplyPlanPreset = async (tenant: TenantContext, tier: 'Starter' | 'Professional' | 'Enterprise') => {
    if (!currentUser || !isSystemHostUser(currentUser)) {
      alert('Survey Mode: Hive Master modifications require System Host authentication. Changes cannot be saved to the database.');
      return;
    }
    const config = SUBSCRIPTION_PLAN_TIERS[tier];
    if (!config) return;
    await dbService.updateTenantSubscription(tenant.id, {
      plan: tier,
      monthlyFee: config.monthlyFee,
      terminalQuota: config.terminalQuota,
      enabledModules: { ...config.defaultModules }
    });
    await loadData();
  };

  // Save full subscription configuration from modal
  const handleSaveSubscription = async (updated: TenantContext) => {
    if (!currentUser || !isSystemHostUser(currentUser)) {
      alert('Survey Mode: Hive Master modifications require System Host authentication. Changes cannot be saved to the database.');
      return;
    }
    await dbService.updateTenantSubscription(updated.id, {
      enabledModules: updated.enabledModules,
      enabledSubmodules: updated.enabledSubmodules,
      monthlyFee: updated.monthlyFee,
      plan: updated.plan,
      status: updated.status,
      terminalQuota: updated.terminalQuota,
      billingCycle: updated.billingCycle,
      contractId: updated.contractId,
      subscriptionNotes: updated.subscriptionNotes,
      expiresAt: updated.expiresAt
    });
    setSubscriptionConfigTenant(null);
    await loadData();
  };

  // Submit New Tenant Onboarding
  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSystemHostUser(currentUser)) {
      alert('Survey Mode: Provisioning new tenants requires System Host authentication.');
      return;
    }
    if (!newTenantName.trim() || !newBusinessName.trim() || !newSubdomain.trim()) {
      alert('Please enter Company Name, Flagship Branch Name, and Subdomain.');
      return;
    }
    if (!newMobileNumber.trim()) {
      alert('Mobile number is essential for communication and messaging.');
      return;
    }

    const slug = newSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanTenantId = `tenant_${slug.replace(/-/g, '_')}`;
    const cleanBusinessId = `biz_${slug.replace(/-/g, '_')}_main`;
    const cleanEmail = newContactEmail.trim();

    // Hive can choose any number for terminal quota
    const finalQuota = Math.max(1, parseInt(String(newQuota), 10) || 1);
    const monthlyFee = newPlan === 'Enterprise' ? 599 : newPlan === 'Professional' ? 299 : 149;

    const newTenant: TenantContext = {
      id: `ten-${Date.now()}`,
      tenantId: cleanTenantId,
      tenantName: newTenantName.trim(),
      businessId: cleanBusinessId,
      businessName: newBusinessName.trim(),
      subdomain: `${slug}.bluenilla.com`,
      plan: newPlan,
      status: 'active',
      isSubscribed: true,
      createdAt: new Date().toISOString().split('T')[0],
      // Email is optional, editable later by tenant in his profile. When given, used as business email for login creds.
      contactEmail: cleanEmail,
      ownerEmail: cleanEmail,
      mobileNumber: newMobileNumber.trim(),
      isWhatsAppAvailable: newIsWhatsAppAvailable,
      whatsappNumber: (newIsWhatsAppAvailable && newWhatsappNumber.trim()) ? newWhatsappNumber.trim() : newMobileNumber.trim(),
      currency: newCurrency,
      timezone: 'America/New_York',
      enabledModules: {
        sales: true,
        storeroom: true,
        accounts: newPlan !== 'Starter',
        hr: newPlan === 'Enterprise',
        manager: true,
        it: newPlan === 'Enterprise'
      },
      monthlyFee,
      terminalQuota: finalQuota,
      activeTerminalsCount: 1,
      databaseCluster: 'mysql-cluster-us-east-prod-01'
    };

    // Auto-create initial primary register terminal for this tenant
    const newTerminal: TerminalDevice = {
      id: `term-${Date.now()}`,
      terminalCode: 'REG-01',
      name: `${newBusinessName.trim()} Main Till`,
      tenantId: cleanTenantId,
      businessId: cleanBusinessId,
      businessName: newBusinessName.trim(),
      deviceType: 'desktop',
      operatingSystem: 'Windows 11 POSReady',
      ipAddress: '192.168.1.10',
      appVersion: 'v2.4.2-hybrid',
      status: 'online',
      lastHeartbeat: 'Just now',
      unprocessedQueueCount: 0,
      isRegistered: true
    };

    // Provision default store owner account
    const ownerUser: User = {
      id: `usr-${Date.now()}-owner`,
      name: `${newBusinessName.trim()} Owner`,
      email: cleanEmail || `${slug}.owner@bluenilla.local`,
      role: 'business_owner',
      userCategory: 'business_owner',
      workspace: 'back_office',
      tenantId: cleanTenantId,
      branchId: 'br-main',
      branchName: 'Main Store',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      pin: '1234',
      biometricRegistered: false,
      permissions: ['all', 'manager', 'inventory', 'reports', 'settings', 'pos_access'],
      lastLogin: new Date().toISOString()
    };

    await dbService.saveTenant(newTenant);
    await dbService.saveTerminal(newTerminal);
    await dbService.saveUser(ownerUser);

    // Initial Welcome Communication dispatched via in-app, SMS, WhatsApp and email
    try {
      await dbService.sendTenantCommunication({
        tenantId: cleanTenantId,
        tenantName: newBusinessName.trim(),
        recipientEmail: cleanEmail || undefined,
        recipientPhone: newMobileNumber.trim(),
        recipientWhatsApp: newIsWhatsAppAvailable ? (newWhatsappNumber.trim() || newMobileNumber.trim()) : undefined,
        senderRole: 'hive_master',
        senderName: currentUser?.name || 'Hive Master Host',
        senderEmail: currentUser?.email || 'aqutewavedev@gmail.com',
        subject: `Welcome to BlueNilla POS Platform - ${newBusinessName.trim()}`,
        message: `Welcome to your dedicated workspace!\n\nYour till fleet has been allocated ${finalQuota} terminals by Hive Master.\nEssential Mobile: ${newMobileNumber.trim()}${newIsWhatsAppAvailable ? ' (WhatsApp enabled)' : ''}.\n${cleanEmail ? `Business Login Email: ${cleanEmail}` : 'Business Email: Not yet provided. You can update this anytime in your shop profile, and it will serve as your primary login email.'}`,
        channel: 'all',
        priority: 'normal'
      });
    } catch (err) {
      console.warn('Initial communication error:', err);
    }

    await dbService.logAudit({
      userId: currentUser?.email || 'hive_master',
      userName: currentUser?.name || 'System Host Admin',
      workspace: 'hive_master',
      action: 'Tenant Provisioned',
      details: `Provisioned tenant ${newBusinessName.trim()} (${cleanTenantId}). Quota: ${finalQuota} terminals. Mobile: ${newMobileNumber.trim()}, WhatsApp: ${newIsWhatsAppAvailable ? 'Enabled' : 'Disabled'}, Business Email: ${cleanEmail || 'Optional (pending profile setup)'}`,
      severity: 'info'
    });

    setShowOnboardModal(false);
    // Reset form
    setNewTenantName('');
    setNewBusinessName('');
    setNewSubdomain('');
    setNewContactEmail('');
    setNewMobileNumber('');
    setNewIsWhatsAppAvailable(true);
    setNewWhatsappNumber('');
    setNewQuota(8);
    await loadData();
  };

  // ACCESS CONTROL GATE: The Hive is accessible by system host users only
  if (!isSystemHostUser(currentUser)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 select-none">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/80">
              Access Restricted
            </span>
            <h2 className="text-lg font-extrabold text-white mt-2">
              System Host Authorization Required
            </h2>
            <p className="text-xs text-amber-400/90 font-mono mt-1">
              THE HIVE IS ACCESSIBLE BY SYSTEM HOST USERS ONLY
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            You are currently signed in as <strong className="text-slate-200">{currentUser.name}</strong> (<span className="capitalize">{currentUser.role.replace('_', ' ')}</span>). The Hive Control Plane is reserved for cloud platform host administrators.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Access Hierarchy</div>
            <div className="text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Hive Control:</span>
              <span className="text-amber-400 font-bold">System Host Users Only</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Tenant Business:</span>
              <span className="text-indigo-400 font-bold">Business Owners</span>
            </div>
            <div className="text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Terminals / POS:</span>
              <span className="text-emerald-400 font-bold">Invited by Tenant Owner</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onExitHive) onExitHive();
              else if (onSelectTenant && tenants.length > 0) onSelectTenant(tenants[0]);
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30"
          >
            Return to Business Tenant Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 select-none">
      
      {/* 1. HIVE MASTER OPERATIONAL BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Server className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  BLUENILLA HIVE MASTER
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/80">
                  Global Control Plane
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Tenant Provisioning • Feature Gating • Terminal Fleet Monitoring • Redis Queue
              </p>
            </div>
          </div>

          {/* Platform Operational Pulse Metrics */}
          {metrics && (
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Tenants</div>
                  <div className="text-sm font-extrabold font-mono text-white">{metrics.totalTenants}</div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Fleet Online</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400">
                    {metrics.onlineTerminals} / {metrics.totalTerminals}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Redis Queue</div>
                  <div className="text-sm font-extrabold font-mono text-amber-400">{metrics.redisQueueDepth} items</div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">MRR Total</div>
                  <div className="text-sm font-extrabold font-mono text-sky-400">${metrics.mrrTotal}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs for Hive Master Operations */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'onboarding'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>HM1: Tenant Onboarding ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'modules'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>HM2: Module Gating</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>HM3: User Access & RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'fleet'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>HM4: Terminal Fleet & Sync Health</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HM5: Security & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'backups'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>HM6: Central Backups & Alignment</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>HM7: Pricing Packs & CRUD</span>
          </button>

          <button
            onClick={() => setActiveTab('scalability')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'scalability'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>HM8: Concurrency & Alerts Lab</span>
          </button>

          <button
            onClick={() => {
              setSelectedCommTenantId(null);
              setActiveTab('communications');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'communications'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>HM9: Tenant Communications & Emails</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE VIEW ROUTING */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        
        {/* =========================================================
            TAB 1: HM1 BUSINESS & TENANT ONBOARDING
            ========================================================= */}
        {activeTab === 'onboarding' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registered Business Tenants
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tenant contexts partitioned by <code className="text-amber-400 font-mono">tenant_id</code> and <code className="text-amber-400 font-mono">business_id</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tenant or subdomain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => setShowOnboardModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard New Tenant</span>
                </button>
              </div>
            </div>

            {/* Tenants Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTenants.map(t => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{t.tenantName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            t.status === 'active' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                              : t.status === 'trial'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{t.businessName}</p>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 text-xs font-mono font-bold border border-indigo-800">
                        {t.plan} Plan
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">SUBDOMAIN</span>
                        <span className="text-slate-200 font-bold truncate block">{t.subdomain}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">DATABASE CLUSTER</span>
                        <span className="text-slate-200 font-bold truncate block">{t.databaseCluster}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">TENANT ID</span>
                        <span className="text-amber-400 font-bold truncate block">{t.tenantId}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block flex items-center justify-between">
                          <span>TERMINAL FLEET</span>
                          <span className="text-amber-400 text-[9px] font-bold">CUSTOM LIMIT</span>
                        </span>
                        <span className="text-slate-200 font-bold truncate block">{t.activeTerminalsCount} / {t.terminalQuota} Active</span>
                      </div>
                    </div>

                    {/* Contact & Credentials Details */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Essential Mobile */}
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono text-[11px] font-bold">
                            {t.mobileNumber || <span className="text-slate-500 italic">No phone provided</span>}
                          </span>
                        </div>

                        {/* WhatsApp indicator */}
                        <div className="flex items-center gap-1">
                          <MessageCircle className={`w-3.5 h-3.5 ${t.isWhatsAppAvailable !== false ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            t.isWhatsAppAvailable !== false
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}>
                            {t.isWhatsAppAvailable !== false ? 'WhatsApp Active' : 'No WhatsApp'}
                          </span>
                        </div>

                        {/* Business Login Email */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-mono">
                            {t.contactEmail || t.ownerEmail ? (
                              <span className="text-slate-200 font-medium">
                                {t.contactEmail || t.ownerEmail} <span className="text-[10px] text-indigo-400 font-bold">(Login Creds)</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">Email optional (editable in profile)</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Direct WhatsApp / SMS action buttons */}
                      {t.mobileNumber && (
                        <div className="flex items-center gap-1.5">
                          {t.isWhatsAppAvailable !== false && (
                            <a
                              href={`https://wa.me/${(t.whatsappNumber || t.mobileNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${t.businessName}, this is Hive Master regarding your store operations.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold border border-emerald-800 transition flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <a
                            href={`sms:${t.mobileNumber}`}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700 transition flex items-center gap-1"
                            title="Send SMS to Mobile"
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>SMS</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">
                        Billing: <strong className="text-white">${t.monthlyFee}/mo</strong>
                      </span>
                      <button
                        onClick={() => setSubscriptionConfigTenant(t)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 transition flex items-center gap-1"
                        title="Configure modules permitted based on subscription fee paid"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Modules & Fee</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCommTenantId(t.id);
                          setActiveTab('communications');
                        }}
                        className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition flex items-center gap-1 text-[11px] font-bold"
                        title={`Send message or email to ${t.businessName} (${t.ownerEmail || t.contactEmail})`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>

                      {onSelectTenant && (
                        <button
                          onClick={() => onSelectTenant(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
                        >
                          <span>Launch Tenant Context</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: HM2 MODULE CONTROL & SUBSCRIPTION PRICING GATING
            ========================================================= */}
        {activeTab === 'modules' && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Top Header & Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Total Monthly Recurring Revenue
                </div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  ${tenants.filter(t => t.status === 'active' || t.status === 'trial').reduce((sum, t) => sum + (t.monthlyFee || 0), 0).toLocaleString()}
                  <span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>Across {tenants.length} commercial business tenants</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Average Tenant Subscription
                </div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  ${tenants.length ? Math.round(tenants.reduce((s, t) => s + (t.monthlyFee || 0), 0) / tenants.length) : 0}
                  <span className="text-xs text-slate-500 font-normal">/tenant</span>
                </div>
                <div className="text-[10px] text-indigo-400 mt-1">
                  Subscription tier packaging
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Standalone Value Delivered
                </div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  ${tenants.reduce((s, t) => s + calculateStandaloneValue(t.enabledModules), 0).toLocaleString()}
                  <span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-1">
                  Catalog value of enabled modules
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Active Terminal Quota
                </div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  {tenants.reduce((s, t) => s + (t.activeTerminalsCount || 0), 0)} / {tenants.reduce((s, t) => s + (t.terminalQuota || 0), 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Registered tills across fleet
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Tenant Module Access & Subscription Fee Gating</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    CENTRALIZED HIVE ENGINE
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The Hive Master Platform Host controls which of the 6 core modules each tenant can access according to subscription fees paid.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Available Tiers:</span>
                {(['Starter', 'Professional', 'Enterprise'] as const).map(tier => (
                  <span key={tier} className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {tier} (${SUBSCRIPTION_PLAN_TIERS[tier].monthlyFee}/mo)
                  </span>
                ))}
              </div>
            </div>

            {/* Tenant Cards with Full Subscription Controls */}
            <div className="space-y-4">
              {tenants.map(t => {
                const standalone = calculateStandaloneValue(t.enabledModules);
                const activeCount = Object.values(t.enabledModules).filter(Boolean).length;
                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-base font-bold text-white">{t.tenantName}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {t.subdomain}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                            t.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                            t.status === 'trial' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                            t.status === 'past_due' ? 'bg-orange-950 text-orange-400 border-orange-800' :
                            'bg-rose-950 text-rose-400 border-rose-800'
                          }`}>
                            {t.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                            {t.plan} Tier
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.businessName} • Contract: <strong className="text-slate-300">{t.contractId || `SUB-${t.tenantId.toUpperCase().slice(-6)}`}</strong>
                        </p>
                      </div>

                      {/* Financial summary & Action */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400 uppercase">
                            Subscription Fee Paid
                          </div>
                          <div className="text-base font-extrabold text-white font-mono flex items-center justify-end gap-1.5">
                            <span className="text-emerald-400">${t.monthlyFee}</span>
                            <span className="text-xs font-normal text-slate-400">/mo</span>
                            <span className="text-[10px] text-slate-500 font-normal line-through">
                              (${standalone} val)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSubscriptionConfigTenant(t)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                        >
                          <Sliders className="w-3.5 h-3.5 font-bold" />
                          <span>Configure Subscription & Fee</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets & 6 Interactive Module Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                          <span>Active Modules ({activeCount}/6 unlocked):</span>
                        </span>

                        {/* Quick Plan Preset Buttons */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500">Apply Preset:</span>
                          <button
                            onClick={() => handleApplyPlanPreset(t, 'Starter')}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border transition ${
                              t.plan === 'Starter' ? 'bg-sky-500 text-slate-950 font-bold border-sky-500' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            Starter ($149)
                          </button>
                          <button
                            onClick={() => handleApplyPlanPreset(t, 'Professional')}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border transition ${
                              t.plan === 'Professional' ? 'bg-indigo-600 text-white font-bold border-indigo-600' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            Pro ($299)
                          </button>
                          <button
                            onClick={() => handleApplyPlanPreset(t, 'Enterprise')}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border transition ${
                              t.plan === 'Enterprise' ? 'bg-amber-500 text-slate-950 font-bold border-amber-500' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            Enterprise ($599)
                          </button>
                        </div>
                      </div>

                      {/* 6 Core Business Modules Switcher */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {MODULE_DEFINITIONS.map(mod => {
                          const isEnabled = t.enabledModules[mod.key];
                          return (
                            <button
                              key={mod.key}
                              onClick={() => handleToggleModule(t, mod.key)}
                              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col justify-between text-left transition relative ${
                                isEnabled
                                  ? 'bg-indigo-950/80 border-indigo-600 text-indigo-200 shadow-xs'
                                  : 'bg-slate-950/70 border-slate-800 text-slate-500 hover:border-slate-700 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-xs text-white">{mod.name.split(' ')[0]}</span>
                                {isEnabled ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
                                ) : (
                                  <Lock className="w-3 h-3 text-slate-600" />
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>${mod.standaloneMonthlyFee}/mo</span>
                                <span className={isEnabled ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                                  {isEnabled ? 'Active' : 'Gated'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: HM3 USER ACCESS MANAGEMENT & RBAC
            ========================================================= */}
        {activeTab === 'users' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Platform-Wide RBAC Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Users mapped to their respective business workspaces and security roles.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                {users.length} Total Users
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3.5 bg-slate-950 text-[11px] font-mono font-bold text-slate-400 uppercase border-b border-slate-800">
                <div className="col-span-4">Operator / Email</div>
                <div className="col-span-3">Role & Workspace</div>
                <div className="col-span-3">Assigned Business</div>
                <div className="col-span-2 text-right">Biometrics</div>
              </div>

              <div className="divide-y divide-slate-800/80 text-xs font-mono">
                {users.map(u => (
                  <div key={u.id} className="grid grid-cols-12 gap-2 p-3.5 items-center hover:bg-slate-800/30 transition">
                    <div className="col-span-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      <div>
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="col-span-3 text-slate-300 truncate">
                      {u.branchName}
                    </div>

                    <div className="col-span-2 text-right">
                      {u.biometricRegistered ? (
                        <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">PIN Only</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: HM4 TERMINAL FLEET & SYNC HEALTH MONITORING
            ========================================================= */}
        {activeTab === 'fleet' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Terminal Fleet Health & Redis Queue Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time register till heartbeats, offline cache queues, and cross-platform instances.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ping Fleet</span>
                </button>
              </div>
            </div>

            {/* Terminals Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3.5 bg-slate-950 text-[11px] font-mono font-bold text-slate-400 uppercase border-b border-slate-800">
                <div className="col-span-3">Terminal Code & Name</div>
                <div className="col-span-3">Business & IP</div>
                <div className="col-span-2">Platform / OS</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Offline Queue</div>
              </div>

              <div className="divide-y divide-slate-800/80 text-xs font-mono">
                {terminals.map(term => (
                  <div key={term.id} className="grid grid-cols-12 gap-2 p-3.5 items-center hover:bg-slate-800/30 transition">
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 font-extrabold text-amber-400">
                          {term.terminalCode}
                        </span>
                        <span className="font-bold text-white truncate">{term.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Heartbeat: {term.lastHeartbeat}</span>
                    </div>

                    <div className="col-span-3">
                      <div className="text-slate-300 truncate">{term.businessName}</div>
                      <div className="text-[10px] text-slate-500">{term.ipAddress}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-slate-200 uppercase font-bold flex items-center gap-1.5">
                        {term.deviceType === 'android' ? (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{term.deviceType}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{term.operatingSystem}</div>
                    </div>

                    <div className="col-span-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        term.status === 'online'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : term.status === 'syncing'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800 animate-pulse'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          term.status === 'online' ? 'bg-emerald-400' : term.status === 'syncing' ? 'bg-sky-400' : 'bg-rose-400'
                        }`} />
                        <span>{term.status}</span>
                      </span>
                      {term.batteryLevel !== undefined && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">Battery: {term.batteryLevel}%</span>
                      )}
                    </div>

                    <div className="col-span-2 text-right">
                      {term.unprocessedQueueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800">
                          {term.unprocessedQueueCount} Pending
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">Synchronized</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant Device Invitations Overview */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mt-4">
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Tenant-Issued Device Invitations & Pairing Tokens
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {invites.length} Total Issued
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2 p-3 bg-slate-950/80 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-slate-800">
                <div className="col-span-3">Pairing Code & Register</div>
                <div className="col-span-3">Tenant Business</div>
                <div className="col-span-2">Platform</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Validity</div>
              </div>

              <div className="divide-y divide-slate-800/80 text-xs font-mono">
                {invites.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No device invitations generated yet across tenants.
                  </div>
                ) : (
                  invites.map(inv => (
                    <div key={inv.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-slate-800/30 transition">
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 font-extrabold text-indigo-400">
                            {inv.inviteCode}
                          </span>
                          <span className="font-bold text-white truncate">{inv.terminalName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Code: {inv.terminalCode}</span>
                      </div>

                      <div className="col-span-3">
                        <div className="text-slate-200 font-semibold truncate">{inv.businessName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{inv.branchName}</div>
                      </div>

                      <div className="col-span-2 capitalize text-slate-300">
                        {inv.deviceType}
                      </div>

                      <div className="col-span-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          inv.status === 'pending'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : inv.status === 'paired'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          <span>{inv.status}</span>
                        </span>
                      </div>

                      <div className="col-span-2 text-right text-slate-400 text-[10px]">
                        {inv.expiresAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: HM5 SECURITY & BILLING
            ========================================================= */}
        {activeTab === 'security' && (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-mono text-slate-400">TOTAL PLATFORM MRR</span>
                <p className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
                  ${metrics?.mrrTotal || 0}.00
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Automated Stripe & Wire billing cycle on 1st</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-mono text-slate-400">DATABASE HEALTH (MYSQL)</span>
                <p className="text-2xl font-mono font-extrabold text-indigo-400 mt-1">
                  {metrics?.databaseLatencyMs || 14} ms
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Replication lag: 0.00s across 3 nodes</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-mono text-slate-400">REDIS QUEUE LATENCY</span>
                <p className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
                  &lt; 2 ms
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Pub/Sub event bus for live till broadcasts</p>
              </div>
            </div>

            {/* Platform Security Audit Logs */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Hive Platform Security & Audit Event Stream
              </h3>
              <div className="divide-y divide-slate-800/80 font-mono text-xs">
                {auditLogs.map(log => (
                  <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                          log.severity === 'critical' ? 'bg-rose-950 text-rose-400' :
                          log.severity === 'warning' ? 'bg-amber-950 text-amber-400' :
                          'bg-indigo-950 text-indigo-400'
                        }`}>
                          {log.severity || 'info'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                    </div>

                    <div className="text-right text-slate-500 text-[10px]">
                      <span>{log.userName || 'System'}</span> • {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 6: HM6 HIVE CENTRAL BACKUPS & MASTER ALIGNMENT
            ========================================================= */}
        {activeTab === 'backups' && (
          <div className="max-w-6xl mx-auto">
            <HiveCentralBackupManager currentUser={currentUser} />
          </div>
        )}

        {/* =========================================================
            TAB 7: HM7 SUBSCRIPTION PRICING PACKAGES CRUD
            ========================================================= */}
        {activeTab === 'packages' && (
          <div className="max-w-6xl mx-auto">
            <SubscriptionPackagesManager 
              tenants={tenants} 
              onTenantUpdated={loadData} 
            />
          </div>
        )}

        {/* =========================================================
            TAB 8: HM8 MULTI-TENANT CONCURRENCY & ALERTS LAB
            ========================================================= */}
        {activeTab === 'scalability' && (
          <div className="max-w-6xl mx-auto">
            <MultiTenantConcurrencyLab 
              tenants={tenants} 
              onTenantUpdated={loadData} 
            />
          </div>
        )}

        {/* =========================================================
            TAB 9: HM9 HIVE-TENANT COMMUNICATIONS & ACCOUNT EMAILS
            ========================================================= */}
        {activeTab === 'communications' && (
          <div className="max-w-6xl mx-auto">
            <HiveCommunicationsHub
              tenants={tenants}
              currentUser={currentUser}
              onRefreshTenants={loadData}
              preselectedTenantId={selectedCommTenantId}
            />
          </div>
        )}
      </div>

      {/* MODAL: ONBOARD NEW TENANT */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Onboard New Business Tenant</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Tenant Legal Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hospitality Group Inc"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Primary Business / Flagship Branch</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Central Bistro"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subdomain Slug</label>
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 px-3">
                    <input
                      type="text"
                      required
                      placeholder="apex"
                      value={newSubdomain}
                      onChange={(e) => setNewSubdomain(e.target.value)}
                      className="w-full py-2 bg-transparent text-white focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">.bluenilla.com</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Subscription Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Starter">Starter ($149/mo)</option>
                    <option value="Professional">Professional ($299/mo)</option>
                    <option value="Enterprise">Enterprise ($599/mo)</option>
                  </select>
                </div>
              </div>

              {/* Primary Contact: Mobile Number (Essential) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mobile Number <span className="text-amber-400 font-normal">(Essential for Communication & SMS)</span></span>
                  </span>
                  <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider">Required</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-019-2834"
                  value={newMobileNumber}
                  onChange={(e) => setNewMobileNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Essential telephone number used by Hive to reach tenant via SMS, mobile, and live direct communication.
                </p>
              </div>

              {/* WhatsApp Messaging Settings */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newIsWhatsAppAvailable}
                      onChange={(e) => setNewIsWhatsAppAvailable(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Optionally also available on WhatsApp for messaging</span>
                    </span>
                  </label>
                </div>
                {newIsWhatsAppAvailable && (
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      WhatsApp Number <span className="text-slate-500">(Optional — leave blank to use mobile number)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder={newMobileNumber || "+1 555-019-2834"}
                      value={newWhatsappNumber}
                      onChange={(e) => setNewWhatsappNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-700/60 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Business Login Email (Optional) */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Business Email</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">Optional</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@business.com (Optional)"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Editable later in profile. When provided, this serves as the business login credential email.
                  </p>
                </div>

                {/* Custom Terminal Quota (Any number chosen by Hive) */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Terminal Fleet Limit</span>
                    <span className="text-amber-400 text-[10px] font-mono font-bold">Custom Limit</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQuota}
                    onChange={(e) => setNewQuota(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Custom quota: Hive can choose any number (e.g. 5, 25, 100).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-[11px] leading-relaxed">
                ℹ️ Onboarding creates the tenant schema, allocates custom terminal limit, provisions primary Till Register #01, and links the essential contact channels for Hive communications.
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hive Master Subscription & Module Pricing Modal */}
      {subscriptionConfigTenant && (
        <TenantSubscriptionConfigModal
          isOpen={Boolean(subscriptionConfigTenant)}
          tenant={subscriptionConfigTenant}
          onClose={() => setSubscriptionConfigTenant(null)}
          onSave={handleSaveSubscription}
        />
      )}
    </div>
  );
};
