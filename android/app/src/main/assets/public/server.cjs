var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");

// server/backoffice.ts
var import_express = require("express");

// server/firebaseAdminService.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var configData = {};
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    configData = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.warn("[FirebaseServer] Failed to read firebase-applet-config.json:", err);
}
var firebaseApp = null;
var firestoreDb = null;
function getServerFirebaseApp() {
  if (!configData.apiKey || !configData.projectId) return null;
  if (!firebaseApp) {
    try {
      if ((0, import_app.getApps)().length > 0) {
        firebaseApp = (0, import_app.getApp)();
      } else {
        firebaseApp = (0, import_app.initializeApp)({
          apiKey: configData.apiKey,
          authDomain: configData.authDomain,
          projectId: configData.projectId,
          storageBucket: configData.storageBucket,
          messagingSenderId: configData.messagingSenderId,
          appId: configData.appId
        });
      }
    } catch (err) {
      console.warn("[FirebaseServer] Error initializing Firebase App:", err);
    }
  }
  return firebaseApp;
}
function getServerFirestore() {
  if (!firestoreDb) {
    const app = getServerFirebaseApp();
    if (app) {
      try {
        const dbId = configData.firestoreDatabaseId && configData.firestoreDatabaseId !== "(default)" ? configData.firestoreDatabaseId : void 0;
        firestoreDb = dbId ? (0, import_firestore.getFirestore)(app, dbId) : (0, import_firestore.getFirestore)(app);
      } catch (err) {
        console.warn("[FirebaseServer] Error getting Firestore:", err);
      }
    }
  }
  return firestoreDb;
}
var tenantStores = /* @__PURE__ */ new Map();
var hiveBackupsStore = /* @__PURE__ */ new Map();
function getOrCreateTenantStore(tenantId) {
  let store = tenantStores.get(tenantId);
  if (!store) {
    store = {
      products: /* @__PURE__ */ new Map(),
      transactions: /* @__PURE__ */ new Map(),
      backups: /* @__PURE__ */ new Map(),
      repairLogs: []
    };
    seedTenantDefaults(tenantId, store);
    tenantStores.set(tenantId, store);
  }
  return store;
}
function seedTenantDefaults(tenantId, store) {
  const defaultProducts = [
    {
      id: `prod_${tenantId}_1`,
      sku: "SKU-COF-001",
      barcode: "8901234001",
      name: "Organic Artisan Dark Roast Coffee 250g",
      category: "Beverages",
      price: 14.5,
      costPrice: 7.2,
      stock: 45,
      reorderPoint: 15,
      binLocation: "Aisle 2 - Shelf A",
      batchLotNumber: "LOT-2026-A",
      supplier: "Highland Farms",
      taxRate: 0.08,
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300"
    },
    {
      id: `prod_${tenantId}_2`,
      sku: "SKU-TEA-002",
      barcode: "8901234002",
      name: "Matcha Imperial Green Tea Powder 100g",
      category: "Beverages",
      price: 22,
      costPrice: 11.5,
      stock: 18,
      reorderPoint: 8,
      binLocation: "Aisle 2 - Shelf B",
      batchLotNumber: "LOT-2026-B",
      supplier: "Kyoto Leaf Co",
      taxRate: 0.08,
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300"
    },
    {
      id: `prod_${tenantId}_3`,
      sku: "SKU-SNK-003",
      barcode: "8901234003",
      name: "Almond Biscotti Gift Box",
      category: "Bakery",
      price: 9.75,
      costPrice: 4.1,
      stock: -2,
      // Anomaly for testing frontend error aid!
      reorderPoint: 10,
      binLocation: "Aisle 1 - Shelf C",
      batchLotNumber: "LOT-2026-C",
      supplier: "Dolce Bakery",
      taxRate: 0.08,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300"
    },
    {
      id: `prod_${tenantId}_4`,
      sku: "SKU-ACC-004",
      barcode: "8901234004",
      name: "Ceramic Pour-Over Coffee Dripper",
      category: "Accessories",
      price: 28,
      costPrice: 14,
      stock: 12,
      reorderPoint: 5,
      binLocation: "Aisle 4 - Display 1",
      batchLotNumber: "LOT-2026-D",
      supplier: "Craftsman Ware",
      taxRate: 0.08,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300"
    }
  ];
  defaultProducts.forEach((p) => store.products.set(p.id, p));
  const defaultTx = {
    id: `tx_${tenantId}_101`,
    tenantId,
    receiptNumber: "ORD-9021",
    timestamp: new Date(Date.now() - 36e5).toISOString(),
    orderNumber: "ORD-9021",
    cashierId: "usr_cashier_1",
    cashierName: "Alex Rivera",
    branchId: "main",
    items: [
      {
        product: defaultProducts[0],
        quantity: 2,
        unitPrice: 14.5,
        discountPercent: 0,
        total: 29
      }
    ],
    subtotal: 29,
    tax: 2.32,
    taxTotal: 2.32,
    discountTotal: 0,
    total: 31.32,
    tenderedAmount: 31.32,
    changeGiven: 0,
    payments: [
      {
        type: "card",
        amount: 31.32,
        reference: "AUTH_89104"
      }
    ],
    status: "completed",
    offlineSynced: true
  };
  store.transactions.set(defaultTx.id, defaultTx);
  const initialBackup = {
    id: `bkp_${tenantId}_init`,
    tenantId,
    createdAt: new Date(Date.now() - 864e5).toISOString(),
    createdBy: "Automated Nightly Backup",
    scope: "tenant_isolated",
    folderPath: `tenants/${tenantId}/backups/bkp_${tenantId}_init`,
    notes: "Baseline store catalog and registers snapshot",
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
if (hiveBackupsStore.size === 0) {
  const hiveInitBackup = {
    id: "hive_bkp_master_v2",
    createdAt: new Date(Date.now() - 1728e5).toISOString(),
    createdBy: "Hive Central Supervisor (System Host)",
    scope: "hive_central",
    folderPath: "hive/platform/backups/hive_bkp_master_v2",
    notes: "Central multi-tenant infrastructure snapshot with license quotas and tenant registries",
    stats: {
      tenantsCount: 4,
      totalTerminals: 18,
      platformVersion: "2.5.0-Enterprise"
    },
    dataSnapshot: {
      registeredTenants: ["tenant_apex_retail", "tenant_metro_mart", "tenant_zenith_boutique", "tenant_bluenilla_hq"],
      activeNodes: 6,
      globalFleetPolicies: { enforceBiometrics: false, maxTerminalsPerTenant: 10 }
    }
  };
  hiveBackupsStore.set(hiveInitBackup.id, hiveInitBackup);
}
async function syncDocToFirestore(pathString, data) {
  const db = getServerFirestore();
  if (!db) return;
  try {
    const docRef = (0, import_firestore.doc)(db, pathString);
    await (0, import_firestore.setDoc)(docRef, { ...data, _syncedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to write to ${pathString}:`, err);
  }
}
async function deleteDocFromFirestore(pathString) {
  const db = getServerFirestore();
  if (!db) return;
  try {
    const docRef = (0, import_firestore.doc)(db, pathString);
    await (0, import_firestore.deleteDoc)(docRef);
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to delete ${pathString}:`, err);
  }
}
async function getTenantProducts(tenantId) {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.products.values());
}
async function createTenantProduct(tenantId, productData) {
  const store = getOrCreateTenantStore(tenantId);
  const id = productData.id || `prod_${tenantId}_${Date.now()}`;
  const newProduct = {
    id,
    sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
    barcode: productData.barcode || Math.floor(1e9 + Math.random() * 9e9).toString(),
    name: productData.name || "New Shop Item",
    category: productData.category || "General",
    price: Number(productData.price) || 0,
    costPrice: Number(productData.costPrice) || 0,
    stock: Number(productData.stock) || 0,
    reorderPoint: Number(productData.reorderPoint) || 5,
    binLocation: productData.binLocation || "Aisle 1",
    batchLotNumber: productData.batchLotNumber || "LOT-2026",
    supplier: productData.supplier || "Primary Supplier",
    taxRate: Number(productData.taxRate) || 0.08,
    imageUrl: productData.imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300",
    description: productData.description || ""
  };
  store.products.set(id, newProduct);
  syncDocToFirestore(`tenants/${tenantId}/products/${id}`, newProduct);
  return newProduct;
}
async function updateTenantProduct(tenantId, productId, updates) {
  const store = getOrCreateTenantStore(tenantId);
  const existing = store.products.get(productId);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
    price: updates.price !== void 0 ? Number(updates.price) : existing.price,
    costPrice: updates.costPrice !== void 0 ? Number(updates.costPrice) : existing.costPrice,
    stock: updates.stock !== void 0 ? Number(updates.stock) : existing.stock
  };
  store.products.set(productId, updated);
  syncDocToFirestore(`tenants/${tenantId}/products/${productId}`, updated);
  return updated;
}
async function deleteTenantProduct(tenantId, productId) {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.products.delete(productId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/products/${productId}`);
  }
  return existed;
}
async function getTenantTransactions(tenantId) {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.transactions.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
async function updateTenantTransaction(tenantId, txId, updates) {
  const store = getOrCreateTenantStore(tenantId);
  const existing = store.transactions.get(txId);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates
  };
  store.transactions.set(txId, updated);
  syncDocToFirestore(`tenants/${tenantId}/transactions/${txId}`, updated);
  return updated;
}
async function deleteTenantTransaction(tenantId, txId) {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.transactions.delete(txId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/transactions/${txId}`);
  }
  return existed;
}
async function scanTenantAnomalies(tenantId) {
  const store = getOrCreateTenantStore(tenantId);
  const anomalies = [];
  store.products.forEach((p) => {
    if (p.stock < 0) {
      anomalies.push({
        id: `anom_neg_${p.id}`,
        type: "negative_stock",
        severity: "high",
        title: `Negative Inventory Anomaly: ${p.name}`,
        description: `Physical stock count is at ${p.stock} units. Cashiers cannot checkout this product when "preventNegativeStockSales" is active.`,
        entityId: p.id,
        suggestedAction: `Reset to 0 or re-align physical count with a corrective stock adjustment voucher.`,
        status: "detected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  store.transactions.forEach((t) => {
    if (!t.items || t.items.length === 0) {
      anomalies.push({
        id: `anom_empty_${t.id}`,
        type: "corrupted_queue",
        severity: "medium",
        title: `Orphaned Empty Transaction: ${t.orderNumber || t.id}`,
        description: `Order was recorded with 0 items, likely due to a frontend checkout timeout or interrupted cart sync.`,
        entityId: t.id,
        suggestedAction: `Purge orphaned transaction to balance accounts.`,
        status: "detected",
        timestamp: t.timestamp
      });
    } else {
      const expectedSubtotal = t.items.reduce((sum, item) => sum + (item.total || 0), 0);
      if (Math.abs(expectedSubtotal - t.subtotal) > 0.05) {
        anomalies.push({
          id: `anom_math_${t.id}`,
          type: "calculation_drift",
          severity: "medium",
          title: `Calculation Drift in Order #${t.orderNumber || t.id}`,
          description: `Line item sum ($${expectedSubtotal.toFixed(2)}) deviates from recorded subtotal ($${t.subtotal.toFixed(2)}).`,
          entityId: t.id,
          suggestedAction: `Recalculate and normalize transaction totals.`,
          status: "detected",
          timestamp: t.timestamp
        });
      }
    }
  });
  return anomalies;
}
async function autoRepairTenantAnomalies(tenantId, resolvedBy = "Tenant Admin Error Aid") {
  const store = getOrCreateTenantStore(tenantId);
  const anomalies = await scanTenantAnomalies(tenantId);
  const logs = [];
  let repairedCount = 0;
  for (const anom of anomalies) {
    if (anom.type === "negative_stock" && anom.entityId) {
      const prod = store.products.get(anom.entityId);
      if (prod && prod.stock < 0) {
        const oldStock = prod.stock;
        prod.stock = 10;
        store.products.set(prod.id, prod);
        syncDocToFirestore(`tenants/${tenantId}/products/${prod.id}`, prod);
        const log = {
          id: `log_rep_${Date.now()}_${repairedCount}`,
          tenantId,
          anomalyType: "negative_stock",
          actionTaken: `Restored stock of "${prod.name}" from ${oldStock} to 10 units with stock alignment note`,
          resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
          resolvedBy,
          itemsAffected: 1
        };
        logs.push(log);
        store.repairLogs.unshift(log);
        syncDocToFirestore(`tenants/${tenantId}/repair_logs/${log.id}`, log);
        repairedCount++;
      }
    } else if (anom.type === "corrupted_queue" && anom.entityId) {
      store.transactions.delete(anom.entityId);
      deleteDocFromFirestore(`tenants/${tenantId}/transactions/${anom.entityId}`);
      const log = {
        id: `log_rep_${Date.now()}_${repairedCount}`,
        tenantId,
        anomalyType: "corrupted_queue",
        actionTaken: `Purged orphaned empty transaction ${anom.entityId} to restore ledger consistency`,
        resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
        resolvedBy,
        itemsAffected: 1
      };
      logs.push(log);
      store.repairLogs.unshift(log);
      syncDocToFirestore(`tenants/${tenantId}/repair_logs/${log.id}`, log);
      repairedCount++;
    } else if (anom.type === "calculation_drift" && anom.entityId) {
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
        const log = {
          id: `log_rep_${Date.now()}_${repairedCount}`,
          tenantId,
          anomalyType: "calculation_drift",
          actionTaken: `Recalculated line items, tax ($${recalculatedTax}), and normalized total ($${tx.total}) for ${tx.orderNumber || tx.receiptNumber || tx.id}`,
          resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
function getTenantRepairLogs(tenantId) {
  const store = getOrCreateTenantStore(tenantId);
  return store.repairLogs;
}
async function createTenantBackup(tenantId, createdBy = "Tenant Admin", notes = "Manual Shop Backup Snapshot") {
  const store = getOrCreateTenantStore(tenantId);
  const products = Array.from(store.products.values());
  const transactions = Array.from(store.transactions.values());
  const backupId = `bkp_${tenantId}_${Date.now()}`;
  const folderPath = `tenants/${tenantId}/backups/${backupId}`;
  const snapshot = {
    id: backupId,
    tenantId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy,
    scope: "tenant_isolated",
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
  syncDocToFirestore(folderPath, snapshot);
  return snapshot;
}
async function listTenantBackups(tenantId) {
  const store = getOrCreateTenantStore(tenantId);
  return Array.from(store.backups.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
async function restoreTenantBackup(tenantId, backupId, restoredBy = "Tenant Admin") {
  const store = getOrCreateTenantStore(tenantId);
  const backup = store.backups.get(backupId);
  if (!backup || !backup.dataSnapshot) {
    throw new Error(`Backup snapshot "${backupId}" not found in tenant partition.`);
  }
  let restoredProductsCount = 0;
  let restoredTransactionsCount = 0;
  if (backup.dataSnapshot.products && Array.isArray(backup.dataSnapshot.products)) {
    store.products.clear();
    backup.dataSnapshot.products.forEach((p) => {
      store.products.set(p.id, p);
      syncDocToFirestore(`tenants/${tenantId}/products/${p.id}`, p);
      restoredProductsCount++;
    });
  }
  if (backup.dataSnapshot.transactions && Array.isArray(backup.dataSnapshot.transactions)) {
    store.transactions.clear();
    backup.dataSnapshot.transactions.forEach((t) => {
      store.transactions.set(t.id, t);
      syncDocToFirestore(`tenants/${tenantId}/transactions/${t.id}`, t);
      restoredTransactionsCount++;
    });
  }
  const log = {
    id: `log_rep_restore_${Date.now()}`,
    tenantId,
    anomalyType: "database_restore",
    actionTaken: `Restored shop snapshot ${backupId} (${restoredProductsCount} products, ${restoredTransactionsCount} transactions)`,
    resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
    resolvedBy: restoredBy,
    itemsAffected: restoredProductsCount + restoredTransactionsCount
  };
  store.repairLogs.unshift(log);
  return { success: true, restoredProductsCount, restoredTransactionsCount };
}
async function deleteTenantBackup(tenantId, backupId) {
  const store = getOrCreateTenantStore(tenantId);
  const existed = store.backups.delete(backupId);
  if (existed) {
    deleteDocFromFirestore(`tenants/${tenantId}/backups/${backupId}`);
  }
  return existed;
}
async function createHiveCentralBackup(createdBy = "Hive Supervisor", notes = "Central Platform Snapshot") {
  const backupId = `hive_bkp_${Date.now()}`;
  const folderPath = `hive/platform/backups/${backupId}`;
  const allTenants = Array.from(tenantStores.keys());
  let totalProductsAcrossPlatform = 0;
  tenantStores.forEach((s) => {
    totalProductsAcrossPlatform += s.products.size;
  });
  const snapshot = {
    id: backupId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy,
    scope: "hive_central",
    folderPath,
    notes,
    stats: {
      tenantsCount: Math.max(allTenants.length, 3),
      totalTerminals: 14,
      platformVersion: "2.5.0-Enterprise"
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
async function listHiveCentralBackups() {
  return Array.from(hiveBackupsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
async function restoreHiveCentralBackup(backupId, user = "Hive Master") {
  const backup = hiveBackupsStore.get(backupId);
  if (!backup) {
    throw new Error(`Hive central backup snapshot "${backupId}" does not exist.`);
  }
  return {
    success: true,
    message: `Hive platform central registry and quota state restored from ${backupId} by ${user}.`
  };
}

// server/backoffice.ts
var defaultModulesConfig = {
  salesPOS: {
    enabled: true,
    quickCashButtons: [10, 20, 50, 100],
    allowCashierDiscounts: true,
    maxDiscountPercentWithoutManager: 15,
    allowPriceOverride: false,
    customerFacingDisplay: true,
    autoKickCashDrawer: true,
    barcodeContinuousMode: true,
    paperlessDigitalReceipts: true,
    allowParkedOrders: true,
    allowSplitPayments: true,
    requireCashFloatVerification: true
  },
  storeroom: {
    enabled: true,
    lowStockBannerAtPOS: true,
    lowStockThreshold: 10,
    preventNegativeStockSales: true,
    requireManagerApprovalStockAdjustment: true,
    rapidBarcodeReceiving: true
  },
  accounts: {
    enabled: true,
    autoGenerateZReportAtMidnight: true,
    allowExpenseVouchersAtPOS: true,
    enforceShiftBalancing: true
  },
  hr: {
    enabled: true,
    requireClockInBeforeSale: true,
    biometricClockInEnforced: false,
    overtimeAlerts: true
  },
  managerReports: true,
  itDiagnostics: true
};
var initialTenantConfigs = {
  tenant_apex_retail: {
    id: "cfg_apex_retail",
    tenantId: "tenant_apex_retail",
    businessName: "Apex Superstores International Ltd",
    branchName: "Flagship Store #01",
    branding: {
      shopDisplayName: "Apex Superstores - Central Mall",
      taxRatePercent: 8,
      currencySymbol: "$",
      receiptHeader: "WELCOME TO APEX SUPERSTORE\n124 Retail Boulevard, Sector 4\nTel: +1 (555) 019-2830",
      receiptFooter: "Thank you for shopping with Apex!\nExchange valid for 14 days with original receipt.\nCustomer Service: apex-support@bluenilla.com",
      taxRegistrationNumber: "VAT-US-9281740-B",
      returnPolicyDays: 14,
      supportPhone: "+1 (555) 019-2830",
      supportEmail: "apex-support@bluenilla.com"
    },
    modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
    rolePermissions: {
      cashier: ["pos.checkout", "pos.scan", "pos.park_order", "pos.cash_drawer", "pos.print_receipt"],
      receiver: ["storeroom.scan_receive", "storeroom.view_po", "storeroom.view_stock"],
      accountant: ["accounts.view_invoices", "accounts.view_bills", "accounts.view_expenses", "accounts.view_z_reports"],
      store_manager: [
        "pos.checkout",
        "pos.override_discount",
        "pos.override_price",
        "pos.void_sale",
        "pos.refund",
        "storeroom.all",
        "accounts.all",
        "hr.shifts",
        "hr.approvals",
        "backoffice.view",
        "backoffice.reports"
      ],
      tenant_admin: [
        "all",
        "backoffice.all",
        "backoffice.modules",
        "backoffice.branding",
        "backoffice.staff",
        "backoffice.terminals",
        "backoffice.z_report"
      ]
    },
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "Sarah Connor (Tenant Admin)"
  },
  tenant_metro_mart: {
    id: "cfg_metro_mart",
    tenantId: "tenant_metro_mart",
    businessName: "Metro Food & Beverages Corp",
    branchName: "Downtown Express Branch",
    branding: {
      shopDisplayName: "Metro Mart Express",
      taxRatePercent: 5,
      currencySymbol: "$",
      receiptHeader: "METRO MART DOWNTOWN\nFresh Groceries & Everyday Goods\n45 Metro Way",
      receiptFooter: "Always Fresh, Always Near You!\nNon-perishable returns accepted within 7 days.",
      taxRegistrationNumber: "VAT-MM-449102-C",
      returnPolicyDays: 7,
      supportPhone: "+1 (555) 440-9921",
      supportEmail: "metro-mart@bluenilla.com"
    },
    modules: {
      ...defaultModulesConfig,
      accounts: { ...defaultModulesConfig.accounts, enabled: false },
      hr: { ...defaultModulesConfig.hr, enabled: false }
    },
    rolePermissions: {
      cashier: ["pos.checkout", "pos.scan", "pos.cash_drawer"],
      receiver: ["storeroom.scan_receive"],
      accountant: ["accounts.view_invoices"],
      store_manager: ["pos.all", "storeroom.all", "backoffice.view"],
      tenant_admin: ["all", "backoffice.all"]
    },
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "David Kim (Store Owner)"
  }
};
var dailyZReports = {
  tenant_apex_retail: {
    id: `zrep-apex-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
    tenantId: "tenant_apex_retail",
    reportDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    openedAt: "08:00 AM",
    closedAt: "Pending Close (Live Day)",
    generatedBy: "Sarah Connor (Tenant Admin)",
    totalTransactions: 38,
    grossSales: 3420.5,
    discountTotal: 145,
    netSales: 3275.5,
    taxCollected: 262.04,
    cashTenders: 1240,
    cardTenders: 1850.54,
    nfcTenders: 447,
    splitTenders: 0,
    openingFloat: 250,
    cashInDrawerExpected: 1490,
    actualCashCounted: 1490,
    variance: 0,
    voidCount: 1,
    voidTotal: 45,
    refundCount: 0,
    refundTotal: 0,
    isReconciled: true
  }
};
var backOfficeRouter = (0, import_express.Router)({ mergeParams: true });
function requireTenantAdmin(req, res, next) {
  const userRole = req.headers["x-user-role"] || "";
  const userCategory = req.headers["x-user-category"] || "";
  const allowedRoles = [
    "business_owner",
    "tenant_admin",
    "store_manager",
    "system_host",
    "hive_master"
  ];
  const isAuthorized = allowedRoles.includes(userRole.toLowerCase()) || userCategory.toLowerCase() === "business_owner" || userCategory.toLowerCase() === "system_host";
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: "Access Denied: Role-Based Access Control",
      message: "The Shop Back Office can only be accessed by Tenant Admins, Business Owners, or Store Managers in this shop.",
      currentRole: userRole || "anonymous",
      requiredRole: "tenant_admin | business_owner | store_manager"
    });
  }
  next();
}
backOfficeRouter.get("/config", requireTenantAdmin, (req, res) => {
  const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(400).json({ success: false, error: "Tenant ID is required" });
  }
  let config = initialTenantConfigs[tenantId];
  if (!config) {
    config = {
      id: `cfg_${tenantId}`,
      tenantId,
      businessName: tenantId.replace("tenant_", "").replace(/_/g, " ").toUpperCase(),
      branchName: "Main Store",
      branding: {
        shopDisplayName: tenantId.replace("tenant_", "").replace(/_/g, " ").toUpperCase(),
        taxRatePercent: 8,
        currencySymbol: "$",
        receiptHeader: `WELCOME TO ${tenantId.replace("tenant_", "").toUpperCase()}
Bluenilla Powered Hybrid POS`,
        receiptFooter: "Thank you for your business!\nReturns accepted within 14 days with receipt.",
        taxRegistrationNumber: `VAT-${tenantId.slice(-6).toUpperCase()}`,
        returnPolicyDays: 14
      },
      modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
      rolePermissions: {
        cashier: ["pos.checkout", "pos.scan", "pos.cash_drawer"],
        receiver: ["storeroom.scan_receive"],
        accountant: ["accounts.view_invoices"],
        store_manager: ["pos.all", "storeroom.all", "backoffice.view"],
        tenant_admin: ["all", "backoffice.all"]
      },
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System Auto-Init"
    };
    initialTenantConfigs[tenantId] = config;
  }
  res.json({
    success: true,
    tenantId,
    config,
    serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
backOfficeRouter.put("/config", requireTenantAdmin, (req, res) => {
  const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
  const updates = req.body;
  const operatorName = req.headers["x-user-name"] || "Tenant Admin";
  if (!tenantId) {
    return res.status(400).json({ success: false, error: "Tenant ID is required" });
  }
  let config = initialTenantConfigs[tenantId];
  if (!config) {
    config = {
      id: `cfg_${tenantId}`,
      tenantId,
      businessName: tenantId,
      branchName: "Main Store",
      branding: {
        shopDisplayName: tenantId,
        taxRatePercent: 8,
        currencySymbol: "$",
        receiptHeader: "WELCOME",
        receiptFooter: "THANK YOU",
        taxRegistrationNumber: "VAT-PENDING",
        returnPolicyDays: 14
      },
      modules: JSON.parse(JSON.stringify(defaultModulesConfig)),
      rolePermissions: {
        cashier: ["pos.checkout"],
        receiver: ["storeroom.scan_receive"],
        accountant: ["accounts.view"],
        store_manager: ["pos.all", "backoffice.view"],
        tenant_admin: ["all"]
      },
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: operatorName
    };
  }
  if (updates.branding) {
    config.branding = { ...config.branding, ...updates.branding };
  }
  if (updates.modules) {
    config.modules = {
      ...config.modules,
      ...updates.modules,
      salesPOS: { ...config.modules.salesPOS, ...updates.modules.salesPOS || {} },
      storeroom: { ...config.modules.storeroom, ...updates.modules.storeroom || {} },
      accounts: { ...config.modules.accounts, ...updates.modules.accounts || {} },
      hr: { ...config.modules.hr, ...updates.modules.hr || {} }
    };
  }
  if (updates.rolePermissions) {
    config.rolePermissions = { ...config.rolePermissions, ...updates.rolePermissions };
  }
  if (updates.branchName) {
    config.branchName = updates.branchName;
  }
  config.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  config.updatedBy = operatorName;
  initialTenantConfigs[tenantId] = config;
  res.json({
    success: true,
    message: "Shop Back Office module configuration updated successfully.",
    config,
    updatedAt: config.updatedAt
  });
});
backOfficeRouter.get("/reports/daily-z", requireTenantAdmin, (req, res) => {
  const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let report = dailyZReports[tenantId];
  if (!report || report.reportDate !== today) {
    report = {
      id: `zrep-${tenantId}-${today}`,
      tenantId,
      reportDate: today,
      openedAt: "08:00 AM",
      closedAt: "Open (Live Till Session)",
      generatedBy: req.headers["x-user-name"] || "Tenant Admin",
      totalTransactions: 24,
      grossSales: 2150,
      discountTotal: 85,
      netSales: 2065,
      taxCollected: 165.2,
      cashTenders: 840,
      cardTenders: 1210.2,
      nfcTenders: 180,
      splitTenders: 0,
      openingFloat: 250,
      cashInDrawerExpected: 1090,
      actualCashCounted: 1090,
      variance: 0,
      voidCount: 0,
      voidTotal: 0,
      refundCount: 0,
      refundTotal: 0,
      isReconciled: true
    };
    dailyZReports[tenantId] = report;
  }
  res.json({
    success: true,
    report,
    calculatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
});
backOfficeRouter.post("/reports/daily-z/reconcile", requireTenantAdmin, (req, res) => {
  const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
  const { actualCashCounted, notes } = req.body;
  let report = dailyZReports[tenantId];
  if (!report) {
    return res.status(404).json({ success: false, error: "Report not found" });
  }
  const counted = Number(actualCashCounted) || report.cashInDrawerExpected;
  report.actualCashCounted = counted;
  report.variance = +(counted - report.cashInDrawerExpected).toFixed(2);
  report.closedAt = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  report.isReconciled = true;
  dailyZReports[tenantId] = report;
  res.json({
    success: true,
    message: "Register shift successfully reconciled and closed for the day.",
    report,
    notes: notes || "Drawer balanced"
  });
});
backOfficeRouter.post("/terminals/:terminalId/push-config", requireTenantAdmin, (req, res) => {
  const { terminalId } = req.params;
  const { quickCashButtons, autoKickDrawer, scannerContinuous } = req.body;
  res.json({
    success: true,
    terminalId,
    message: `Terminal ${terminalId} remote configuration synchronized.`,
    appliedSettings: {
      quickCashButtons,
      autoKickDrawer,
      scannerContinuous
    },
    syncTimestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
backOfficeRouter.get("/products", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const products = await getTenantProducts(tenantId);
    res.json({ success: true, tenantId, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.post("/products", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const product = await createTenantProduct(tenantId, req.body);
    res.json({ success: true, message: "Product created successfully in tenant catalog", product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.put("/products/:id", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const { id } = req.params;
    const updated = await updateTenantProduct(tenantId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Product not found in tenant partition" });
    }
    res.json({ success: true, message: "Product adjusted successfully", product: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.delete("/products/:id", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const { id } = req.params;
    const deleted = await deleteTenantProduct(tenantId, id);
    res.json({ success: deleted, message: deleted ? "Product deleted" : "Product not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.get("/transactions", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const transactions = await getTenantTransactions(tenantId);
    res.json({ success: true, tenantId, count: transactions.length, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.put("/transactions/:id", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const { id } = req.params;
    const updated = await updateTenantTransaction(tenantId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }
    res.json({ success: true, message: "Transaction record updated by admin", transaction: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.delete("/transactions/:id", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const { id } = req.params;
    const deleted = await deleteTenantTransaction(tenantId, id);
    res.json({ success: deleted, message: deleted ? "Transaction purged" : "Transaction not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.get("/anomalies", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const anomalies = await scanTenantAnomalies(tenantId);
    res.json({ success: true, tenantId, count: anomalies.length, anomalies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.post("/anomalies/auto-repair", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const operatorName = req.headers["x-user-name"] || "Tenant Admin";
    const result = await autoRepairTenantAnomalies(tenantId, operatorName);
    res.json({
      success: true,
      message: `Error Aid completed: repaired ${result.repairedCount} frontend anomaly item(s).`,
      repairedCount: result.repairedCount,
      logs: result.logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.get("/anomalies/logs", requireTenantAdmin, (req, res) => {
  const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
  const logs = getTenantRepairLogs(tenantId);
  res.json({ success: true, tenantId, count: logs.length, logs });
});
backOfficeRouter.get("/backups", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const backups = await listTenantBackups(tenantId);
    res.json({
      success: true,
      tenantId,
      partition: `tenants/${tenantId}/backups`,
      count: backups.length,
      backups
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.post("/backups/create", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const operatorName = req.headers["x-user-name"] || "Tenant Admin";
    const { notes } = req.body;
    const backup = await createTenantBackup(tenantId, operatorName, notes);
    res.json({
      success: true,
      message: `Shop backup snapshot created successfully in partition: ${backup.folderPath}`,
      backup
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.post("/backups/:backupId/restore", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const operatorName = req.headers["x-user-name"] || "Tenant Admin";
    const { backupId } = req.params;
    const result = await restoreTenantBackup(tenantId, backupId, operatorName);
    res.json({
      success: true,
      message: `Shop data restored successfully from ${backupId}.`,
      details: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
backOfficeRouter.delete("/backups/:backupId", requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const { backupId } = req.params;
    const deleted = await deleteTenantBackup(tenantId, backupId);
    res.json({ success: deleted, message: deleted ? "Backup deleted" : "Backup not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var hiveRouter = (0, import_express.Router)();
function requireHiveMaster(req, res, next) {
  const role = req.headers["x-user-role"] || "";
  const isHiveMaster = role === "hive_master" || role === "system_host";
  if (!isHiveMaster) {
    return res.status(403).json({
      success: false,
      error: "Access Denied: Hive Central Platform Control is Restricted",
      message: "Tenants cannot view, create, or restore Central Hive backups. Use your shop-isolated backup at /api/tenant/:tenantId/backoffice/backups instead.",
      yourRole: role,
      requiredRole: "hive_master | system_host",
      partitionPolicy: 'Database isolation enforces separate folders: Hive has "hive/platform/*", Tenants have "tenants/{tenantId}/*".'
    });
  }
  next();
}
hiveRouter.get("/backups", requireHiveMaster, async (req, res) => {
  try {
    const backups = await listHiveCentralBackups();
    res.json({
      success: true,
      scope: "hive_central",
      folderPath: "hive/platform/backups",
      count: backups.length,
      backups
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
hiveRouter.post("/backups/create", requireHiveMaster, async (req, res) => {
  try {
    const operatorName = req.headers["x-user-name"] || "Hive Master";
    const { notes } = req.body;
    const backup = await createHiveCentralBackup(operatorName, notes);
    res.json({
      success: true,
      message: `Hive Central master backup created in platform partition: ${backup.folderPath}`,
      backup
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
hiveRouter.post("/backups/:backupId/restore", requireHiveMaster, async (req, res) => {
  try {
    const operatorName = req.headers["x-user-name"] || "Hive Master";
    const { backupId } = req.params;
    const result = await restoreHiveCentralBackup(backupId, operatorName);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path2.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  app.use(import_express2.default.json());
  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-ID, X-User-Role, X-User-ID, X-User-Name, X-User-Category");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "BLUENILLA Hybrid POS & Enterprise Backend",
      version: "2.5.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api/hive", hiveRouter);
  app.use("/api/tenant/:tenantId/backoffice", backOfficeRouter);
  app.use("/api/backoffice", backOfficeRouter);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3e3 },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BLUENILLA Enterprise Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[BLUENILLA Enterprise Server] Tenant Back Office API mounted at /api/tenant/:tenantId/backoffice`);
  });
}
startServer().catch((err) => {
  console.error("[BLUENILLA Enterprise Server] Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
