import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Users, 
  BarChart3, 
  Cpu, 
  Moon, 
  Sun, 
  Wifi, 
  WifiOff, 
  Bell, 
  Fingerprint, 
  KeyRound, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Server,
  Building2,
  Lock,
  Monitor,
  Check,
  QrCode,
  Sparkles,
  Store,
  Database,
  LogOut,
  ShieldAlert,
  Eye,
  Plus,
  LayoutDashboard,
  SlidersHorizontal,
  Smartphone,
  X
} from 'lucide-react';
import { 
  User, 
  WorkspaceRole, 
  TenantContext, 
  TerminalDevice, 
  isSystemHostUser, 
  isBusinessOwnerUser, 
  isTenantAdminUser,
  isTerminalUser,
  hasModuleAccess,
  isShopSubscribed
} from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileInstallModal } from './MobileInstallModal';
import { UserAuthSignInModal } from '../auth/UserAuthSignInModal';

interface HeaderProps {
  currentRole: WorkspaceRole;
  onRoleChange: (role: WorkspaceRole) => void;
  currentUser: User | null;
  onSwitchUser: (user: User | null) => void;
  availableUsers: User[];
  isDark: boolean;
  onToggleTheme: () => void;
  isOffline: boolean;
  onToggleOfflineMode: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenBiometric: () => void;
  onOpenOAuth: () => void;
  onOpenFirebase?: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  currentTenant?: TenantContext | null;
  availableTenants?: TenantContext[];
  onSwitchTenant?: (tenant: TenantContext) => void;
  onOpenCreateShop?: () => void;
  onOpenSubscriptionManager?: () => void;
  currentTerminal?: TerminalDevice | null;
  onOpenDeviceManager?: () => void;
  onOpenPairModal?: () => void;
  onOpenInviteModal?: () => void;
  onGatedModuleClick?: (moduleKey: WorkspaceRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onSwitchUser,
  availableUsers,
  isDark,
  onToggleTheme,
  isOffline,
  onToggleOfflineMode,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenBiometric,
  onOpenOAuth,
  onOpenFirebase,
  isSyncing,
  onTriggerSync,
  currentTenant,
  availableTenants = [],
  onSwitchTenant,
  onOpenCreateShop,
  onOpenSubscriptionManager,
  currentTerminal,
  onOpenDeviceManager,
  onOpenPairModal,
  onOpenInviteModal,
  onGatedModuleClick
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileToolsMenu, setShowMobileToolsMenu] = useState(false);
  const [showMobileWorkspaceMenu, setShowMobileWorkspaceMenu] = useState(false);
  const [showMobileInstallModal, setShowMobileInstallModal] = useState(false);

  const closeAllMenus = () => {
    setShowUserMenu(false);
    setShowTenantMenu(false);
    setShowMobileToolsMenu(false);
    setShowMobileWorkspaceMenu(false);
  };

  const isHiveMasterView = currentRole === 'hive_master';
  const isHost = isSystemHostUser(currentUser);
  const isBusinessOwner = isBusinessOwnerUser(currentUser);
  const isStoreManager = currentUser ? (currentUser.role === 'store_manager' || currentUser.role === 'it_admin') : false;

  const hostUsers = availableUsers.filter(u => isSystemHostUser(u));
  const businessOwners = availableUsers.filter(u => isBusinessOwnerUser(u));
  const staffUsers = availableUsers.filter(u => !isSystemHostUser(u) && !isBusinessOwnerUser(u));

  const handleUserSelected = (user: User) => {
    setShowUserMenu(false);
    onSwitchUser(user);
    if (isHiveMasterView && !isSystemHostUser(user)) {
      onRoleChange(isBusinessOwnerUser(user) ? 'manager' : 'sales');
    }
  };

  const allWorkspaces: { 
    id: WorkspaceRole; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    moduleKey?: keyof TenantContext['enabledModules']; 
    adminOnly?: boolean;
    desc?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard Hub', icon: LayoutDashboard, desc: 'Overview, till status & operational shortcuts' },
    { id: 'sales', label: 'Sales POS', icon: ShoppingBag, moduleKey: 'sales', desc: 'Speed register, tickets & payments' },
    { id: 'storeroom', label: 'Storeroom & PO', icon: Package, moduleKey: 'storeroom', desc: 'Inventory counts, stock audit & PO receiving' },
    { id: 'accounts', label: 'Accounts', icon: DollarSign, moduleKey: 'accounts', desc: 'General ledger, cash journal & expenses' },
    { id: 'hr', label: 'HR Workforce', icon: Users, moduleKey: 'hr', desc: 'Staff shifts, rosters & payroll' },
    { id: 'manager', label: 'Manager Analytics', icon: BarChart3, moduleKey: 'manager', desc: 'Financial reports, margins & audit logs' },
    { id: 'it', label: 'I.T. & Security', icon: Cpu, moduleKey: 'it', desc: 'Terminal fleet, offline cache & security' },
    { id: 'back_office', label: 'Shop Back Office', icon: Store, moduleKey: undefined, adminOnly: true, desc: 'Tenant settings, subscription & branches' },
  ];

  const activeWorkspace = allWorkspaces.find(ws => ws.id === currentRole) || allWorkspaces[0];
  const ActiveWorkspaceIcon = activeWorkspace.icon;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none z-40 shrink-0">
      {/* Click-outside backdrop scrim for open mobile & desktop menus */}
      {(showUserMenu || showTenantMenu || showMobileToolsMenu || showMobileWorkspaceMenu) && (
        <div 
          className="fixed inset-0 z-35 bg-black/20 dark:bg-black/40 backdrop-blur-[0.5px]" 
          onClick={closeAllMenus}
        />
      )}

      {/* Upper Brand & Utility Bar */}
      <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-100 dark:border-slate-800/60 relative z-40">
        
        {/* Left: Brand Logo & Multi-Tenant Context Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {(() => {
          const isTenantUser = currentUser && !isSystemHostUser(currentUser);
          const companyName = currentTenant?.businessName || (currentTenant as any)?.tenantName || 'Store POS';
          const companyInitials = companyName
            .split(' ')
            .map((w: string) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CO';
          const subText = currentTenant?.branchAddress || (currentTenant as any)?.tenantName || 'Store POS';

          if (isTenantUser) {
            return (
              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0" id="tenant-company-brand">
                {(currentTenant as any)?.logoUrl ? (
                  <img
                    src={(currentTenant as any).logoUrl}
                    alt={companyName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm tracking-wider">{companyInitials}</span>
                  </div>
                )}

                <div className="shrink-0 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <h1 
                      className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none uppercase truncate max-w-36 sm:max-w-64"
                      title={companyName}
                    >
                      {companyName}
                    </h1>
                    <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      POS
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 leading-none mt-0.5 hidden xs:block truncate max-w-48">
                    {subText}
                  </p>
                </div>
              </div>
            );
          }

          // System Host / Hive Master or Survey Mode
          const isHiveHost = currentUser && isSystemHostUser(currentUser);
          return (
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0" id="platform-default-brand">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-wider">BN</span>
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {isHiveHost ? 'BLUENILLA HIVE' : 'BLUENILLA'}
                  </h1>
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {isHiveHost ? 'Host Central' : 'POS Enterprise'}
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-none mt-0.5 hidden xs:block">
                  {isHiveHost ? 'Global Platform Management' : 'Hybrid Cloud & Terminal Sync'}
                </p>
              </div>
            </div>
          );
        })()}

          {/* Tenant & Business Context Dropdown */}
          {currentTenant && (
            <div className="relative ml-0.5 sm:ml-2">
              <button
                onClick={() => {
                  setShowTenantMenu(!showTenantMenu);
                  setShowUserMenu(false);
                  setShowMobileToolsMenu(false);
                  setShowMobileWorkspaceMenu(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition text-left"
                title="Switch business workspace"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-none truncate max-w-40">
                      {currentTenant.businessName}
                    </span>
                    {isShopSubscribed(currentTenant) ? (
                      <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Subscribed
                      </span>
                    ) : (
                      <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Eye className="w-2.5 h-2.5" />
                        Guest Mode
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 leading-none mt-0.5 truncate max-w-40">
                    {currentTenant.tenantName}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
              </button>

              {/* Tenant Dropdown Menu */}
              {showTenantMenu && (
                <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block">
                        Tenant Business Shops
                      </span>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate block">
                        {currentTenant.tenantName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Same Credentials
                    </span>
                  </div>

                  {/* Tenant Shop List - Strictly Scoped to Same Account/Credentials */}
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {!currentUser ? (
                      <div className="p-3 text-center space-y-1 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Roaming Mode (Not Logged In)
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          No business data displayed. This is a non-existing business preview for visitors exploring the app.
                        </p>
                      </div>
                    ) : (
                      (() => {
                        const sameCredentialShops = availableTenants.filter(t => 
                          t.tenantId === currentTenant.tenantId || 
                          (currentUser.email && (t.ownerEmail === currentUser.email || t.contactEmail === currentUser.email))
                        );

                        if (sameCredentialShops.length === 0) {
                          return (
                            <div className="p-3 text-center text-xs text-slate-500">
                              No shops registered with this account.
                            </div>
                          );
                        }

                        return sameCredentialShops.map(t => {
                          const isSub = isShopSubscribed(t);
                          const isCurrent = t.id === currentTenant.id;
                          const isOnHold = t.status === 'suspended' || t.status === 'unsubscribed';

                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                if (onSwitchTenant) onSwitchTenant(t);
                                setShowTenantMenu(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition text-xs ${
                                isCurrent
                                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="truncate font-semibold">{t.businessName}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 truncate">{t.subdomain}</span>
                                  {isSub ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                      Subscribed
                                    </span>
                                  ) : isOnHold ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      On Hold
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                      Trial / Guest
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                            </button>
                          );
                        });
                      })()
                    )}
                  </div>

                  {/* Quick Actions & Subscription Rule Note */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <button
                      onClick={() => {
                        setShowTenantMenu(false);
                        if (onOpenCreateShop) onOpenCreateShop();
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/80 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create New Shop Branch</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowTenantMenu(false);
                        if (onOpenSubscriptionManager) onOpenSubscriptionManager();
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Manage Shop Subscriptions</span>
                    </button>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      <strong>1-Subscription Rule:</strong> Subscribed shop has full read/write access. Unsubscribed shops operate in Guest Mode (roam & read-only).
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal Identifier Badge (Clickable for Pairing / Device Fleet) */}
          {currentTerminal && (
            <button
              onClick={onOpenDeviceManager || onOpenPairModal}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Terminal Till Device (Click to manage tenant devices or pair)"
            >
              <Monitor className="w-3 h-3 text-emerald-500" />
              <span>{currentTerminal.terminalCode}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
          )}
        </div>

        {/* Right Section: Desktop Full Bar + Mobile Condensed Bar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* =========================================================================
              DESKTOP CONTROLS (Screen width md and above): Full expanded button toolbar
             ========================================================================= */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
            {/* TENANT DEVICE FLEET & INVITATION (For Business Owners & Managers) */}
            {(isBusinessOwner || isStoreManager) && onOpenDeviceManager && (
              <button
                onClick={onOpenDeviceManager}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 shadow-2xs"
                title="Manage Tenant Devices & Invite New POS Terminals"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden md:inline">Tenant Devices</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 font-mono font-bold">
                  +Invite
                </span>
              </button>
            )}

            {/* HIVE MASTER CONTROL PLANE (Accessible by System Host Users Only) */}
            {isHost && (
              <button
                onClick={() => onRoleChange(isHiveMasterView ? 'sales' : 'hive_master')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition shadow-xs ${
                  isHiveMasterView
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                    : 'bg-slate-900 text-amber-400 border-amber-600/40 hover:border-amber-500 hover:bg-slate-800'
                }`}
                title="System Host Access: Hive Master Cloud Platform Control Plane"
              >
                <Server className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">
                  {isHiveMasterView ? 'Exit Hive Host' : 'Hive Master (Host Only)'}
                </span>
              </button>
            )}

            {/* Firebase Cloud Database & Auth Status Trigger */}
            {onOpenFirebase && (
              <button
                id="btn-firebase-modal"
                onClick={onOpenFirebase}
                className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] sm:text-xs transition shadow-2xs cursor-pointer"
                title="Firebase Cloud Database & Auth Connection"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden sm:inline font-semibold">Firestore Cloud</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* PWA Install & Mobile QR Button */}
            <div>
              <PWAInstallButton />
            </div>

            {/* Sync Trigger */}
            <button
              id="btn-sync-trigger"
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              title="Synchronize local IndexedDB cache with cloud master"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Connectivity / Remote Field Offline Mode Toggle */}
            <button
              id="btn-network-status"
              onClick={onToggleOfflineMode}
              className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition ${
                isOffline
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
              }`}
              title="Click to toggle simulated Remote Field Offline Mode"
            >
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span className="hidden xs:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* Dark Mode Theme Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              className="p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Toggle Accessibility Dark Mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            {/* Notification Center Trigger */}
            <button
              id="btn-notifications-open"
              onClick={onOpenNotifications}
              className="relative p-1 sm:p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="System updates and alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Dedicated User Auth / Sign In Trigger */}
            <button
              id="btn-user-auth-signin"
              onClick={() => setShowAuthModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer border ${
                currentUser
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-amber-500/20'
              }`}
              title={currentUser ? `${currentUser.name} (${currentUser.role})` : "Sign In to POS Account"}
            >
              <KeyRound className={`w-3.5 h-3.5 ${currentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-950'}`} />
              <span className="hidden sm:inline">{currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-950'}`} />
            </button>
          </div>

          {/* =========================================================================
              MOBILE CONTROLS (Screen width < md): Guaranteed compact, zero-overflow bar
             ========================================================================= */}
          <div className="flex md:hidden items-center gap-1">
            {/* Quick Sync with Network Status dot */}
            <button
              id="btn-mobile-quick-sync"
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="relative p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
              title="Quick Sync Cloud Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`} />
            </button>

            {/* Notification Bell with Badge */}
            <button
              id="btn-mobile-notifications"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
              title="Notifications and System Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Tools & Settings Dropdown */}
            <div className="relative">
              <button
                id="btn-mobile-quick-tools"
                onClick={() => {
                  setShowMobileToolsMenu(!showMobileToolsMenu);
                  setShowUserMenu(false);
                  setShowTenantMenu(false);
                  setShowMobileWorkspaceMenu(false);
                }}
                className={`p-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                  showMobileToolsMenu
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="POS Tools, Cloud & Network Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Quick Tools Dropdown Menu */}
              {showMobileToolsMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block">
                        Quick System Tools
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Controls & Hardware
                      </span>
                    </div>
                    <button
                      onClick={() => setShowMobileToolsMenu(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Offline Mode Toggle Button */}
                  <button
                    onClick={() => {
                      onToggleOfflineMode();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                  >
                    <div className="flex items-center gap-2">
                      {isOffline ? <WifiOff className="w-4 h-4 text-amber-500" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Network Mode</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      isOffline 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {isOffline ? 'Offline' : 'Online'}
                    </span>
                  </button>

                  {/* Dark Mode Toggle Button */}
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Theme</span>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-slate-500">
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </button>

                  {/* Firestore Cloud Modal Button */}
                  {onOpenFirebase && (
                    <button
                      onClick={() => {
                        setShowMobileToolsMenu(false);
                        onOpenFirebase();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Firestore Cloud</span>
                      </div>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Connected
                      </span>
                    </button>
                  )}

                  {/* Tenant Device Fleet & Invite */}
                  {(isBusinessOwner || isStoreManager) && onOpenDeviceManager && (
                    <button
                      onClick={() => {
                        setShowMobileToolsMenu(false);
                        onOpenDeviceManager();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 transition text-left font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Tenant Devices</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-800">
                        +Invite
                      </span>
                    </button>
                  )}

                  {/* Mobile App & PWA Installation Guide */}
                  <button
                    onClick={() => {
                      setShowMobileToolsMenu(false);
                      setShowMobileInstallModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Mobile PWA App</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      Install / QR
                    </span>
                  </button>

                  {/* Host Only Portal Toggle */}
                  {isHost && (
                    <button
                      onClick={() => {
                        setShowMobileToolsMenu(false);
                        onRoleChange(isHiveMasterView ? 'sales' : 'hive_master');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        <span>Hive Master</span>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500 text-slate-950">
                        HOST
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              USER PROFILE / SURVEY MODE DROPDOWN (Pinned rightmost on both mobile & desktop)
             ========================================================================= */}
          <div className="relative">
            <button
              id="btn-user-dropdown"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowMobileToolsMenu(false);
                setShowTenantMenu(false);
                setShowMobileWorkspaceMenu(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:p-1.5 sm:pl-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {currentUser ? (
                <>
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-slate-400 capitalize leading-none">{currentUser.role.replace('_', ' ')}</p>
                      {isHost && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold font-mono">
                          HOST
                        </span>
                      )}
                      {isBusinessOwner && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-600 text-white font-bold font-mono">
                          OWNER
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Survey Mode</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-none">Guest Preview</p>
                  </div>
                </>
              )}
              <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-2">
                {currentUser ? (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Active Operator</p>
                        {isHost ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            System Host
                          </span>
                        ) : isBusinessOwner ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            Business Owner
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Store Staff
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{currentUser.email}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Tenant: {currentUser.branchName}</p>
                    </div>

                    <button
                      onClick={() => { setShowUserMenu(false); setShowAuthModal(true); }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-white" />
                        <span>Switch Account / Re-authenticate</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-100 font-mono">
                        AUTH
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        try { localStorage.removeItem('bluenilla_session_user'); } catch {}
                        onSwitchUser(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition border border-rose-200 dark:border-rose-800/60 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out (Enter Survey Mode)</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                      <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>System Survey Mode</span>
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        You are browsing as an unauthenticated guest. Live store databases, catalog items, and transactions are locked.
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowUserMenu(false); setShowAuthModal(true); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-white" />
                      <span>Sign In with Subscription</span>
                    </button>
                  </>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenBiometric(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Fingerprint className="w-4 h-4 text-emerald-500" />
                    <span>Biometric Verification</span>
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenOAuth(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    <span>OAuth Enterprise Login</span>
                  </button>
                  {onOpenFirebase && (
                    <button
                      onClick={() => { setShowUserMenu(false); onOpenFirebase(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Database className="w-4 h-4 text-amber-500" />
                      <span>Firebase Cloud & Auth</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Role Workspace Navigation Bar (Visible in Business Tenant Portal mode) */}
      {!isHiveMasterView && (
        <>
          {/* =========================================================================
              DESKTOP TABS: Horizontal scrollable tab row for screens md and above
             ========================================================================= */}
          <nav className="hidden md:flex px-4 items-center gap-1 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-slate-900/80">
            {(allWorkspaces || []).map(ws => {
              const Icon = ws.icon;
              const isActive = currentRole === ws.id;
              const isTerminalRestricted = currentUser ? (isTerminalUser(currentUser) && !hasModuleAccess(currentUser, ws.id)) : false;
              const isModulePermitted = !currentUser
                ? true
                : (!ws.moduleKey || (currentTenant?.enabledModules ? currentTenant.enabledModules[ws.moduleKey] !== false : true)) && !isTerminalRestricted;

              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    if (isModulePermitted) {
                      onRoleChange(ws.id);
                    } else if (isTerminalRestricted) {
                      alert(`Access Restricted: The shop tenant has not granted this terminal access to the '${ws.label}' module. Only designated modules are permitted for this device.`);
                    } else if (onGatedModuleClick) {
                      onGatedModuleClick(ws.id);
                    }
                  }}
                  title={
                    isTerminalRestricted
                      ? `${ws.label} (Restricted: Not granted to this terminal device by shop tenant)`
                      : isModulePermitted 
                      ? ws.label 
                      : `${ws.label} (Gated by Hive Master Subscription — Click to view upgrade options)`
                  }
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                    !isModulePermitted
                      ? 'opacity-60 cursor-pointer border-transparent text-slate-400 hover:text-amber-500 hover:bg-amber-500/5'
                      : isActive
                      ? ws.adminOnly
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800/60 shadow-2xs rounded-t-lg'
                        : 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800/60 shadow-2xs rounded-t-lg'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (ws.adminOnly ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400') : 'text-slate-400'}`} />
                  <span>{ws.label}</span>
                  {ws.adminOnly && (
                    <span className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isTenantAdminUser(currentUser)
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                    }`}>
                      {isTenantAdminUser(currentUser) ? 'RBAC' : <Lock className="w-2.5 h-2.5" />}
                    </span>
                  )}
                  {isTerminalRestricted ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-500/15 text-rose-500 border border-rose-500/30">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Terminal Gated</span>
                    </span>
                  ) : !isModulePermitted && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Locked</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* =========================================================================
              MOBILE WORKSPACE SELECTOR: Dedicated dropdown selector for small screens
             ========================================================================= */}
          <div className="md:hidden bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800/80 px-2.5 py-1.5 relative z-40">
            {/* Active Workspace Selector Button */}
            <button
              id="btn-mobile-workspace-dropdown"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMobileWorkspaceMenu(prev => !prev);
                setShowMobileToolsMenu(false);
                setShowUserMenu(false);
                setShowTenantMenu(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition text-left cursor-pointer select-none touch-manipulation"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  activeWorkspace.adminOnly 
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' 
                    : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                }`}>
                  <ActiveWorkspaceIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {activeWorkspace.label}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {activeWorkspace.desc || 'Tap to switch modules'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {allWorkspaces.length} Modules
                </span>
                {showMobileWorkspaceMenu ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Mobile Workspace Dropdown Menu List */}
            {showMobileWorkspaceMenu && (
              <div 
                className="mt-1.5 space-y-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-2xl animate-in fade-in zoom-in-95 max-h-[65vh] overflow-y-auto relative z-50 touch-manipulation overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                  <span>Switch Workspace Module</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400">8 Modules Ready</span>
                </div>
                {allWorkspaces.map(ws => {
                  const Icon = ws.icon;
                  const isActive = currentRole === ws.id;
                  const isTerminalRestricted = currentUser ? (isTerminalUser(currentUser) && !hasModuleAccess(currentUser, ws.id)) : false;
                  const isModulePermitted = !currentUser
                    ? true
                    : (!ws.moduleKey || (currentTenant?.enabledModules ? currentTenant.enabledModules[ws.moduleKey] !== false : true)) && !isTerminalRestricted;

                  const handleSelectModule = () => {
                    setShowMobileWorkspaceMenu(false);
                    if (isModulePermitted) {
                      onRoleChange(ws.id);
                    } else if (isTerminalRestricted) {
                      alert(`Access Restricted: The shop tenant has not granted this terminal access to '${ws.label}'. Only designated modules are permitted.`);
                    } else if (onGatedModuleClick) {
                      onGatedModuleClick(ws.id);
                    }
                  };

                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectModule();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition select-none touch-manipulation active:scale-[0.98] cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-2xs' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${
                              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {ws.label}
                            </span>
                            {ws.adminOnly && (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-mono">
                                RBAC
                              </span>
                            )}
                            {isTerminalRestricted && (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-mono">
                                Gated
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ws.desc}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isActive ? (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : !isModulePermitted ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick-Access Pills Strip (When dropdown is closed) */}
            {!showMobileWorkspaceMenu && (
              <div className="mt-1 flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                {[
                  { id: 'dashboard' as WorkspaceRole, label: 'Hub', icon: LayoutDashboard },
                  { id: 'sales' as WorkspaceRole, label: 'POS', icon: ShoppingBag },
                  { id: 'storeroom' as WorkspaceRole, label: 'Stock', icon: Package },
                  { id: 'accounts' as WorkspaceRole, label: 'Ledger', icon: DollarSign },
                  { id: 'manager' as WorkspaceRole, label: 'Analytics', icon: BarChart3 }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentRole === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onRoleChange(item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Standalone Mobile PWA Installation Guide Modal */}
      <MobileInstallModal
        isOpen={showMobileInstallModal}
        onClose={() => setShowMobileInstallModal(false)}
      />

      {/* User Auth Sign In Modal Linked to Database */}
      <UserAuthSignInModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUserAuthenticated={(user) => {
          onSwitchUser(user);
          if (isHiveMasterView && !isSystemHostUser(user)) {
            onRoleChange(isBusinessOwnerUser(user) ? 'manager' : 'sales');
          }
        }}
        onSignOut={() => {
          onSwitchUser(null);
        }}
        availableUsers={availableUsers}
      />
    </header>
  );
};
