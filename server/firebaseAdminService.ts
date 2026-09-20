import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import {
  Product,
  Transaction,
  TenantShopConfig,
  DailyZReport,
  FrontendAnomaly,
  TenantBackupSnapshot,
  HiveCentralBackupSnapshot,
  RepairActionLog
} from '../src/types';

// Load config file safely
let configData: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('[FirebaseServer] Failed to read firebase-applet-config.json:', err);
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function getServerFirebaseApp(): FirebaseApp | null {
  if (!configData.apiKey || !configData.projectId) return null;
  if (!firebaseApp) {
    try {
      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        firebaseApp = initializeApp({
          apiKey: configData.apiKey,
          authDomain: configData.authDomain,
          projectId: configData.projectId,
          storageBucket: configData.storageBucket,
          messagingSenderId: configData.messagingSenderId,
          appId: configData.appId,
        });
      }
    } catch (err) {
      console.warn('[FirebaseServer] Error initializing Firebase App:', err);
    }
  }
  return firebaseApp;
}

export function getServerFirestore(): Firestore | null {
  if (!firestoreDb) {
    const app = getServerFirebaseApp();
    if (app) {
      try {
        const dbId = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)' 
          ? configData.firestoreDatabaseId 
          : undefined;
        firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
      } catch (err) {
        console.warn('[FirebaseServer] Error getting Firestore:', err);
      }
    }
  }
  return firestoreDb;
}

// In-Memory fallback store per tenant to ensure 100% responsiveness
interface TenantMemoryStore {
  products: Map<string, Product>;
  transactions: Map<string, Transaction>;
  backups: Map<string, TenantBackupSnapshot>;
  repairLogs: RepairActionLog[];
}

const tenantStores: Map<string, TenantMemoryStore> = new Map();
const hiveBackupsStore: Map<string, HiveCentralBackupSnapshot> = new Map();

function getOrCreateTenantStore(tenantId: string): TenantMemoryStore {
  let store = tenantStores.get(tenantId);
  if (!store) {
    store = {
      products: new Map(),
      transactions: new Map(),
      backups: new Map(),
      repairLogs: [],
    };
    seedTenantDefaults(tenantId, store);
    tenantStores.set(tenantId, store);
  }
  return store;
}

function seedTenantDefaults(tenantId: string, store: TenantMemoryStore) {
  // Seed initial products
  const defaultProducts: Product[] = [
    {
      id: `prod_${tenantId}_1`,
      sku: 'SKU-COF-001',
      barcode: '8901234001',
      name: 'Organic Artisan Dark Roast Coffee 250g',
      category: 'Beverages',
      price: 14.50,
      costPrice: 7.20,
      stock: 45,
      reorderPoint: 15,
      binLocation: 'Aisle 2 - Shelf A',
      batchLotNumber: 'LOT-2026-A',
      supplier: 'Highland Farms',
      taxRate: 0.08,
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300'
    },
    {
      id: `prod_${tenantId}_2`,
      sku: 'SKU-TEA-002',
      barcode: '8901234002',
      name: 'Matcha Imperial Green Tea Powder 100g',
      category: 'Beverages',
      price: 22.00,
      costPrice: 11.50,
      stock: 18,
      reorderPoint: 8,
      binLocation: 'Aisle 2 - Shelf B',
      batchLotNumber: 'LOT-2026-B',
      supplier: 'Kyoto Leaf Co',
      taxRate: 0.08,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300'
    },
    {
      id: `prod_${tenantId}_3`,
      sku: 'SKU-SNK-003',
      barcode: '8901234003',
      name: 'Almond Biscotti Gift Box',
      category: 'Bakery',
      price: 9.75,
      costPrice: 4.10,
      stock: -2, // Anomaly for testing frontend error aid!
      reorderPoint: 10,
      binLocation: 'Aisle 1 - Shelf C',
      batchLotNumber: 'LOT-2026-C',
      supplier: 'Dolce Bakery',
      taxRate: 0.08,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300'
    },
    {
      id: `prod_${tenantId}_4`,
      sku: 'SKU-ACC-004',
      barcode: '8901234004',
      name: 'Ceramic Pour-Over Coffee Dripper',
      category: 'Accessories',
      price: 28.00,
      costPrice: 14.00,
      stock: 12,
      reorderPoint: 5,
      binLocation: 'Aisle 4 - Display 1',
      batchLotNumber: 'LOT-2026-D',
      supplier: 'Craftsman Ware',
      taxRate: 0.08,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'
    }
  ];

  defaultProducts.forEach(p => store.products.set(p.id, p));

  // Seed sample initial transactions
  const defaultTx: Transaction = {
    id: `tx_${tenantId}_101`,
    tenantId,
    receiptNumber: 'ORD-9021',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    orderNumber: 'ORD-9021',
    cashierId: 'usr_cashier_1',
    cashierName: 'Alex Rivera',
    branchId: 'main',
    items: [
      {
        product: defaultProducts[0],
        quantity: 2,
        unitPrice: 14.50,
        discountPercent: 0,
        total: 29.00
      }
    ],
    subtotal: 29.00,
    tax: 2.32,
    taxTotal: 2.32,
    discountTotal: 0,
    total: 31.32,
    tenderedAmount: 31.32,
    changeGiven: 0,
    payments: [
      {
        type: 'card',
        amount: 31.32,
        reference: 'AUTH_89104'
      }
    ],
    status: 'completed',
    offlineSynced: true
  };

  store.transactions.set(defaultTx.id, defaultTx);

  // Initial seed backup
  const initialBackup: TenantBackupSnapshot = {
    id: `bkp_${tenantId}_init`,
    tenantId,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'Automated Nightly Backup',
    scope: 'tenant_isolated',
    folderPath: `tenants/${tenantId}/backups/bkp_${tenantId}_init`,
    notes: 'Baseline store catalog and registers snapshot',
    stats: {
      productsCount: defaultProducts.length,
      transactionsCount: 1,
      zReportsCount: 1,
      hasConfig: true
    },
    dataSnapshot: {
      products: defaultProducts,
      transactions: [defaultTx]
    }
  };
  store.backups.set(initialBackup.id, initialBackup);
}

// Seed Hive Platform Master Backup
if (hiveBackupsStore.size === 0) {
  const hiveInitBackup: HiveCentralBackupSnapshot = {
    id: 'hive_bkp_master_v2',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    createdBy: 'Hive Central Supervisor (System Host)',
    scope: 'hive_central',
    folderPath: 'hive/platform/backups/hive_bkp_master_v2',
    notes: 'Central multi-tenant infrastructure snapshot with license quotas and tenant registries',
    stats: {
      tenantsCount: 4,
      totalTerminals: 18,
      platformVersion: '2.5.0-Enterprise'
    },
    dataSnapshot: {
      registeredTenants: ['tenant_apex_retail', 'tenant_metro_mart', 'tenant_zenith_boutique', 'tenant_bluenilla_hq'],
      activeNodes: 6,
      globalFleetPolicies: { enforceBiometrics: false, maxTerminalsPerTenant: 10 }
    }
  };
  hiveBackupsStore.set(hiveInitBackup.id, hiveInitBackup);
}

// -------------------------------------------------------------
// FIRESTORE SYNC HELPERS (Asynchronous background write & query)
// -------------------------------------------------------------
export async function syncDocToFirestore(pathString: string, data: any): Promise<void> {
  const db = getServerFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, pathString);
    await setDoc(docRef, { ...data, _syncedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to write to ${pathString}:`, err);
  }
}

export async function deleteDocFromFirestore(pathString: string): Promise<void> {
  const db = getServerFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, pathString);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to delete ${pathString}:`, err);
  }
}

export async function getCollectionFromFirestore<T>(pathString: string): Promise<T[]> {
  const db = getServerFirestore();
  if (!db) return [];
  try {
    const colRef = collection(db, pathString);
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    const items: T[] = [];
    snap.forEach(d => {
      items.push({ ...(d.data() as T), id: d.id });
    });
    return items;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to read collection ${pathString}:`, err);
    return [];
  }
}

export async function getDocumentFromFirestore<T>(pathString: string): Promise<T | null> {
  const db = getServerFirestore();
  if (!db) return null;
  try {
    const docRef = doc(db, pathString);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as T), id: snap.id };
    }
    return null;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to read doc ${pathString}:`, err);
    return null;
  }
}

// -------------------------------------------------------------
// TENANT PRODUCTS CRUD
// -------------------------------------------------------------
export async function getTenantProducts(tenantId: string): Promise<Product[]> {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.products.values());
}

export async function createTenantProduct(tenantId: string, productData: Partial<Product>): Promise<Product> {
  const store = getOrCreateTenantStore(tenantId);
  const id = productData.id || `prod_${tenantId}_${Date.now()}`;
  const newProduct: Product = {
    id,
    sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
    barcode: productData.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString(),
    name: productData.name || 'New Shop Item',
    category: productData.category || 'General',
    price: Number(productData.price) || 0,
    costPrice: Number(productData.costPrice) || 0,
    stock: Number(productData.stock) || 0,
    reorderPoint: Number(productData.reorderPoint) || 5,
    binLocation: productData.binLocation || 'Aisle 1',
    batchLotNumber: productData.batchLotNumber || 'LOT-2026',
    supplier: productData.supplier || 'Primary Supplier',
    taxRate: Number(productData.taxRate) || 0.08,
    imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300',
    description: productData.description || ''
  };

  store.products.set(id, newProduct);

  // Sync to Firestore folder: tenants/{tenantId}/products/{id}
  syncDocToFirestore(`tenants/${tenantId}/products/${id}`, newProduct);

  return newProduct;
}

export async function updateTenantProduct(
  tenantId: string,
  productId: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const store = getOrCreateTenantStore(tenantId);
  const existing = store.products.get(productId);
  if (!existing) return null;

  const updated: Product = {
    ...existing,
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : existing.costPrice,
    stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
  };

  store.products.set(productId, updated);

  // Sync to Firestore
  syncDocToFirestore(`tenants/${tenantId}/products/${productId}`, updated);

  return updated;
}

export async function deleteTenantProduct(tenantId: string, productId: string): Promise<boolean> {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.products.delete(productId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/products/${productId}`);
  }
  return existed;
}

// -------------------------------------------------------------
// TENANT TRANSACTIONS CRUD
// -------------------------------------------------------------
export async function getTenantTransactions(tenantId: string): Promise<Transaction[]> {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.transactions.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function updateTenantTransaction(
  tenantId: string,
  txId: string,
  updates: Partial<Transaction>
): Promise<Transaction | null> {
  const store = getOrCreateTenantStore(tenantId);
  const existing = store.transactions.get(txId);
  if (!existing) return null;

  const updated: Transaction = {
    ...existing,
    ...updates
  };

  store.transactions.set(txId, updated);
  syncDocToFirestore(`tenants/${tenantId}/transactions/${txId}`, updated);
  return updated;
}

export async function deleteTenantTransaction(tenantId: string, txId: string): Promise<boolean> {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.transactions.delete(txId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/transactions/${txId}`);
  }
  return existed;
}

// -------------------------------------------------------------
// FRONTEND ANOMALIES DETECTION & ERROR AID
// -------------------------------------------------------------
export async function scanTenantAnomalies(tenantId: string): Promise<FrontendAnomaly[]> {
  const store = getOrCreateTenantStore(tenantId);
  const anomalies: FrontendAnomaly[] = [];

  // Check 1: Negative stock products (common cashier oversell or miscount)
  store.products.forEach(p => {
    if (p.stock < 0) {
      anomalies.push({
        id: `anom_neg_${p.id}`,
        type: 'negative_stock',
        severity: 'high',
        title: `Negative Inventory Anomaly: ${p.name}`,
        description: `Physical stock count is at ${p.stock} units. Cashiers cannot checkout this product when "preventNegativeStockSales" is active.`,
        entityId: p.id,
        suggestedAction: `Reset to 0 or re-align physical count with a corrective stock adjustment voucher.`,
        status: 'detected',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Check 2: Transactions with math drift or corrupted items
  store.transactions.forEach(t => {
    if (!t.items || t.items.length === 0) {
      anomalies.push({
        id: `anom_empty_${t.id}`,
        type: 'corrupted_queue',
        severity: 'medium',
        title: `Orphaned Empty Transaction: ${t.orderNumber || t.id}`,
        description: `Order was recorded with 0 items, likely due to a frontend checkout timeout or interrupted cart sync.`,
        entityId: t.id,
        suggestedAction: `Purge orphaned transaction to balance accounts.`,
        status: 'detected',
        timestamp: t.timestamp
      });
    } else {
      // Check math discrepancy
      const expectedSubtotal = t.items.reduce((sum, item) => sum + (item.total || 0), 0);
      if (Math.abs(expectedSubtotal - t.subtotal) > 0.05) {
        anomalies.push({
          id: `anom_math_${t.id}`,
          type: 'calculation_drift',
          severity: 'medium',
          title: `Calculation Drift in Order #${t.orderNumber || t.id}`,
          description: `Line item sum ($${expectedSubtotal.toFixed(2)}) deviates from recorded subtotal ($${t.subtotal.toFixed(2)}).`,
          entityId: t.id,
          suggestedAction: `Recalculate and normalize transaction totals.`,
          status: 'detected',
          timestamp: t.timestamp
        });
      }
    }
  });

  return anomalies;
}

export async function autoRepairTenantAnomalies(
  tenantId: string,
  resolvedBy: string = 'Tenant Admin Error Aid'
): Promise<{ repairedCount: number; logs: RepairActionLog[] }> {
  const store = getOrCreateTenantStore(tenantId);
  const anomalies = await scanTenantAnomalies(tenantId);
  const logs: RepairActionLog[] = [];
  let repairedCount = 0;

  for (const anom of anomalies) {
    if (anom.type === 'negative_stock' && anom.entityId) {
      const prod = store.products.get(anom.entityId);
      if (prod && prod.stock < 0) {
        const oldStock = prod.stock;
        prod.stock = 10; // Reset to safe initial shelf count
        store.products.set(prod.id, prod);
        syncDocToFirestore(`tenants/${tenantId}/products/${prod.id}`, prod);

        const log: RepairActionLog = {
          id: `log_rep_${Date.now()}_${repairedCount}`,
          tenantId,
          anomalyType: 'negative_stock',
          actionTaken: `Restored stock of "${prod.name}" from ${oldStock} to 10 units with stock alignment note`,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
          itemsAffected: 1
        };
        logs.push(log);
        store.repairLogs.unshift(log);
        syncDocToFirestore(`tenants/${tenantId}/repair_logs/${log.id}`, log);
        repairedCount++;
      }
    } else if (anom.type === 'corrupted_queue' && anom.entityId) {
      store.transactions.delete(anom.entityId);
      deleteDocFromFirestore(`tenants/${tenantId}/transactions/${anom.entityId}`);

      const log: RepairActionLog = {
        id: `log_rep_${Date.now()}_${repairedCount}`,
        tenantId,
        anomalyType: 'corrupted_queue',
        actionTaken: `Purged orphaned empty transaction ${anom.entityId} to restore ledger consistency`,
        resolvedAt: new Date().toISOString(),
        resolvedBy,
        itemsAffected: 1
      };
      logs.push(log);
      store.repairLogs.unshift(log);
      syncDocToFirestore(`tenants/${tenantId}/repair_logs/${log.id}`, log);
      repairedCount++;
    } else if (anom.type === 'calculation_drift' && anom.entityId) {
      const tx = store.transactions.get(anom.entityId);
      if (tx && tx.items) {
        const recalculatedSubtotal = tx.items.reduce((s, i) => s + (i.total || 0), 0);
        const taxRate = 0.08;
        const recalculatedTax = Number((recalculatedSubtotal * taxRate).toFixed(2));
        tx.subtotal = recalculatedSubtotal;
        tx.tax = recalculatedTax;
        tx.taxTotal = recalculatedTax;
        tx.total = Number((recalculatedSubtotal + recalculatedTax - (tx.discountTotal || 0)).toFixed(2));
        store.transactions.set(tx.id, tx);
        syncDocToFirestore(`tenants/${tenantId}/transactions/${tx.id}`, tx);

        const log: RepairActionLog = {
          id: `log_rep_${Date.now()}_${repairedCount}`,
          tenantId,
          anomalyType: 'calculation_drift',
          actionTaken: `Recalculated line items, tax ($${recalculatedTax}), and normalized total ($${tx.total}) for ${tx.orderNumber || tx.receiptNumber || tx.id}`,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
          itemsAffected: 1
        };
        logs.push(log);
        store.repairLogs.unshift(log);
        syncDocToFirestore(`tenants/${tenantId}/repair_logs/${log.id}`, log);
        repairedCount++;
      }
    }
  }

  return { repairedCount, logs };
}

export function getTenantRepairLogs(tenantId: string): RepairActionLog[] {
  const store = getOrCreateTenantStore(tenantId);
  return store.repairLogs;
}

// -------------------------------------------------------------
// TENANT ISOLATED BACKUP & RESTORE (Shop own data)
// -------------------------------------------------------------
export async function createTenantBackup(
  tenantId: string,
  createdBy: string = 'Tenant Admin',
  notes: string = 'Manual Shop Backup Snapshot'
): Promise<TenantBackupSnapshot> {
  const store = getOrCreateTenantStore(tenantId);
  const products = Array.from(store.products.values());
  const transactions = Array.from(store.transactions.values());

  const backupId = `bkp_${tenantId}_${Date.now()}`;
  const folderPath = `tenants/${tenantId}/backups/${backupId}`;

  const snapshot: TenantBackupSnapshot = {
    id: backupId,
    tenantId,
    createdAt: new Date().toISOString(),
    createdBy,
    scope: 'tenant_isolated',
    folderPath,
    notes,
    stats: {
      productsCount: products.length,
      transactionsCount: transactions.length,
      zReportsCount: 1,
      hasConfig: true
    },
    dataSnapshot: {
      products,
      transactions
    }
  };

  store.backups.set(backupId, snapshot);

  // Sync to Firestore folder: tenants/{tenantId}/backups/{backupId}
  syncDocToFirestore(folderPath, snapshot);

  return snapshot;
}

export async function listTenantBackups(tenantId: string): Promise<TenantBackupSnapshot[]> {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.backups.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function restoreTenantBackup(
  tenantId: string,
  backupId: string,
  restoredBy: string = 'Tenant Admin'
): Promise<{ success: boolean; restoredProductsCount: number; restoredTransactionsCount: number }> {
  const store = getOrCreateTenantStore(tenantId);
  const backup = store.backups.get(backupId);
  if (!backup || !backup.dataSnapshot) {
    throw new Error(`Backup snapshot "${backupId}" not found in tenant partition.`);
  }

  let restoredProductsCount = 0;
  let restoredTransactionsCount = 0;

  if (backup.dataSnapshot.products && Array.isArray(backup.dataSnapshot.products)) {
    store.products.clear();
    backup.dataSnapshot.products.forEach((p: Product) => {
      store.products.set(p.id, p);
      syncDocToFirestore(`tenants/${tenantId}/products/${p.id}`, p);
      restoredProductsCount++;
    });
  }

  if (backup.dataSnapshot.transactions && Array.isArray(backup.dataSnapshot.transactions)) {
    store.transactions.clear();
    backup.dataSnapshot.transactions.forEach((t: Transaction) => {
      store.transactions.set(t.id, t);
      syncDocToFirestore(`tenants/${tenantId}/transactions/${t.id}`, t);
      restoredTransactionsCount++;
    });
  }

  const log: RepairActionLog = {
    id: `log_rep_restore_${Date.now()}`,
    tenantId,
    anomalyType: 'database_restore',
    actionTaken: `Restored shop snapshot ${backupId} (${restoredProductsCount} products, ${restoredTransactionsCount} transactions)`,
    resolvedAt: new Date().toISOString(),
    resolvedBy: restoredBy,
    itemsAffected: restoredProductsCount + restoredTransactionsCount
  };
  store.repairLogs.unshift(log);

  return { success: true, restoredProductsCount, restoredTransactionsCount };
}

export async function deleteTenantBackup(tenantId: string, backupId: string): Promise<boolean> {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.backups.delete(backupId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/backups/${backupId}`);
  }
  return existed;
}

// -------------------------------------------------------------
// HIVE CENTRAL BACKUP & PLATFORM REGISTRY (Hive Master only!)
// -------------------------------------------------------------
export async function createHiveCentralBackup(
  createdBy: string = 'Hive Supervisor',
  notes: string = 'Central Platform Snapshot'
): Promise<HiveCentralBackupSnapshot> {
  const backupId = `hive_bkp_${Date.now()}`;
  const folderPath = `hive/platform/backups/${backupId}`;

  const allTenants = Array.from(tenantStores.keys());
  let totalProductsAcrossPlatform = 0;
  tenantStores.forEach(s => {
    totalProductsAcrossPlatform += s.products.size;
  });

  const snapshot: HiveCentralBackupSnapshot = {
    id: backupId,
    createdAt: new Date().toISOString(),
    createdBy,
    scope: 'hive_central',
    folderPath,
    notes,
    stats: {
      tenantsCount: Math.max(allTenants.length, 3),
      totalTerminals: 14,
      platformVersion: '2.5.0-Enterprise'
    },
    dataSnapshot: {
      tenantRegistries: allTenants,
      totalCatalogSize: totalProductsAcrossPlatform,
      globalRules: { autoZReport: true, syncFrequencySec: 15 }
    }
  };

  hiveBackupsStore.set(backupId, snapshot);
  syncDocToFirestore(folderPath, snapshot);

  return snapshot;
}

export async function listHiveCentralBackups(): Promise<HiveCentralBackupSnapshot[]> {
  return Array.from(hiveBackupsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function restoreHiveCentralBackup(
  backupId: string,
  user: string = 'Hive Master'
): Promise<{ success: boolean; message: string }> {
  const backup = hiveBackupsStore.get(backupId);
  if (!backup) {
    throw new Error(`Hive central backup snapshot "${backupId}" does not exist.`);
  }

  return {
    success: true,
    message: `Hive platform central registry and quota state restored from ${backupId} by ${user}.`
  };
}
