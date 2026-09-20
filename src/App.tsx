/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, WorkspaceRole, NotificationItem, TenantContext, TerminalDevice, isShopSubscribed, getSubscriptionAlertState, isSystemHostUser } from './types';
import { dbService, subscribeToSyncEvents } from './services/db';
import { attachBarcodeScannerListener, posAudio } from './services/hardware';
import { INITIAL_USERS, INITIAL_TENANTS, INITIAL_TERMINALS } from './data/initialData';
import { Header } from './components/common/Header';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { BiometricAuthModal } from './components/auth/BiometricAuthModal';
import { OAuthModal } from './components/auth/OAuthModal';
import { FirebaseConnectionModal } from './components/auth/FirebaseConnectionModal';
import { ShopGuestModeBanner } from './components/common/ShopGuestModeBanner';
import { SubscriptionAlertBanner } from './components/common/SubscriptionAlertBanner';

// Workspaces
import { FrontendDashboardWorkspace } from './components/workspaces/FrontendDashboardWorkspace';
import { SalesWorkspace } from './components/workspaces/SalesWorkspace';
import { StoreroomWorkspace } from './components/workspaces/StoreroomWorkspace';
import { AccountsWorkspace } from './components/workspaces/AccountsWorkspace';
import { HRWorkspace } from './components/workspaces/HRWorkspace';
import { ManagerWorkspace } from './components/workspaces/ManagerWorkspace';
import { ITWorkspace } from './components/workspaces/ITWorkspace';
import { HiveMasterWorkspace } from './components/workspaces/HiveMasterWorkspace';
import { ShopBackOfficeWorkspace } from './components/workspaces/ShopBackOfficeWorkspace';
import { ModuleGatedWorkspace } from './components/workspaces/ModuleGatedWorkspace';
import { ModuleGatedModal } from './components/common/ModuleGatedModal';
import { TenantDeviceManagerModal } from './components/tenant/TenantDeviceManagerModal';
import { PairTerminalModal } from './components/tenant/PairTerminalModal';
import { InviteDeviceModal } from './components/tenant/InviteDeviceModal';
import { CreateShopModal } from './components/tenant/CreateShopModal';
import { ShopSubscriptionManagerModal } from './components/tenant/ShopSubscriptionManagerModal';
import { UserAuthSignInModal } from './components/auth/UserAuthSignInModal';
import { ShieldAlert, KeyRound, Lock } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('bluenilla_session_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null; // Initial state is Survey Mode (unauthenticated guest)
  });
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);
  const [gatedModalModule, setGatedModalModule] = useState<WorkspaceRole | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);

  // Hybrid Architecture: Tenants & Terminals
  const [tenants, setTenants] = useState<TenantContext[]>(INITIAL_TENANTS);
  const [currentTenant, setCurrentTenant] = useState<TenantContext | null>(INITIAL_TENANTS[0]);
  const [terminals, setTerminals] = useState<TerminalDevice[]>(INITIAL_TERMINALS);
  const [currentTerminal, setCurrentTerminal] = useState<TerminalDevice | null>(INITIAL_TERMINALS[0]);
  
  // Theme with safe iframe storage fallback
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bluenilla_theme');
      if (saved) return saved === 'dark';
      return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true;
    } catch {
      return false;
    }
  });

  // Connectivity & Sync
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    try {
      return !navigator.onLine;
    } catch {
      return false;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Hybrid Cloud Architecture Initialized',
      message: 'Hive Master, Scoped Business Tenants, and Terminal fleet online.',
      timestamp: 'Just now',
      type: 'info',
      read: false
    },
    {
      id: 'n-2',
      title: 'Offline Database Ready',
      message: 'Local IndexedDB persistence cache initialized with biometric & hardware bridge.',
      timestamp: 'Just now',
      type: 'info',
      read: false
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auth Modals
  const [showBiometric, setShowBiometric] = useState(false);
  const [showOAuth, setShowOAuth] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // Tenant Fleet & Terminal Pairing Modals
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Tenant Multi-Shop & Subscription Modals
  const [showCreateShopModal, setShowCreateShopModal] = useState(false);
  const [showSubManagerModal, setShowSubManagerModal] = useState(false);

  // Apply Theme class
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('bluenilla_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bluenilla_theme', 'light');
      }
    } catch {
      // Storage might be restricted in sandboxed iframes
    }
  }, [isDark]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      posAudio.playScanBeep();
      triggerSync();
    };

    const handleOffline = () => {
      setIsOffline(true);
      posAudio.playErrorTone();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update dynamic company branding in document title
  useEffect(() => {
    if (currentUser && !isSystemHostUser(currentUser) && currentTenant?.businessName) {
      document.title = `${currentTenant.businessName} - POS`;
    } else if (currentUser && isSystemHostUser(currentUser)) {
      document.title = 'BlueNilla Hive Master - Platform Host';
    } else {
      document.title = 'BlueNilla POS Enterprise';
    }
  }, [currentUser, currentTenant]);

  // Sync Trigger Function
  const triggerSync = useCallback(async (): Promise<number> => {
    setIsSyncing(true);
    try {
      const count = await dbService.syncPendingQueue();
      if (count > 0) {
        addNotification({
          id: `notif-${Date.now()}`,
          title: 'Cloud Sync Completed',
          message: `Successfully propagated ${count} offline mutation(s) to cloud database.`,
          timestamp: 'Just now',
          type: 'success',
          read: false
        });
      }
      return count;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Add Notification Helper
  const addNotification = (notif: NotificationItem) => {
    setNotifications(prev => [notif, ...prev]);
  };

  // Load initial data with bulletproof fallback
  const initApp = async () => {
    try {
      const [users, loadedTenants, loadedTerminals] = await Promise.all([
        dbService.getUsers().catch(() => INITIAL_USERS),
        dbService.getTenants().catch(() => INITIAL_TENANTS),
        dbService.getTerminals().catch(() => INITIAL_TERMINALS)
      ]);

      if (users && users.length > 0) {
        setAvailableUsers(users);
        try {
          const stored = localStorage.getItem('bluenilla_session_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id) {
              setCurrentUser(parsed);
            }
          }
        } catch {
          // Keep null for Survey Mode
        }
      }

      if (loadedTenants && loadedTenants.length > 0) {
        setTenants(loadedTenants);
        setCurrentTenant(prev => prev || loadedTenants[0]);
      }

      if (loadedTerminals && loadedTerminals.length > 0) {
        setTerminals(loadedTerminals);
        setCurrentTerminal(prev => prev || loadedTerminals[0]);
      }
    } catch (err) {
      console.warn('initApp fallback triggered:', err);
    } finally {
      setIsAppReady(true);
    }
  };

  useEffect(() => {
    initApp();

    const unsub = subscribeToSyncEvents(async (event) => {
      try {
        if (event.type === 'TENANTS_UPDATED' || event.type === 'TENANT_MODULES_UPDATED') {
          const tList = await dbService.getTenants();
          if (tList && tList.length > 0) {
            setTenants(tList);
            setCurrentTenant(prev => {
              if (!prev) return tList[0] || null;
              return tList.find(t => t.id === prev.id) || prev;
            });
          }
        }
      } catch (e) {
        console.warn('Sync event handler error:', e);
      }
    });

    // Attach hardware USB barcode listener
    const detachScanner = attachBarcodeScannerListener((scannedBarcode) => {
      console.log('Hardware USB Barcode detected globally:', scannedBarcode);
      addNotification({
        id: `scan-${Date.now()}`,
        title: 'Barcode Scanned',
        message: `Hardware reader captured code: ${scannedBarcode}`,
        timestamp: 'Just now',
        type: 'info',
        read: false
      });
    });

    return () => {
      detachScanner();
      unsub();
    };
  }, []);

  // Tenant Switcher
  const handleSwitchTenant = (t: TenantContext) => {
    setCurrentTenant(t);
    posAudio.playScanBeep();
    addNotification({
      id: `tenant-${Date.now()}`,
      title: 'Tenant Context Activated',
      message: `Scoped to ${t.businessName} (${t.tenantId} • ${t.subdomain})`,
      timestamp: 'Just now',
      type: 'info',
      read: false
    });
  };

  // User Switcher
  const handleSwitchUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      posAudio.playScanBeep();
      addNotification({
        id: `switch-${Date.now()}`,
        title: 'Active Operator Changed',
        message: `Signed in as ${user.name} (${user.role.replace('_', ' ')})`,
        timestamp: 'Just now',
        type: 'info',
        read: false
      });
    } else {
      addNotification({
        id: `switch-${Date.now()}`,
        title: 'Survey Mode Active',
        message: 'Signed out. Modules are open for interactive preview without saving to the database.',
        timestamp: 'Just now',
        type: 'info',
        read: false
      });
    }
  };

  // Strict Multi-Tenant Account Data Isolation:
  // - Hive host users (aqutewavedev@gmail.com, system_host) are ONLY visible if the current logged in user is a system_host.
  // - Tenant users (owners, managers, cashiers) ONLY see their own shop's accounts (u.tenantId === currentTenant?.id).
  // - Other shops' users (e.g. Artisanal Bakery vs Metro Cafe) are never exposed.
  const scopedAvailableUsers = useMemo(() => {
    if (currentUser && isSystemHostUser(currentUser)) {
      return availableUsers;
    }

    const tenantId = currentTenant?.id || currentUser?.tenantId || 'tenant_bluenilla_corp';

    return availableUsers.filter(u => {
      // Exclude Hive central / platform host accounts
      if (
        isSystemHostUser(u) ||
        u.role === 'system_host' ||
        u.tenantId === 'hive_central' ||
        u.email === 'aqutewavedev@gmail.com' ||
        u.email === 'admin.it@bluenilla.com'
      ) {
        return false;
      }

      // Exclude accounts belonging to other tenants
      if (u.tenantId && u.tenantId !== tenantId) {
        return false;
      }

      return true;
    });
  }, [availableUsers, currentUser, currentTenant?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAppReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold">Loading BLUENILLA POS Enterprise...</h2>
        <p className="text-xs text-slate-400 mt-1">Bootstrapping catalog and workspace modules</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Header & Workspace Navigator */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={scopedAvailableUsers}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isOffline={isOffline}
        onToggleOfflineMode={() => setIsOffline(!isOffline)}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenBiometric={() => setShowBiometric(true)}
        onOpenOAuth={() => setShowOAuth(true)}
        onOpenFirebase={() => setShowFirebaseModal(true)}
        isSyncing={isSyncing}
        onTriggerSync={triggerSync}
        currentTenant={currentTenant}
        availableTenants={tenants}
        onSwitchTenant={handleSwitchTenant}
        onOpenCreateShop={() => setShowCreateShopModal(true)}
        onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
        currentTerminal={currentTerminal}
        onOpenDeviceManager={() => setShowDeviceManager(true)}
        onOpenPairModal={() => setShowPairModal(true)}
        onOpenInviteModal={() => setShowInviteModal(true)}
        onGatedModuleClick={(moduleKey) => setGatedModalModule(moduleKey)}
      />

      {/* Shop Guest Mode Notice Banner (Unsubscribed Shop with Single-Subscription Policy) */}
      {currentUser && currentTenant && !isShopSubscribed(currentTenant) && (
        <ShopGuestModeBanner
          currentTenant={currentTenant}
          availableTenants={tenants}
          onSwitchToSubscribedShop={handleSwitchTenant}
          onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
        />
      )}

      {/* Subscription Expiry / Overdue Grace / Host Approval Warning Alert Banner */}
      {currentUser && currentTenant && isShopSubscribed(currentTenant) && (
        <SubscriptionAlertBanner
          tenant={currentTenant}
          onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
        />
      )}

      {/* System Survey Mode Guest Banner (Interactive Preview, Database writes disabled) */}
      {!currentUser && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong className="font-semibold">Survey Mode (Unauthenticated):</strong> All frontend modules are accessible to explore and test. Data writing and task saving are disabled unless signed in with an active subscription. Changes will not be saved on page refresh.
            </span>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In to Save & Sync</span>
          </button>
        </div>
      )}

      {/* Main Workspace Dynamic View */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentRole === 'hive_master' ? (
          <HiveMasterWorkspace
            currentUser={currentUser}
            onSelectTenant={(selectedTenant) => {
              handleSwitchTenant(selectedTenant);
              setCurrentRole('sales');
            }}
            onExitHive={() => setCurrentRole('sales')}
          />
        ) : (currentUser && currentTenant?.enabledModules && currentTenant.enabledModules[currentRole as keyof typeof currentTenant.enabledModules] === false) ? (
          <ModuleGatedWorkspace
            moduleRole={currentRole}
            tenant={currentTenant}
            currentUser={currentUser}
            onOpenHiveConfig={() => setCurrentRole('hive_master')}
            onSwitchToAllowed={(role) => setCurrentRole(role)}
            onRequestUpgrade={(modKey) => {
              addNotification({
                id: `req-${Date.now()}`,
                title: 'Module Access Request Sent',
                message: `Upgrade request for ${modKey.toUpperCase()} submitted to Hive Host for ${currentTenant?.tenantName}.`,
                timestamp: 'Just now',
                type: 'info',
                read: false
              });
            }}
          />
        ) : (
          <>
            {currentRole === 'dashboard' && (
              <FrontendDashboardWorkspace
                currentUser={currentUser}
                currentTenant={currentTenant}
                availableTenants={tenants}
                currentTerminal={currentTerminal}
                isOffline={isOffline}
                onNavigate={(role) => setCurrentRole(role)}
                onSwitchTenant={handleSwitchTenant}
                onOpenAuthModal={() => setShowAuthModal(true)}
                onOpenPairModal={() => setShowPairModal(true)}
                onOpenDeviceManager={() => setShowDeviceManager(true)}
                onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
                onOpenCreateShop={() => setShowCreateShopModal(true)}
                onOpenBiometric={() => setShowBiometric(true)}
                onOpenOAuth={() => setShowOAuth(true)}
                onOpenFirebase={() => setShowFirebaseModal(true)}
                onTriggerSync={triggerSync}
                onToggleOfflineMode={() => setIsOffline(prev => !prev)}
                onOpenNotifications={() => setShowNotifications(true)}
              />
            )}

            {currentRole === 'sales' && (
              <SalesWorkspace
                currentUser={currentUser}
                isOffline={isOffline}
                currentTenant={currentTenant}
                availableTenants={tenants}
                onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
                onSwitchTenant={handleSwitchTenant}
              />
            )}

            {currentRole === 'storeroom' && (
              <StoreroomWorkspace
                currentUser={currentUser}
                isOffline={isOffline}
                currentTenant={currentTenant}
                availableTenants={tenants}
                onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
                onSwitchTenant={handleSwitchTenant}
              />
            )}

            {currentRole === 'accounts' && (
              <AccountsWorkspace
                currentUser={currentUser}
              />
            )}

            {currentRole === 'hr' && (
              <HRWorkspace
                currentUser={currentUser}
              />
            )}

            {currentRole === 'manager' && (
              <ManagerWorkspace
                currentUser={currentUser}
              />
            )}

            {currentRole === 'it' && (
              <ITWorkspace
                currentUser={currentUser}
                isOffline={isOffline}
                onTriggerSync={triggerSync}
              />
            )}

            {currentRole === 'back_office' && (
              <ShopBackOfficeWorkspace
                tenant={currentTenant}
                currentUser={currentUser}
                availableUsers={scopedAvailableUsers}
                onSwitchUser={handleSwitchUser}
                onOpenHiveMaster={() => setCurrentRole('hive_master')}
                onOpenSubscriptionManager={() => setShowSubManagerModal(true)}
                onOpenCreateShop={() => setShowCreateShopModal(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Biometric Verification Modal */}
      {showBiometric && (
        <BiometricAuthModal
          user={currentUser}
          onSuccess={() => setShowBiometric(false)}
          onCancel={() => setShowBiometric(false)}
        />
      )}

      {/* OAuth 2.0 & Firebase Google Auth Modal */}
      {showOAuth && (
        <OAuthModal
          tenantId={currentTenant?.id || 'bluenilla-main'}
          onSuccess={(ssoUser) => {
            setCurrentUser(prev => prev ? { ...prev, ...ssoUser } : prev);
            setShowOAuth(false);
          }}
          onCancel={() => setShowOAuth(false)}
        />
      )}

      {/* Firebase Cloud Database & Auth Diagnostics Modal */}
      {showFirebaseModal && (
        <FirebaseConnectionModal
          isOpen={showFirebaseModal}
          onClose={() => setShowFirebaseModal(false)}
          tenantId={currentTenant?.id || 'bluenilla-main'}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={(id) => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }}
        onMarkAllRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

      {/* Business Owner Device Fleet Management Modal */}
      {showDeviceManager && currentTenant && (
        <TenantDeviceManagerModal
          tenant={currentTenant}
          currentUser={currentUser}
          isOpen={showDeviceManager}
          onClose={() => setShowDeviceManager(false)}
          onOpenInviteModal={() => setShowInviteModal(true)}
        />
      )}

      {/* Business Owner Device Invitation Modal */}
      {showInviteModal && currentTenant && (
        <InviteDeviceModal
          tenant={currentTenant}
          currentUser={currentUser}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInviteCreated={() => {
            addNotification({
              id: `inv-${Date.now()}`,
              title: 'Device Invite Generated',
              message: 'New pairing code generated. Terminal can now be paired.',
              timestamp: 'Just now',
              type: 'info',
              read: false
            });
          }}
        />
      )}

      {/* Terminal Self-Pairing Modal (via pairing code) */}
      {showPairModal && (
        <PairTerminalModal
          isOpen={showPairModal}
          onClose={() => setShowPairModal(false)}
          onPaired={(newDevice) => {
            setCurrentTerminal(newDevice);
            setTerminals(prev => {
              const existing = prev.find(p => p.id === newDevice.id);
              if (existing) {
                return prev.map(p => p.id === newDevice.id ? newDevice : p);
              }
              return [...prev, newDevice];
            });
            posAudio.playScanBeep();
            addNotification({
              id: `pair-${Date.now()}`,
              title: 'Terminal Paired Successfully',
              message: `Device ${newDevice.name} (${newDevice.terminalCode}) paired with ${newDevice.businessName}.`,
              timestamp: 'Just now',
              type: 'success',
              read: false
            });
          }}
        />
      )}

      {/* User Auth Sign In Modal Linked to Firestore & Database */}
      <UserAuthSignInModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUserAuthenticated={(user) => {
          handleSwitchUser(user);
          setShowAuthModal(false);
          if (user.tenantId) {
            const matchedTenant = tenants.find(t => t.id === user.tenantId);
            if (matchedTenant) handleSwitchTenant(matchedTenant);
          }
        }}
        onSignOut={() => {
          handleSwitchUser(null);
          setShowAuthModal(false);
        }}
        availableUsers={scopedAvailableUsers}
      />

      {/* Module Access Gated by Subscription Modal */}
      {gatedModalModule && (
        <ModuleGatedModal
          isOpen={Boolean(gatedModalModule)}
          moduleRole={gatedModalModule}
          tenant={currentTenant}
          currentUser={currentUser}
          onClose={() => setGatedModalModule(null)}
          onOpenHiveConfig={() => {
            setGatedModalModule(null);
            setCurrentRole('hive_master');
          }}
          onRequestUpgrade={(modKey) => {
            addNotification({
              id: `req-${Date.now()}`,
              title: 'Module Access Request Sent',
              message: `Upgrade request to unlock ${modKey.toUpperCase()} submitted to Hive Master for ${currentTenant?.tenantName}.`,
              timestamp: 'Just now',
              type: 'info',
              read: false
            });
          }}
        />
      )}

      {/* Tenant Multi-Shop: Create New Shop Modal */}
      {showCreateShopModal && currentTenant && (
        <CreateShopModal
          isOpen={showCreateShopModal}
          onClose={() => setShowCreateShopModal(false)}
          activeTenant={currentTenant}
          availableTenants={tenants}
          currentUser={currentUser}
          onSelectShop={(shop) => handleSwitchTenant(shop)}
          onShopUpdated={async () => {
            const updatedList = await dbService.getTenants();
            setTenants(updatedList);
          }}
          onShopCreated={async (newShop) => {
            const updatedList = await dbService.getTenants();
            setTenants(updatedList);
            handleSwitchTenant(newShop);
            setShowCreateShopModal(false);
            addNotification({
              id: `shop-created-${Date.now()}`,
              title: 'New Shop Workspace Created',
              message: `Shop "${newShop.businessName}" created under ${newShop.tenantName}. ${newShop.isSubscribed ? 'Subscription is active.' : 'Operating in Guest Mode (Read-Only) under 1-subscription quota.'}`,
              timestamp: 'Just now',
              type: 'success',
              read: false
            });
          }}
        />
      )}

      {/* Tenant Shop Subscription & Activation Manager Modal */}
      {showSubManagerModal && currentTenant && (
        <ShopSubscriptionManagerModal
          isOpen={showSubManagerModal}
          onClose={() => setShowSubManagerModal(false)}
          activeTenant={currentTenant}
          availableTenants={tenants}
          currentUser={currentUser}
          onSwitchShop={(targetShop) => {
            handleSwitchTenant(targetShop);
            setShowSubManagerModal(false);
          }}
          onOpenCreateShop={() => {
            setShowSubManagerModal(false);
            setShowCreateShopModal(true);
          }}
          onTenantsUpdated={async () => {
            const updatedList = await dbService.getTenants();
            setTenants(updatedList);
            if (currentTenant) {
              const refreshed = updatedList.find(t => t.id === currentTenant.id);
              if (refreshed) setCurrentTenant(refreshed);
            }
          }}
        />
      )}
    </div>
  );
}
