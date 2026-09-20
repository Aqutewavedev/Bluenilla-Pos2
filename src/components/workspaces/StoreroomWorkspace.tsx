import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  ArrowDownToLine, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Barcode, 
  Printer, 
  FileText, 
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Product, PurchaseOrder, StockAdjustment, User, TenantContext, isShopGuestMode, isSubmoduleEnabled } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { exportInventoryValuationPDF } from '../../services/pdfReport';
import { GuestModeNoticeModal } from '../common/GuestModeNoticeModal';

interface StoreroomWorkspaceProps {
  currentUser: User | null;
  isOffline: boolean;
  onStockChanged?: () => void;
  currentTenant?: TenantContext | null;
  availableTenants?: TenantContext[];
  onOpenSubscriptionManager?: () => void;
  onSwitchTenant?: (tenant: TenantContext) => void;
}

export const StoreroomWorkspace: React.FC<StoreroomWorkspaceProps> = ({
  currentUser,
  isOffline,
  onStockChanged,
  currentTenant,
  availableTenants = [],
  onOpenSubscriptionManager,
  onSwitchTenant
}) => {
  const [tab, setTab] = useState<'inventory' | 'receiving' | 'adjustments'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuestNotice, setShowGuestNotice] = useState(false);
  const [guestNoticeAction, setGuestNoticeAction] = useState('Stock Adjustment');

  const isGuestMode = isShopGuestMode(currentTenant);
  
  // Hive submodule gating
  const canBarcodePrinting = isSubmoduleEnabled(currentTenant, 'storeroom', 'barcodeReceiving');
  const canStockReconciliation = isSubmoduleEnabled(currentTenant, 'storeroom', 'stockAdjustments');
  const canPurchaseOrdersIntake = isSubmoduleEnabled(currentTenant, 'storeroom', 'stockReplenishment');
  
  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<StockAdjustment['type']>('audit_reconcile');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Barcode Label Print Modal
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);

  const loadData = async () => {
    if (!currentUser) {
      // Roaming user not logged in: non-existing business, do not display database data
      setProducts([]);
      setPurchaseOrders([]);
      setAdjustments([]);
      return;
    }

    try {
      const prods = await dbService.getProducts();
      setProducts(prods);
      const pos = await dbService.getPurchaseOrders();
      setPurchaseOrders(pos);
      const adjs = await dbService.getStockAdjustments();
      setAdjustments(adjs.slice(-15).reverse());
    } catch (err) {
      console.warn('Failed to load storeroom data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleReceivePO = async (poId: string, sku: string, qty: number) => {
    if (isGuestMode) {
      posAudio.playErrorTone();
      setGuestNoticeAction('PO Intake & Stock Receiving');
      setShowGuestNotice(true);
      return;
    }
    if (!currentUser) {
      alert('Survey Mode: PO receiving cannot be written to the database. Sign in with subscription to record stock intake.');
      return;
    }
    posAudio.playScanBeep();
    await dbService.receivePOItem(poId, sku, qty, currentUser.name);
    await loadData();
    if (onStockChanged) onStockChanged();
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestMode) {
      posAudio.playErrorTone();
      setGuestNoticeAction('Save Stock Adjustment');
      setShowGuestNotice(true);
      return;
    }
    if (!currentUser) {
      alert('Survey Mode: Stock adjustments cannot be written to the database. Sign in with subscription to save inventory changes.');
      return;
    }
    if (!selectedProductForAdjust || adjustQty === 0) return;

    await dbService.adjustStock(
      selectedProductForAdjust.id,
      adjustQty,
      adjustType,
      adjustReason || 'Manual storeroom adjustment',
      currentUser.name,
      isOffline
    );

    setShowAdjustModal(false);
    setSelectedProductForAdjust(null);
    setAdjustQty(0);
    setAdjustReason('');
    await loadData();
    if (onStockChanged) onStockChanged();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.binLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Storeroom Top Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Receiver & Storeroom Workspace</span>
            </h2>
            {isGuestMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Guest Mode (Read-Only)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stock ledger, PO intake, bin locations, lot management, and shelf labels
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'inventory' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stock Ledger ({products.length})
            </button>
            {canPurchaseOrdersIntake && (
              <button
                onClick={() => setTab('receiving')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tab === 'receiving' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                PO Receiving ({purchaseOrders.filter(p => p.status !== 'received').length})
              </button>
            )}
            <button
              onClick={() => setTab('adjustments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'adjustments' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Audit Log
            </button>
          </div>

          <button
            onClick={() => exportInventoryValuationPDF(products)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50"
            title="Download formatted inventory sheet PDF"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Valuation PDF</span>
          </button>
        </div>
      </div>

      {/* Main Tab View */}
      <div className="flex-1 p-4 overflow-y-auto">
        {tab === 'inventory' && (
          <div className="space-y-4">
            {/* Search & KPI bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter stock by SKU, product name, bin location, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                  Healthy: {products.filter(p => p.stock > p.reorderPoint).length} SKUs
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800/40">
                  Low Stock: {products.filter(p => p.stock > 0 && p.stock <= p.reorderPoint).length} SKUs
                </span>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Product / SKU</th>
                    <th className="p-3">Bin Location</th>
                    <th className="p-3">Lot & Expiry</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right">Retail Price</th>
                    <th className="p-3 text-center">Stock Level</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredProducts.map(p => {
                    const isLow = p.stock <= p.reorderPoint;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                <span>{p.sku}</span>
                                <span>•</span>
                                <span>UPC: {p.barcode}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.binLocation}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{p.batchLotNumber}</p>
                          <p className="text-[10px] text-slate-400">Exp: {p.expiryDate || 'N/A'}</p>
                        </td>
                        <td className="p-3 text-right font-mono">${p.costPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${p.price.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
                            <span className={isOut ? 'text-rose-600 font-extrabold' : isLow ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                              {p.stock}
                            </span>
                            <span className="text-[10px] text-slate-400">/ min {p.reorderPoint}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canStockReconciliation && (
                              <button
                                onClick={() => { setSelectedProductForAdjust(p); setShowAdjustModal(true); }}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500"
                              >
                                Adjust
                              </button>
                            )}
                            {canBarcodePrinting && (
                              <button
                                onClick={() => setSelectedProductForBarcode(p)}
                                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Print Barcode Shelf Tag"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'receiving' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Supplier Purchase Orders</h3>
                <p className="text-xs text-slate-500">Scan delivery pack-lists against supplier invoices</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOrders.map(po => (
                <div 
                  key={po.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{po.poNumber}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          po.status === 'received' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          po.status === 'partially_received' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{po.vendorName}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      ${po.totalValue.toFixed(2)}
                    </span>
                  </div>

                  {/* Items within PO */}
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {po.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Ordered: {item.orderedQty} | Received: <span className="font-bold text-emerald-600">{item.receivedQty}</span>
                          </p>
                        </div>
                        {item.receivedQty < item.orderedQty ? (
                          <button
                            onClick={() => handleReceivePO(po.id, item.sku, item.orderedQty - item.receivedQty)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition"
                          >
                            Receive All (+{item.orderedQty - item.receivedQty})
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {po.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                      Note: {po.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'adjustments' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Recent Storeroom Adjustments & Shrinkage Records
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {adjustments.map(adj => (
                <div key={adj.id} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{adj.productName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{adj.sku}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 capitalize">
                        {adj.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {adj.reason} • Handled by <span className="font-medium text-slate-700 dark:text-slate-300">{adj.operatorName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-mono font-extrabold ${adj.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange} units
                    </span>
                    <p className="text-[10px] text-slate-400">{new Date(adj.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form onSubmit={handleApplyAdjustment} className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Stock Level</h3>
            <p className="text-xs text-slate-500">{selectedProductForAdjust.name} ({selectedProductForAdjust.sku})</p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Adjustment Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="audit_reconcile">Physical Stock Audit Reconcile</option>
                <option value="damaged">Damaged / Expired Spoils</option>
                <option value="shrinkage">Inventory Shrinkage / Discrepancy</option>
                <option value="transfer">Internal Storeroom Transfer</option>
                <option value="received">Manual Intake (Non-PO)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quantity Change (+ for add, - for remove)
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                required
              />
              <p className="text-[11px] text-slate-500">
                Current: {selectedProductForAdjust.stock} → New: {Math.max(0, selectedProductForAdjust.stock + adjustQty)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audit Justification</label>
              <input
                type="text"
                placeholder="Reason for adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Apply Change
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Tag Print Preview Modal */}
      {selectedProductForBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Print Shelf Barcode Tag</h3>
            
            {/* Shelf tag mockup */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-900 font-mono text-center space-y-2">
              <p className="text-xs font-bold uppercase">{selectedProductForBarcode.name}</p>
              <p className="text-xl font-extrabold">${selectedProductForBarcode.price.toFixed(2)}</p>
              
              {/* Barcode representation */}
              <div className="flex justify-center items-center gap-1 h-10 py-1">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : 'w-0.5 bg-black'}`} />
                ))}
              </div>
              <p className="text-[10px] tracking-widest">{selectedProductForBarcode.barcode}</p>
              <p className="text-[9px] text-slate-500">{selectedProductForBarcode.binLocation}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProductForBarcode(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => { posAudio.playScanBeep(); window.print(); }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Print Shelf Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Mode Locked Action Notice Modal */}
      {currentTenant && (
        <GuestModeNoticeModal
          isOpen={showGuestNotice}
          onClose={() => setShowGuestNotice(false)}
          actionName={guestNoticeAction}
          currentTenant={currentTenant}
          availableTenants={availableTenants}
          onSwitchToSubscribedShop={(shop) => {
            if (onSwitchTenant) onSwitchTenant(shop);
          }}
          onOpenSubscriptionManager={() => {
            if (onOpenSubscriptionManager) onOpenSubscriptionManager();
          }}
        />
      )}
    </div>
  );
};
