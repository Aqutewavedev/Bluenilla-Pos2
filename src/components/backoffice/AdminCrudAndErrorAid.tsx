import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Search,
  Package,
  ListOrdered,
  DollarSign,
  Barcode,
  History,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Calculator,
  X
} from 'lucide-react';
import {
  TenantContext,
  User,
  Product,
  Transaction,
  FrontendAnomaly,
  RepairActionLog,
  isSystemHostUser
} from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface AdminCrudAndErrorAidProps {
  tenant: TenantContext | null;
  currentUser: User | null;
}

export const AdminCrudAndErrorAid: React.FC<AdminCrudAndErrorAidProps> = ({
  tenant,
  currentUser
}) => {
  const [subTab, setSubTab] = useState<'anomalies' | 'products' | 'transactions' | 'logs'>('anomalies');
  const [anomalies, setAnomalies] = useState<FrontendAnomaly[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [repairLogs, setRepairLogs] = useState<RepairActionLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccessMessage, setRepairSuccessMessage] = useState<string | null>(null);

  // Products CRUD State
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Transactions State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadAll = async () => {
    if (!tenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [anomRes, prodRes, txRes, logsRes] = await Promise.all([
        backOfficeApi.getAnomalies(tenant.id, currentUser),
        backOfficeApi.getProducts(tenant.id, currentUser),
        backOfficeApi.getTransactions(tenant.id, currentUser),
        backOfficeApi.getRepairLogs(tenant.id, currentUser)
      ]);

      if (anomRes.success) setAnomalies(anomRes.anomalies);
      if (prodRes.success) setProducts(prodRes.products);
      if (txRes.success) setTransactions(txRes.transactions);
      if (logsRes.success) setRepairLogs(logsRes.logs);
    } catch (err) {
      console.error('Error loading Admin CRUD & Error Aid data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      loadAll();
    } else {
      setIsLoading(false);
    }
  }, [tenant?.id, currentUser?.id]);

  // Handle 1-Click Auto Repair of Frontend Errors
  const handleAutoRepair = async () => {
    if (!tenant) return;
    if (isSystemHostUser(currentUser)) {
      alert("Hive Admin Protection: Hive Admin has universal read access to inspect tenant diagnostics, but cannot write or modify tenant shop data directly. Tenant modifications must be performed by the tenant admin or store manager.");
      return;
    }
    setIsRepairing(true);
    setRepairSuccessMessage(null);
    posAudio.playButtonPress();

    try {
      const result = await backOfficeApi.autoRepairAnomalies(tenant.id, currentUser);
      if (result.success) {
        posAudio.playSuccessChime();
        setRepairSuccessMessage(result.message);
        await loadAll();
      } else {
        alert(result.error || 'Failed to auto-repair frontend anomalies.');
      }
    } catch (err: any) {
      alert(err.message || 'Auto-repair failed.');
    } finally {
      setIsRepairing(false);
    }
  };

  // Save product (create or update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (isSystemHostUser(currentUser)) {
      alert("Hive Admin Protection: Hive Admin cannot modify tenant product catalog. Tenant writes must be executed by the shop tenant.");
      return;
    }
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      if (editingProduct.id && products.some(p => p.id === editingProduct.id)) {
        // Update
        const res = await backOfficeApi.updateProduct(tenant.id, editingProduct.id, editingProduct, currentUser);
        if (res.success) {
          posAudio.playSuccessChime();
          setIsProductModalOpen(false);
          setEditingProduct(null);
          await loadAll();
        } else {
          alert(res.error || 'Failed to update product');
        }
      } else {
        // Create
        const res = await backOfficeApi.createProduct(tenant.id, editingProduct, currentUser);
        if (res.success) {
          posAudio.playSuccessChime();
          setIsProductModalOpen(false);
          setEditingProduct(null);
          await loadAll();
        } else {
          alert(res.error || 'Failed to create product');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prod: Product) => {
    if (!tenant) return;
    if (isSystemHostUser(currentUser)) {
      alert("Hive Admin Protection: Hive Admin cannot delete tenant products. Only tenant can manage catalog items.");
      return;
    }
    if (!confirm(`Are you sure you want to delete "${prod.name}" from your shop catalog?`)) return;
    try {
      const res = await backOfficeApi.deleteProduct(tenant.id, prod.id, currentUser);
      if (res.success) {
        posAudio.playTrash();
        await loadAll();
      } else {
        alert(res.error || 'Delete failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  // Quick stock adjustment
  const handleQuickStockAdjust = async (prod: Product, delta: number) => {
    if (!tenant) return;
    if (isSystemHostUser(currentUser)) {
      alert("Hive Admin Protection: Hive Admin cannot alter tenant stock directly.");
      return;
    }
    const newStock = Math.max(0, (prod.stock || 0) + delta);
    try {
      await backOfficeApi.updateProduct(tenant.id, prod.id, { stock: newStock }, currentUser);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete / purge corrupted transaction
  const handleDeleteTx = async (txId: string) => {
    if (!tenant) return;
    if (isSystemHostUser(currentUser)) {
      alert("Hive Admin Protection: Hive Admin cannot purge tenant transactions.");
      return;
    }
    if (!confirm(`Are you sure you want to purge transaction ${txId}? This will remove it from the store sales ledger.`)) return;
    try {
      const res = await backOfficeApi.deleteTransaction(tenant.id, txId, currentUser);
      if (res.success) {
        posAudio.playTrash();
        await loadAll();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode.includes(productSearch) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-white">Backend Admin Control & Frontend Error Aid</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live database CRUD control and diagnostic engine for <strong>{tenant?.tenantName || 'Shop Workspace'}</strong>. 
            Detects front-end work errors (negative stock, calculation drift, corrupted sessions) and applies automated or surgical database corrections directly to the tenant's partition.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-scan</span>
          </button>

          <button
            onClick={handleAutoRepair}
            disabled={isRepairing || anomalies.length === 0}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRepairing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Auto-Repair All Errors ({anomalies.length})</span>
          </button>
        </div>
      </div>

      {isSystemHostUser(currentUser) && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Hive Admin Read-Only Diagnostics:</strong> You can view all diagnostics, catalog items, and transactions across this shop. In accordance with platform security rules, write operations are restricted to the tenant. Central backups & restores are available in the <strong>Shop Backup & Restore</strong> tab.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold whitespace-nowrap">
            Read Only
          </span>
        </div>
      )}

      {repairSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{repairSuccessMessage}</span>
          </div>
          <button onClick={() => setRepairSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setSubTab('anomalies')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'anomalies'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Frontend Error Diagnostics</span>
          {anomalies.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {anomalies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('products')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'products'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Product Catalog CRUD ({products.length})</span>
        </button>

        <button
          onClick={() => setSubTab('transactions')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'transactions'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Transactions & Ledger ({transactions.length})</span>
        </button>

        <button
          onClick={() => setSubTab('logs')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'logs'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Repair Action Logs ({repairLogs.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: FRONTEND ERROR ANOMALIES */}
      {subTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Detected Front-End System & Register Inconsistencies:</span>
            <span className="font-mono text-amber-400">{anomalies.length} active issue(s)</span>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Frontend Work Errors Detected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Your shop partition has zero negative stock items, ledger totals match line items accurately, and no hanging transaction sessions were found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map(anom => (
                <div
                  key={anom.id}
                  className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{anom.title}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono uppercase">
                          {anom.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{anom.description}</p>
                      <div className="text-[11px] text-amber-400/90 font-mono mt-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Recommended Fix: {anom.suggestedAction}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAutoRepair}
                    disabled={isRepairing}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/30 transition shrink-0 self-start md:self-auto"
                  >
                    Fix Anomaly
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: PRODUCTS CRUD */}
      {subTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products by name, SKU, or barcode..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  sku: `SKU-${Date.now().toString().slice(-4)}`,
                  barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
                  category: 'General',
                  price: 10.00,
                  costPrice: 5.00,
                  stock: 25,
                  taxRate: 0.08,
                  binLocation: 'Aisle 1'
                });
                setIsProductModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="p-3">Item Details</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price / Cost</th>
                    <th className="p-3">Stock Units</th>
                    <th className="p-3">Barcode</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" />
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-400">{p.category}</td>
                      <td className="p-3 font-mono">
                        <span className="text-emerald-400 font-bold">${p.price.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 block">Cost: ${p.costPrice.toFixed(2)}</span>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${p.stock < 0 ? 'text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded' : 'text-slate-200'}`}>
                            {p.stock} units
                          </span>
                          <div className="flex items-center gap-0.5 ml-2">
                            <button
                              onClick={() => handleQuickStockAdjust(p, -1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                              title="Decrease 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(p, 5)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                              title="Add 5"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{p.barcode}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                            title="Edit product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TRANSACTIONS CRUD */}
      {subTab === 'transactions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Admin Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">{t.orderNumber || t.receiptNumber || t.id}</td>
                    <td className="p-3 text-[11px] text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3">{t.cashierName || 'Cashier'}</td>
                    <td className="p-3 font-mono">{t.items?.length || 0} line(s)</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">${t.total.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        t.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTx(t)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                        >
                          Inspect Math
                        </button>
                        <button
                          onClick={() => handleDeleteTx(t.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                          title="Purge transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: REPAIR LOGS */}
      {subTab === 'logs' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Complete audit trail of front-end error repairs and administrator database adjustments:
          </div>

          {repairLogs.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              No repairs recorded yet for this store session.
            </div>
          ) : (
            <div className="space-y-2">
              {repairLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-bold text-white block">{log.actionTaken}</span>
                      <span className="text-[10px] text-slate-500">
                        Target Type: <strong className="text-slate-400">{log.anomalyType}</strong> • By: {log.resolvedBy}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(log.resolvedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>{editingProduct.id && products.some(p => p.id === editingProduct.id) ? 'Edit Product Item' : 'Add New Product Item'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Barcode</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.barcode || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.costPrice ?? ''}
                    onChange={e => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock ?? ''}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Aisle / Bin Location</label>
                  <input
                    type="text"
                    value={editingProduct.binLocation || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, binLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center gap-1.5 shadow-md"
                >
                  {isSavingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Tenant Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT TRANSACTION */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Transaction #{selectedTx.orderNumber || selectedTx.receiptNumber || selectedTx.id}</span>
              </h3>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Order Subtotal:</span>
                <span className="font-mono text-white">${selectedTx.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Tax Collected:</span>
                <span className="font-mono text-white">${(selectedTx.tax ?? selectedTx.taxTotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Discount:</span>
                <span className="font-mono text-rose-400">-${(selectedTx.discountTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm">
                <span className="text-white">Recorded Total:</span>
                <span className="font-mono text-emerald-400">${selectedTx.total.toFixed(2)}</span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Line Items Breakdown:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  {selectedTx.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{item.product?.name || 'Item'} x{item.quantity}</span>
                      <span className="font-mono text-slate-400">${item.total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
