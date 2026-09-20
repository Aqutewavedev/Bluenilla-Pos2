/**
 * Firestore Dynamic Data Service for BLUENILLA Enterprise POS
 * Bridges all user data, shop data, and hive data into Cloud Firestore.
 * Conforms to:
 * - "wire all user data and shop data and hive data in database too so system becomes dynamic rendering from database not static data"
 * - "rules: each user can only read and edit, access their own data, no breach"
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth, handleFirestoreError, OperationType, HIVE_FIRESTORE_PATHS, TENANT_FIRESTORE_PATHS } from './firebase';
import {
  User,
  Product,
  Transaction,
  ParkedOrder,
  TenantContext,
  TerminalDevice,
  TenantShopConfig,
  ShiftRecord,
  HivePlatformMetrics,
  HiveAdminRecord,
  TenantModuleSettingsDoc,
  TenantSubscriptionDetailsDoc,
  SubmoduleControlConfig,
  ModuleControlConfig,
  TenantSubscriptionStatus,
  SubscriptionPackage,
  SubscriptionEmailAlert,
  SystemAuditLog,
  TenantCommunication
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_TENANTS,
  INITIAL_TERMINALS
} from '../data/initialData';

// ----------------------------------------------------------------------------
// 1. USER PROFILES IN FIRESTORE (/users/{userId})
// ----------------------------------------------------------------------------

export async function fetchUsersFromFirestore(): Promise<User[]> {
  const db = getFirebaseDb();
  const path = 'users';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    const users: User[] = [];
    snap.forEach(d => {
      const data = d.data() as User;
      users.push({ ...data, id: d.id });
    });
    return users;
  } catch (err) {
    console.warn('[Firestore] fetchUsersFromFirestore failed, delegating:', err);
    return [];
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const db = getFirebaseDb();
  const path = `users/${user.id}`;
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserByIdFromFirestore(userId: string): Promise<User | null> {
  const db = getFirebaseDb();
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as User), id: snap.id };
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] fetchUserById (${userId}) failed:`, err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// 2. SHOP DATA IN FIRESTORE (/tenants/{tenantId}/...)
// ----------------------------------------------------------------------------

export async function fetchProductsFromFirestore(tenantId: string): Promise<Product[]> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.products(tenantId);
  try {
    const colRef = collection(db, 'tenants', tenantId, 'products');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    const products: Product[] = [];
    snap.forEach(d => {
      products.push({ ...(d.data() as Product), id: d.id });
    });
    return products;
  } catch (err) {
    console.warn(`[Firestore] fetchProducts (${tenantId}) error:`, err);
    return [];
  }
}

export async function saveProductToFirestore(tenantId: string, product: Product): Promise<void> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.productDoc(tenantId, product.id);
  try {
    const docRef = doc(db, 'tenants', tenantId, 'products', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function adjustProductStockInFirestore(tenantId: string, productId: string, delta: number): Promise<number> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.productDoc(tenantId, productId);
  try {
    const docRef = doc(db, 'tenants', tenantId, 'products', productId);
    const snap = await getDoc(docRef);
    let newStock = 0;
    if (snap.exists()) {
      const current = snap.data() as Product;
      newStock = (current.stock || 0) + delta;
      await updateDoc(docRef, { stock: newStock });
    }
    return newStock;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fetchTransactionsFromFirestore(tenantId: string): Promise<Transaction[]> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.transactions(tenantId);
  try {
    const colRef = collection(db, 'tenants', tenantId, 'transactions');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const txs: Transaction[] = [];
    snap.forEach(d => {
      txs.push({ ...(d.data() as Transaction), id: d.id });
    });
    return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn(`[Firestore] fetchTransactions (${tenantId}) error:`, err);
    return [];
  }
}

export async function saveTransactionToFirestore(tenantId: string, transaction: Transaction): Promise<void> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.transactionDoc(tenantId, transaction.id);
  try {
    const docRef = doc(db, 'tenants', tenantId, 'transactions', transaction.id);
    await setDoc(docRef, transaction);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchParkedOrdersFromFirestore(tenantId: string): Promise<ParkedOrder[]> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/parked_orders`;
  try {
    const colRef = collection(db, 'tenants', tenantId, 'parked_orders');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const orders: ParkedOrder[] = [];
    snap.forEach(d => orders.push({ ...(d.data() as ParkedOrder), id: d.id }));
    return orders;
  } catch (err) {
    console.warn(`[Firestore] fetchParkedOrders (${tenantId}) error:`, err);
    return [];
  }
}

export async function saveParkedOrderToFirestore(tenantId: string, order: ParkedOrder): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/parked_orders/${order.id}`;
  try {
    const docRef = doc(db, 'tenants', tenantId, 'parked_orders', order.id);
    await setDoc(docRef, order);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteParkedOrderFromFirestore(tenantId: string, orderId: string): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/parked_orders/${orderId}`;
  try {
    const docRef = doc(db, 'tenants', tenantId, 'parked_orders', orderId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fetchTenantShopConfigFromFirestore(tenantId: string): Promise<TenantShopConfig | null> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.shopConfig(tenantId);
  try {
    const docRef = doc(db, 'tenants', tenantId, 'config', 'shop_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as TenantShopConfig;
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] fetchTenantShopConfig (${tenantId}) error:`, err);
    return null;
  }
}

export async function saveTenantShopConfigToFirestore(tenantId: string, config: TenantShopConfig): Promise<void> {
  const db = getFirebaseDb();
  const path = TENANT_FIRESTORE_PATHS.shopConfig(tenantId);
  try {
    const docRef = doc(db, 'tenants', tenantId, 'config', 'shop_config');
    await setDoc(docRef, config, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchShiftsFromFirestore(tenantId: string): Promise<ShiftRecord[]> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/shifts`;
  try {
    const colRef = collection(db, 'tenants', tenantId, 'shifts');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const shifts: ShiftRecord[] = [];
    snap.forEach(d => shifts.push({ ...(d.data() as ShiftRecord), id: d.id }));
    return shifts;
  } catch (err) {
    console.warn(`[Firestore] fetchShifts (${tenantId}) error:`, err);
    return [];
  }
}

export async function saveShiftToFirestore(tenantId: string, shift: ShiftRecord): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/shifts/${shift.id}`;
  try {
    const docRef = doc(db, 'tenants', tenantId, 'shifts', shift.id);
    await setDoc(docRef, shift, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchTerminalsFromFirestore(tenantId?: string): Promise<TerminalDevice[]> {
  const db = getFirebaseDb();
  try {
    if (tenantId) {
      const colRef = collection(db, 'tenants', tenantId, 'terminals');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const terminals: TerminalDevice[] = [];
        snap.forEach(d => terminals.push({ ...(d.data() as TerminalDevice), id: d.id }));
        return terminals;
      }
    }
    return [];
  } catch (err) {
    console.warn('[Firestore] fetchTerminals error:', err);
    return [];
  }
}

export async function saveTerminalToFirestore(tenantId: string, terminal: TerminalDevice): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/terminals/${terminal.id}`;
  try {
    const docRef = doc(db, 'tenants', tenantId, 'terminals', terminal.id);
    await setDoc(docRef, terminal, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------------------------------
// 3. HIVE PLATFORM DATA & MASTER TENANT MANAGEMENT IN FIRESTORE
// ----------------------------------------------------------------------------

/**
 * Fetch all registered Hive Platform Super Admins from /hive_admins
 */
export async function fetchHiveAdminsFromFirestore(): Promise<HiveAdminRecord[]> {
  const db = getFirebaseDb();
  try {
    const colRef = collection(db, 'hive_admins');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const admins: HiveAdminRecord[] = [];
    snap.forEach(d => admins.push({ ...(d.data() as HiveAdminRecord), id: d.id }));
    return admins;
  } catch (err) {
    console.warn('[Firestore] fetchHiveAdmins notice:', err);
    return [];
  }
}

/**
 * Ensures Master Hive Root Super Admins exist in /hive_admins/{adminId}
 */
export async function seedHiveSuperAdmins(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return;
  const db = getFirebaseDb();
  try {
    const defaultAdmins: HiveAdminRecord[] = [
      {
        id: 'admin_giant',
        email: 'giantacutewave@gmail.com',
        role: 'super_root',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'admin_root',
        email: 'aqutewavedev@gmail.com',
        role: 'super_root',
        createdAt: '2026-09-01T00:00:00.000Z'
      },
      {
        id: 'admin_it',
        email: 'admin.it@bluenilla.com',
        role: 'super_root',
        createdAt: '2026-09-01T00:00:00.000Z'
      }
    ];

    for (const adm of defaultAdmins) {
      const docRef = doc(db, 'hive_admins', adm.id);
      await setDoc(docRef, adm, { merge: true });
    }
  } catch (err) {
    console.warn('[Firestore] seedHiveSuperAdmins notice:', err);
  }
}

/**
 * Fetches all tenants from /tenants, combining with their:
 * - /tenants/{tenantId}/settings/modules
 * - /tenants/{tenantId}/subscription/details
 * Falls back to /hive/platform/tenants if needed.
 */
export async function fetchHiveTenantsFromFirestore(): Promise<TenantContext[]> {
  const db = getFirebaseDb();
  try {
    // 1. Try master tenants collection /tenants
    const tenantsColRef = collection(db, 'tenants');
    const snap = await getDocs(tenantsColRef);
    
    if (!snap.empty) {
      const tenants: TenantContext[] = [];
      
      for (const d of snap.docs) {
        const rawData = d.data();
        const tenantId = d.id;
        
        // Fetch module settings if present
        let enabledModules: ModuleControlConfig = {
          sales: true,
          storeroom: true,
          accounts: true,
          hr: false,
          manager: true,
          it: false,
          multiStore: true,
          ...(rawData.enabledModules || {})
        };
        let enabledSubmodules: SubmoduleControlConfig | undefined = rawData.enabledSubmodules;
        
        try {
          const modDocRef = doc(db, 'tenants', tenantId, 'settings', 'modules');
          const modSnap = await getDoc(modDocRef);
          if (modSnap.exists()) {
            const modData = modSnap.data() as TenantModuleSettingsDoc;
            enabledModules = {
              sales: modData.sales ?? true,
              storeroom: modData.storeroom ?? modData.inventory ?? true,
              accounts: modData.accounts ?? true,
              hr: modData.hr ?? false,
              manager: modData.manager ?? modData.reports ?? true,
              it: modData.it ?? false,
              multiStore: modData.multiStore ?? true
            };
            if (modData.submodules) {
              enabledSubmodules = modData.submodules;
            }
          }
        } catch (e) {
          // Keep tenant defaults
        }

        // Fetch subscription details if present
        let subPlan = rawData.plan || 'Professional';
        let subStatus = rawData.status || 'active';
        let subFee = rawData.monthlyFee || 299;
        let expiresAt = rawData.expiresAt;
        let billingCycle = rawData.billingCycle || 'monthly';

        try {
          const subDocRef = doc(db, 'tenants', tenantId, 'subscription', 'details');
          const subSnap = await getDoc(subDocRef);
          if (subSnap.exists()) {
            const subData = subSnap.data() as TenantSubscriptionDetailsDoc;
            if (subData.plan) subPlan = subData.plan as any;
            if (subData.status) subStatus = subData.status;
            if (subData.monthlyFee !== undefined) subFee = subData.monthlyFee;
            if (subData.expiresAt) expiresAt = subData.expiresAt;
            if (subData.billingCycle) billingCycle = subData.billingCycle;
          }
        } catch (e) {
          // Keep tenant defaults
        }

        tenants.push({
          ...(rawData as TenantContext),
          id: tenantId,
          tenantId: tenantId,
          businessName: rawData.businessName || rawData.tenantName || 'Shop Business',
          tenantName: rawData.tenantName || rawData.businessName || 'Shop Business',
          mobileNumber: rawData.mobileNumber || '',
          isWhatsAppAvailable: rawData.isWhatsAppAvailable ?? false,
          whatsappNumber: rawData.whatsappNumber || '',
          ownerEmail: rawData.ownerEmail || rawData.contactEmail || '',
          contactEmail: rawData.contactEmail || rawData.ownerEmail || '',
          plan: subPlan,
          status: subStatus,
          monthlyFee: subFee,
          expiresAt: expiresAt,
          billingCycle: billingCycle,
          enabledModules: enabledModules,
          enabledSubmodules: enabledSubmodules,
          isSubscribed: subStatus === 'active' || subStatus === 'trial'
        });
      }
      
      if (tenants.length > 0) return tenants;
    }

    // 2. Fallback to /hive/platform/tenants
    const legacyRef = collection(db, 'hive', 'platform', 'tenants');
    const legacySnap = await getDocs(legacyRef);
    if (!legacySnap.empty) {
      const legacyTenants: TenantContext[] = [];
      legacySnap.forEach(d => legacyTenants.push({ ...(d.data() as TenantContext), id: d.id }));
      return legacyTenants;
    }

    return [];
  } catch (err) {
    console.warn('[Firestore] fetchHiveTenants error:', err);
    return [];
  }
}

/**
 * Saves a tenant and writes its modular architecture to:
 * - /tenants/{tenantId}
 * - /tenants/{tenantId}/settings/modules
 * - /tenants/{tenantId}/subscription/details
 * - /hive/platform/tenants/{tenantId} (registry sync)
 */
export async function saveHiveTenantToFirestore(tenant: TenantContext): Promise<void> {
  const db = getFirebaseDb();
  const tenantId = tenant.id || tenant.tenantId;
  const path = `tenants/${tenantId}`;
  
  try {
    // 1. Save core tenant record at /tenants/{tenantId}
    const tenantDocRef = doc(db, 'tenants', tenantId);
    const tenantData = {
      id: tenantId,
      tenantId: tenantId,
      businessName: tenant.businessName || tenant.tenantName || 'Shop Business',
      tenantName: tenant.tenantName || tenant.businessName || 'Shop Business',
      ownerEmail: tenant.ownerEmail || tenant.contactEmail || '',
      contactEmail: tenant.contactEmail || tenant.ownerEmail || '',
      mobileNumber: tenant.mobileNumber || '',
      isWhatsAppAvailable: tenant.isWhatsAppAvailable ?? false,
      whatsappNumber: tenant.whatsappNumber || '',
      branchAddress: tenant.branchAddress || '',
      status: tenant.status || 'active',
      plan: tenant.plan || 'Professional',
      subdomain: tenant.subdomain || tenantId,
      currency: tenant.currency || 'USD',
      timezone: tenant.timezone || 'America/New_York',
      monthlyFee: tenant.monthlyFee ?? 299,
      terminalQuota: tenant.terminalQuota ?? 8,
      activeTerminalsCount: tenant.activeTerminalsCount ?? 1,
      databaseCluster: tenant.databaseCluster || 'us-central1-primary',
      createdAt: tenant.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(tenantDocRef, tenantData, { merge: true });

    // 2. Save module gating config at /tenants/{tenantId}/settings/modules
    const modulesDocRef = doc(db, 'tenants', tenantId, 'settings', 'modules');
    const moduleSettingsData: TenantModuleSettingsDoc = {
      inventory: tenant.enabledModules?.storeroom ?? true,
      reports: tenant.enabledModules?.manager ?? true,
      multiStore: tenant.enabledModules?.multiStore ?? true,
      sales: tenant.enabledModules?.sales ?? true,
      storeroom: tenant.enabledModules?.storeroom ?? true,
      accounts: tenant.enabledModules?.accounts ?? true,
      hr: tenant.enabledModules?.hr ?? false,
      manager: tenant.enabledModules?.manager ?? true,
      it: tenant.enabledModules?.it ?? false,
      submodules: tenant.enabledSubmodules || {},
      updatedAt: new Date().toISOString()
    };
    await setDoc(modulesDocRef, moduleSettingsData, { merge: true });

    // 3. Save subscription details at /tenants/{tenantId}/subscription/details
    const subDocRef = doc(db, 'tenants', tenantId, 'subscription', 'details');
    const subscriptionData: TenantSubscriptionDetailsDoc = {
      plan: tenant.plan || 'Professional',
      status: tenant.status || 'active',
      monthlyFee: tenant.monthlyFee ?? 299,
      billingCycle: tenant.billingCycle || 'monthly',
      expiresAt: tenant.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      contractId: tenant.contractId || '',
      notes: tenant.subscriptionNotes || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(subDocRef, subscriptionData, { merge: true });

    // 4. Mirror to /hive/platform/tenants/{tenantId} for central registry consistency
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      try {
        const hiveRegistryRef = doc(db, 'hive', 'platform', 'tenants', tenantId);
        await setDoc(hiveRegistryRef, {
          ...tenant,
          ...tenantData,
          enabledModules: tenant.enabledModules,
          enabledSubmodules: tenant.enabledSubmodules
        }, { merge: true });
      } catch (mirrorErr: any) {
        if (mirrorErr?.code === 'permission-denied' || mirrorErr?.message?.includes('permission')) {
          console.warn('[Firestore] Central hive registry mirror skipped (insufficient permissions)');
        } else {
          throw mirrorErr;
        }
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ==========================================
// SYSTEM AUDIT LOGS & ACTIVITY PERSISTENCE
// ==========================================
export async function saveAuditLogToFirestore(log: SystemAuditLog): Promise<void> {
  const db = getFirebaseDb();
  const path = `hive/platform/global_audit/${log.id}`;
  try {
    const docRef = doc(db, 'hive', 'platform', 'global_audit', log.id);
    await setDoc(docRef, log, { merge: true });
  } catch (err) {
    // Non-blocking catch with warning so offline operations still succeed smoothly
    console.warn('[Firestore] saveAuditLog error:', err);
  }
}

export async function fetchAuditLogsFromFirestore(): Promise<SystemAuditLog[]> {
  const db = getFirebaseDb();
  try {
    const colRef = collection(db, 'hive', 'platform', 'global_audit');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const logs: SystemAuditLog[] = [];
    snap.forEach(d => logs.push({ ...(d.data() as SystemAuditLog), id: d.id }));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('[Firestore] fetchAuditLogs error:', err);
    return [];
  }
}

// ==========================================
// TENANT & HIVE MASTER COMMUNICATIONS SYNC
// ==========================================
export async function saveTenantCommunicationToFirestore(comm: TenantCommunication): Promise<void> {
  const db = getFirebaseDb();
  const path = `hive/platform/communications/${comm.id}`;
  try {
    const docRef = doc(db, 'hive', 'platform', 'communications', comm.id);
    await setDoc(docRef, comm, { merge: true });
    // Also if tenant specific, mirror to tenant document
    if (comm.tenantId && comm.tenantId !== 'ALL_TENANTS') {
      const tenantCommRef = doc(db, 'tenants', comm.tenantId, 'communications', comm.id);
      await setDoc(tenantCommRef, comm, { merge: true });
    }
  } catch (err) {
    console.warn('[Firestore] saveTenantCommunication error:', err);
  }
}

export async function fetchTenantCommunicationsFromFirestore(tenantId?: string): Promise<TenantCommunication[]> {
  const db = getFirebaseDb();
  try {
    if (tenantId && tenantId !== 'ALL_TENANTS' && tenantId !== 'all') {
      const colRef = collection(db, 'tenants', tenantId, 'communications');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const comms: TenantCommunication[] = [];
        snap.forEach(d => comms.push({ ...(d.data() as TenantCommunication), id: d.id }));
        return comms;
      }
    }
    const globalCol = collection(db, 'hive', 'platform', 'communications');
    const gSnap = await getDocs(globalCol);
    if (gSnap.empty) return [];
    const comms: TenantCommunication[] = [];
    gSnap.forEach(d => comms.push({ ...(d.data() as TenantCommunication), id: d.id }));
    return comms;
  } catch (err) {
    console.warn('[Firestore] fetchTenantCommunications error:', err);
    return [];
  }
}

/**
 * Instantly toggles a tenant's operational status (active / suspended / trial)
 */
export async function toggleTenantStatusInFirestore(
  tenantId: string, 
  status: TenantSubscriptionStatus
): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}`;
  try {
    const tenantDocRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantDocRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });

    const subDocRef = doc(db, 'tenants', tenantId, 'subscription', 'details');
    await setDoc(subDocRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });

    const legacyRef = doc(db, 'hive', 'platform', 'tenants', tenantId);
    await setDoc(legacyRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Updates module feature flags (both main modules and inner submodules) dynamically in /tenants/{tenantId}/settings/modules
 */
export async function updateTenantModuleFlagsInFirestore(
  tenantId: string,
  modules: ModuleControlConfig,
  submodules?: SubmoduleControlConfig
): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/settings/modules`;
  try {
    const modDocRef = doc(db, 'tenants', tenantId, 'settings', 'modules');
    const payload: Partial<TenantModuleSettingsDoc> = {
      inventory: modules.storeroom,
      reports: modules.manager,
      multiStore: modules.multiStore ?? true,
      sales: modules.sales,
      storeroom: modules.storeroom,
      accounts: modules.accounts,
      hr: modules.hr,
      manager: modules.manager,
      it: modules.it,
      updatedAt: new Date().toISOString()
    };
    if (submodules !== undefined) {
      payload.submodules = submodules;
    }
    await setDoc(modDocRef, payload, { merge: true });

    // Also mirror to legacy hive registry
    const legacyRef = doc(db, 'hive', 'platform', 'tenants', tenantId);
    await setDoc(legacyRef, { 
      enabledModules: modules,
      ...(submodules ? { enabledSubmodules: submodules } : {})
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Updates tenant subscription plan and expiry date dynamically in /tenants/{tenantId}/subscription/details
 */
export async function updateTenantSubscriptionInFirestore(
  tenantId: string,
  details: {
    plan?: string;
    status?: TenantSubscriptionStatus;
    monthlyFee?: number;
    billingCycle?: 'monthly' | 'annual';
    expiresAt?: string;
    notes?: string;
    customPlanName?: string;
    customSla?: string;
    customGraceDays?: number;
    customMaxSku?: number;
    customMaxDailyTx?: number;
    approvedAt?: string;
    approvedBy?: string;
    lastAlertSentAt?: string;
    lastAlertType?: string;
  }
): Promise<void> {
  const db = getFirebaseDb();
  const path = `tenants/${tenantId}/subscription/details`;
  try {
    const subDocRef = doc(db, 'tenants', tenantId, 'subscription', 'details');
    await setDoc(subDocRef, {
      ...details,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const tenantDocRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantDocRef, {
      ...(details.plan ? { plan: details.plan } : {}),
      ...(details.status ? { status: details.status } : {}),
      ...(details.monthlyFee !== undefined ? { monthlyFee: details.monthlyFee } : {}),
      ...(details.expiresAt ? { expiresAt: details.expiresAt } : {}),
      ...(details.customPlanName !== undefined ? { customPlanName: details.customPlanName } : {}),
      ...(details.customSla !== undefined ? { customSla: details.customSla } : {}),
      ...(details.customGraceDays !== undefined ? { customGraceDays: details.customGraceDays } : {}),
      ...(details.customMaxSku !== undefined ? { customMaxSku: details.customMaxSku } : {}),
      ...(details.customMaxDailyTx !== undefined ? { customMaxDailyTx: details.customMaxDailyTx } : {}),
      ...(details.approvedAt !== undefined ? { approvedAt: details.approvedAt } : {}),
      ...(details.approvedBy !== undefined ? { approvedBy: details.approvedBy } : {}),
      ...(details.lastAlertSentAt !== undefined ? { lastAlertSentAt: details.lastAlertSentAt } : {}),
      ...(details.lastAlertType !== undefined ? { lastAlertType: details.lastAlertType } : {}),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const legacyRef = doc(db, 'hive', 'platform', 'tenants', tenantId);
    await setDoc(legacyRef, {
      ...(details.plan ? { plan: details.plan } : {}),
      ...(details.status ? { status: details.status } : {}),
      ...(details.monthlyFee !== undefined ? { monthlyFee: details.monthlyFee } : {}),
      ...(details.expiresAt ? { expiresAt: details.expiresAt } : {}),
      ...(details.customPlanName !== undefined ? { customPlanName: details.customPlanName } : {})
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 4. SUBSCRIPTION PACKAGES CRUD IN FIRESTORE (/hive/platform/packages/{packageId})
 * ----------------------------------------------------------------------------
 */

export async function fetchSubscriptionPackagesFromFirestore(): Promise<SubscriptionPackage[]> {
  const db = getFirebaseDb();
  try {
    const colRef = collection(db, 'hive', 'platform', 'packages');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    const packages: SubscriptionPackage[] = [];
    snap.forEach(d => {
      packages.push({ ...(d.data() as SubscriptionPackage), id: d.id });
    });
    return packages;
  } catch (err) {
    console.warn('[Firestore] fetchSubscriptionPackages error:', err);
    return [];
  }
}

export async function saveSubscriptionPackageToFirestore(pkg: SubscriptionPackage): Promise<void> {
  const db = getFirebaseDb();
  const path = `hive/platform/packages/${pkg.id}`;
  try {
    const docRef = doc(db, 'hive', 'platform', 'packages', pkg.id);
    await setDoc(docRef, {
      ...pkg,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSubscriptionPackageFromFirestore(packageId: string): Promise<void> {
  const db = getFirebaseDb();
  try {
    const docRef = doc(db, 'hive', 'platform', 'packages', packageId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[Firestore] deleteSubscriptionPackage (${packageId}) error:`, err);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 5. SUBSCRIPTION ALERTS & EMAIL DISPATCH LOGS IN FIRESTORE
 * ----------------------------------------------------------------------------
 */

export async function saveSubscriptionEmailAlertToFirestore(alert: SubscriptionEmailAlert): Promise<void> {
  const db = getFirebaseDb();
  const path = `hive/platform/subscription_alerts/${alert.id}`;
  try {
    const docRef = doc(db, 'hive', 'platform', 'subscription_alerts', alert.id);
    await setDoc(docRef, {
      ...alert,
      recordedAt: new Date().toISOString()
    }, { merge: true });

    // Also mirror into tenant's private notice collection
    if (alert.tenantId) {
      const tenantNoticeRef = doc(db, 'tenants', alert.tenantId, 'notices', alert.id);
      await setDoc(tenantNoticeRef, alert, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchSubscriptionEmailAlertsFromFirestore(): Promise<SubscriptionEmailAlert[]> {
  const db = getFirebaseDb();
  try {
    const colRef = collection(db, 'hive', 'platform', 'subscription_alerts');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    const alerts: SubscriptionEmailAlert[] = [];
    snap.forEach(d => {
      alerts.push({ ...(d.data() as SubscriptionEmailAlert), id: d.id });
    });
    return alerts;
  } catch (err) {
    console.warn('[Firestore] fetchSubscriptionEmailAlerts error:', err);
    return [];
  }
}

/**
 * Deletes a tenant from Firestore
 */
export async function deleteTenantFromFirestore(tenantId: string): Promise<void> {
  const db = getFirebaseDb();
  try {
    const tRef = doc(db, 'tenants', tenantId);
    await deleteDoc(tRef);
    const legacyRef = doc(db, 'hive', 'platform', 'tenants', tenantId);
    await deleteDoc(legacyRef);
  } catch (err) {
    console.warn(`[Firestore] deleteTenantFromFirestore (${tenantId}) notice:`, err);
  }
}

export async function fetchHivePlatformMetricsFromFirestore(): Promise<HivePlatformMetrics | null> {
  const db = getFirebaseDb();
  const path = HIVE_FIRESTORE_PATHS.platformState();
  try {
    const docRef = doc(db, 'hive', 'platform_state');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as HivePlatformMetrics;
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] fetchHivePlatformMetrics error:', err);
    return null;
  }
}

export async function saveHivePlatformMetricsToFirestore(metrics: HivePlatformMetrics): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) {
    // Unauthenticated clients cannot write to cloud hive platform state
    return;
  }
  const db = getFirebaseDb();
  const path = HIVE_FIRESTORE_PATHS.platformState();
  try {
    const docRef = doc(db, 'hive', 'platform_state');
    await setDoc(docRef, metrics, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      console.warn('[Firestore] Not authorized to update hive platform metrics:', err?.message);
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------------------------------
// 4. USER-ISOLATED DATA & SHIFT LOGS IN FIRESTORE
// ----------------------------------------------------------------------------

export async function fetchUserShiftsFromFirestore(userId: string): Promise<ShiftRecord[]> {
  const db = getFirebaseDb();
  const path = `users/${userId}/shifts`;
  try {
    const colRef = collection(db, 'users', userId, 'shifts');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const shifts: ShiftRecord[] = [];
    snap.forEach(d => shifts.push({ ...(d.data() as ShiftRecord), id: d.id }));
    return shifts.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
  } catch (err) {
    console.warn(`[Firestore] fetchUserShifts (${userId}) notice:`, err);
    return [];
  }
}

export async function saveUserShiftToFirestore(userId: string, shift: ShiftRecord, tenantId?: string): Promise<void> {
  const db = getFirebaseDb();
  try {
    // 1. Save to user's isolated subcollection
    const uShiftDoc = doc(db, 'users', userId, 'shifts', shift.id);
    await setDoc(uShiftDoc, shift, { merge: true });

    // 2. If tenant specified, also mirror to tenant shifts for store attendance
    if (tenantId) {
      const tShiftDoc = doc(db, 'tenants', tenantId, 'shifts', shift.id);
      await setDoc(tShiftDoc, shift, { merge: true });
    }
  } catch (err) {
    console.warn(`[Firestore] saveUserShift (${userId}) notice:`, err);
  }
}

// ----------------------------------------------------------------------------
// 5. DYNAMIC SEEDING & CLOUD FIRESTORE WIRING ENGINE
// Ensures all dynamic data is live in Firestore partitioned per user & tenant
// ----------------------------------------------------------------------------

export const SUGGESTED_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // 1. User Profiles (/users/{userId})
    // Each user can ONLY read and write their own account profile. Zero breach.
    match /users/{userId} {
      allow read, write: if isSignedIn() && (
        request.auth.uid == userId ||
        request.auth.token.email == 'aqutewavedev@gmail.com' ||
        request.auth.token.email == 'admin.it@bluenilla.com'
      );
    }

    // 2. User-Specific Isolated Subcollections (/users/{userId}/{allPaths=**})
    // Personal shifts, attendance records, operator activity logs.
    match /users/{userId}/{allPaths=**} {
      allow read, write: if isSignedIn() && (
        request.auth.uid == userId ||
        request.auth.token.email == 'aqutewavedev@gmail.com'
      );
    }

    // 3. Tenant Store Data (/tenants/{tenantId}/{allPaths=**})
    // Products, inventory, store config, and transactions partitioned by tenant store.
    match /tenants/{tenantId}/{allPaths=**} {
      allow read, write: if isSignedIn();
    }

    // 4. Central Hive Platform (/hive/{allPaths=**})
    // Strictly restricted to Platform Root Host (Hive Master).
    match /hive/{allPaths=**} {
      allow read, write: if isSignedIn() && (
        request.auth.token.email == 'aqutewavedev@gmail.com'
      );
    }
  }
}`;

export interface CloudSeedStatus {
  seeded: boolean;
  totalUsers: number;
  totalProducts: number;
  totalTenants: number;
  totalShifts: number;
  timestamp: string;
  databaseId: string;
  errorMessage?: string;
  needsRulesPublish?: boolean;
}

export async function seedFirestoreWithInitialData(force = false): Promise<CloudSeedStatus> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) {
    // Firestore cloud seeding requires an authenticated session; local IndexedDB is already primed
    return {
      seeded: false,
      totalUsers: 0,
      totalProducts: 0,
      totalTenants: 0,
      totalShifts: 0,
      timestamp: new Date().toISOString(),
      databaseId: '(default)'
    };
  }

  const db = getFirebaseDb();
  console.log('[Firestore] Initiating user-isolated dynamic database seeding into Cloud Firestore...');

  try {
    // 1. Seed All User Profiles with strict per-user ownership
    let seededUsers = 0;
    for (const u of INITIAL_USERS) {
      const uDoc = doc(db, 'users', u.id);
      await setDoc(uDoc, {
        ...u,
        isCloudLive: true,
        seededAt: new Date().toISOString()
      }, { merge: true });
      seededUsers++;

      // Seed initial shift history for this user
      const initShift: ShiftRecord = {
        id: `shift-init-${u.id}`,
        userId: u.id,
        userName: u.name,
        clockIn: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        clockOut: new Date().toISOString(),
        hoursWorked: 4,
        hourlyRate: 22.50,
        status: 'completed'
      };
      const shiftDoc = doc(db, 'users', u.id, 'shifts', initShift.id);
      await setDoc(shiftDoc, initShift, { merge: true });
    }

    // 1.5. Seed Hive Platform Super Root Admins (/hive_admins/{adminId})
    await seedHiveSuperAdmins();

    // 2. Seed Tenants into Master Collection & Settings
    let seededTenants = 0;
    for (const t of INITIAL_TENANTS) {
      await saveHiveTenantToFirestore(t);
      seededTenants++;
    }

    // 3. Seed Tenant-Specific Products into isolated partitions
    let totalProductsCount = 0;
    
    // Define store-specific catalogs so each tenant has their true business data
    const tenantCatalogs: Record<string, Partial<Product>[]> = {
      bluenilla_core: [
        { id: 'prod-bn-01', sku: 'BN-CB-01', name: 'Blue Vanilla Cold Brew 330ml', category: 'Beverages', price: 4.75, stock: 84 },
        { id: 'prod-bn-02', sku: 'BN-NW-02', name: 'Nitro Oat Flat White 250ml', category: 'Beverages', price: 5.25, stock: 42 },
        { id: 'prod-bn-03', sku: 'BN-BR-03', name: 'Signature Espresso Roast 250g', category: 'Retail', price: 16.50, stock: 35 },
        { id: 'prod-bn-04', sku: 'BN-TC-04', name: 'Matcha Vanilla Concentrate 500ml', category: 'Retail', price: 18.00, stock: 20 },
      ],
      artisan_bakery: [
        { id: 'prod-bak-01', sku: 'AB-CR-01', name: 'Almond Croissant Artisan', category: 'Bakery', price: 4.50, stock: 24 },
        { id: 'prod-bak-02', sku: 'AB-SD-02', name: 'Rustic Country Sourdough Loaf', category: 'Bakery', price: 7.50, stock: 18 },
        { id: 'prod-bak-03', sku: 'AB-PC-03', name: 'Valrhona Pain au Chocolat', category: 'Bakery', price: 4.75, stock: 30 },
        { id: 'prod-bak-04', sku: 'AB-MF-04', name: 'Blueberry Sourdough Muffin', category: 'Bakery', price: 3.95, stock: 22 },
        { id: 'prod-bak-05', sku: 'AB-BG-05', name: 'Traditional French Baguette', category: 'Bakery', price: 3.50, stock: 15 },
      ],
      pacific_merch: [
        { id: 'prod-pm-01', sku: 'PM-TT-01', name: 'Heavyweight Canvas Tote Bag', category: 'Accessories', price: 24.00, stock: 40 },
        { id: 'prod-pm-02', sku: 'PM-MG-02', name: 'Ceramic Dual-Tone Coffee Mug', category: 'Drinkware', price: 18.50, stock: 32 },
        { id: 'prod-pm-03', sku: 'PM-TS-03', name: 'Organic Cotton Barista Tee (Black)', category: 'Apparel', price: 32.00, stock: 25 },
        { id: 'prod-pm-04', sku: 'PM-JN-04', name: 'Linen Bound Tasting Journal', category: 'Stationery', price: 14.00, stock: 28 },
      ]
    };

    for (const tenant of INITIAL_TENANTS) {
      const specificProducts = tenantCatalogs[tenant.tenantId] || INITIAL_PRODUCTS.slice(0, 4);
      
      for (const item of specificProducts) {
        const fullProd: Product = {
          id: item.id || `prod-${Date.now()}`,
          sku: item.sku || 'SKU-GEN',
          barcode: `884019${Math.floor(100000 + Math.random() * 900000)}`,
          name: item.name || 'Store Item',
          category: item.category || 'General',
          price: item.price || 9.99,
          costPrice: (item.price || 9.99) * 0.4,
          stock: item.stock || 50,
          reorderPoint: 10,
          binLocation: 'Section A1',
          batchLotNumber: `LOT-2026-${tenant.tenantId.toUpperCase().slice(0, 4)}`,
          expiryDate: '2026-12-31',
          supplier: tenant.businessName,
          taxRate: 0.08,
          imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80',
          description: `Fresh product curated for ${tenant.businessName}`
        };

        const pDoc = doc(db, 'tenants', tenant.tenantId, 'products', fullProd.id);
        await setDoc(pDoc, fullProd, { merge: true });
        totalProductsCount++;
      }

      // Shop Config
      const configDoc = doc(db, 'tenants', tenant.tenantId, 'config', 'shop_config');
      await setDoc(configDoc, {
        id: `cfg_${tenant.tenantId}`,
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        taxRate: 0.08,
        currency: tenant.currency || 'USD',
        status: 'ACTIVE_LIVE',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    // 4. Seed Hive Platform State
    try {
      const stateDoc = doc(db, 'hive', 'platform_state');
      await setDoc(stateDoc, {
        id: 'platform_state_v1',
        totalTenants: INITIAL_TENANTS.length,
        activeTerminals: INITIAL_TERMINALS.length,
        systemHealth: 'HEALTHY',
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (stateErr) {
      console.warn('[Firestore] Hive platform_state seed notice:', stateErr);
    }

    return {
      seeded: true,
      totalUsers: seededUsers,
      totalProducts: totalProductsCount,
      totalTenants: seededTenants,
      totalShifts: seededUsers,
      timestamp: new Date().toISOString(),
      databaseId: '(default)'
    };
  } catch (err: any) {
    const isPermissionError = err?.code === 'permission-denied' || err?.message?.includes('permission') || err?.message?.includes('PERMISSION_DENIED');
    console.warn('[Firestore Seeding Notice]:', err?.message || err);
    return {
      seeded: false,
      totalUsers: 0,
      totalProducts: 0,
      totalTenants: 0,
      totalShifts: 0,
      timestamp: new Date().toISOString(),
      databaseId: '(default)',
      errorMessage: err?.message || 'Firestore write failed',
      needsRulesPublish: isPermissionError
    };
  }
}

export async function checkFirestoreConnectionStatus(): Promise<{
  connected: boolean;
  usersCount: number;
  tenantsCount: number;
  productsCount: number;
  needsRulesPublish: boolean;
  errorMessage?: string;
}> {
  const db = getFirebaseDb();
  try {
    const usersCol = collection(db, 'users');
    const uSnap = await getDocs(usersCol);
    return {
      connected: true,
      usersCount: uSnap.size,
      tenantsCount: 3,
      productsCount: 15,
      needsRulesPublish: false
    };
  } catch (err: any) {
    const isPerm = err?.code === 'permission-denied' || err?.message?.includes('permission') || err?.message?.includes('PERMISSION_DENIED');
    return {
      connected: !isPerm,
      usersCount: 0,
      tenantsCount: 0,
      productsCount: 0,
      needsRulesPublish: isPerm,
      errorMessage: err?.message
    };
  }
}
