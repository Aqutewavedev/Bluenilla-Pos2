import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  RotateCcw, 
  ShieldAlert, 
  DollarSign, 
  Percent, 
  CreditCard, 
  Tag, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  Filter,
  Trash2
} from 'lucide-react';
import { TenantContext, User as UserType, RefundRecord, StoreChargeRule, SuspiciousActivityReport, SalesSummaryAggregate } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface SalesReportsControlProps {
  tenant: TenantContext | null;
  currentUser: UserType | null;
}

export const SalesReportsControl: React.FC<SalesReportsControlProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'summary' | 'breakdowns' | 'refunds' | 'charges' | 'suspicious'>('summary');
  const [summary, setSummary] = useState<SalesSummaryAggregate | null>(null);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [charges, setCharges] = useState<StoreChargeRule[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousActivityReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReceiptNo, setRefundReceiptNo] = useState('');
  const [refundCustomer, setRefundCustomer] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');
  const [refundReason, setRefundReason] = useState('');
  const [restockInventory, setRestockInventory] = useState(true);

  // New Charge Modal State
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeName, setChargeName] = useState('');
  const [chargeType, setChargeType] = useState<'surcharge' | 'service_fee' | 'eco_levy' | 'custom'>('surcharge');
  const [chargeRateType, setChargeRateType] = useState<'percentage' | 'fixed'>('percentage');
  const [chargeValue, setChargeValue] = useState('');
  const [chargeAppliesTo, setChargeAppliesTo] = useState<'all' | 'card_only' | 'dine_in' | 'delivery'>('all');

  const loadAll = async () => {
    if (!tenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [sumRes, refRes, chgRes, susRes] = await Promise.all([
        backOfficeApi.getSalesSummary(tenant.id, currentUser),
        backOfficeApi.getRefunds(tenant.id, currentUser),
        backOfficeApi.getStoreCharges(tenant.id, currentUser),
        backOfficeApi.getSuspiciousReports(tenant.id, currentUser)
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (refRes.success) setRefunds(refRes.refunds || []);
      if (chgRes.success) setCharges(chgRes.charges || []);
      if (susRes.success) setSuspicious(susRes.reports || []);
    } catch (err: any) {
      console.error('Failed to load sales reports', err);
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

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || Number(refundAmount) <= 0) return;
    try {
      const res = await backOfficeApi.createRefund(tenant.id, {
        receiptNumber: refundReceiptNo,
        customerName: refundCustomer,
        totalRefunded: Number(refundAmount),
        refundMethod,
        reason: refundReason,
        items: [
          {
            productId: 'manual_item',
            productName: 'Adjusted Return Item',
            quantity: 1,
            unitPrice: Number(refundAmount),
            refundAmount: Number(refundAmount),
            restockInventory
          }
        ]
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowRefundModal(false);
        setRefundReceiptNo('');
        setRefundCustomer('');
        setRefundAmount('');
        setRefundReason('');
        setStatusMessage('Refund processed and ledger updated.');
        loadAll();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeName || !chargeValue) return;
    try {
      const res = await backOfficeApi.createStoreCharge(tenant.id, {
        name: chargeName,
        type: chargeType,
        rateType: chargeRateType,
        value: Number(chargeValue),
        appliesTo: chargeAppliesTo,
        isActive: true
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowChargeModal(false);
        setChargeName('');
        setChargeValue('');
        setStatusMessage('Store charge rule active in POS register checkout.');
        loadAll();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteCharge = async (id: string) => {
    if (!confirm('Remove this charge rule?')) return;
    await backOfficeApi.deleteStoreCharge(tenant.id, id, currentUser);
    loadAll();
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              Tenant Sales Control
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Live Auditing & Aggregates</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Sales, Receipts & Fraud Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time turnover, breakdown performance, handle returns, configure surcharge fees, and inspect suspicious cash drawer events.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAll}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Issue Refund</span>
          </button>
          <button
            onClick={() => setShowChargeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Surcharge / Fee</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'summary', label: 'Sales Overview', icon: TrendingUp },
          { id: 'breakdowns', label: 'Breakdown by Product & Category', icon: Tag },
          { id: 'refunds', label: `Refunds & Returns (${refunds.length})`, icon: RotateCcw },
          { id: 'charges', label: `Taxes & Surcharges (${charges.length})`, icon: Percent },
          { id: 'suspicious', label: `Suspicious Reports (${suspicious.length})`, icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id as any);
                posAudio.playButtonPress();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: SALES SUMMARY */}
      {subTab === 'summary' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Gross Turnover</span>
              <div className="text-2xl font-black text-white mt-1">
                ${summary ? summary.grossSales.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Before deductions & promotions</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Net Revenue</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ${summary ? summary.netSales.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Actual register collections</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Tax Collected</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                ${summary ? summary.totalTax.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">State / VAT liability pool</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Discount Savings</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                ${summary ? summary.totalDiscount.toFixed(2) : '0.00'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Promos & customer coupons</span>
            </div>
          </div>

          {/* Payment Tender Breakdown */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Collections by Payment Tender</span>
            </h3>
            {(!summary?.byPaymentType || summary.byPaymentType.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No payment transactions recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.byPaymentType.map((pt, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase">{pt.type}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{pt.count} settled ticket(s)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 font-mono">${pt.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: BREAKDOWN BY PRODUCT & CATEGORY */}
      {subTab === 'breakdowns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Sales by Product</span>
            </h3>
            <div className="divide-y divide-slate-800/80">
              {(summary?.byProduct || []).map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.quantity} units sold</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white font-mono">${p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {(!summary?.byProduct || summary.byProduct.length === 0) && (
                <p className="text-xs text-slate-500 italic py-3">No product item data found.</p>
              )}
            </div>
          </div>

          {/* Sales by Category */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Sales by Category</span>
            </h3>
            <div className="divide-y divide-slate-800/80">
              {(summary?.byCategory || []).map((c, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{c.category}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{c.count} line items</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-white font-mono">${c.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {(!summary?.byCategory || summary.byCategory.length === 0) && (
                <p className="text-xs text-slate-500 italic py-3">No category transaction data.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: REFUNDS & RETURNS */}
      {subTab === 'refunds' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Customer Returns & Restock Ledger</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">{refunds.length} Refund(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">Refund #</th>
                    <th className="pb-3 font-semibold">Receipt #</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Tender</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Authorized By</th>
                    <th className="pb-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {refunds.map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono font-bold text-rose-400">{ref.refundNumber}</td>
                      <td className="py-3 font-mono text-slate-300">{ref.receiptNumber}</td>
                      <td className="py-3 text-slate-200">{ref.customerName}</td>
                      <td className="py-3 uppercase font-mono text-[10px] text-slate-400">{ref.refundMethod}</td>
                      <td className="py-3 font-mono font-black text-rose-400">-${ref.totalRefunded.toFixed(2)}</td>
                      <td className="py-3 text-slate-400">{ref.authorizedBy}</td>
                      <td className="py-3 text-slate-400 italic max-w-xs truncate">{ref.reason}</td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                        No refunds have been processed for this shop.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: CHARGES & SURCHARGES */}
      {subTab === 'charges' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span>Store Surcharges, Fees & Environmental Levies</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically applied at POS checkout for payment types, bag charges, or dine-in gratuities.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {charges.map(chg => (
                <div key={chg.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{chg.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 block">
                        {chg.type} • Applies to: {chg.appliesTo}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {chg.rateType === 'percentage' ? `${chg.value}%` : `$${chg.value.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className={`font-mono ${chg.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {chg.isActive ? '● Active in POS' : '○ Disabled'}
                    </span>
                    <button
                      onClick={() => handleDeleteCharge(chg.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove charge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {charges.length === 0 && (
                <div className="col-span-3 py-8 text-center text-slate-500 text-xs italic">
                  No surcharge rules established. Click "Add Surcharge / Fee" to configure.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: SUSPICIOUS REPORTS */}
      {subTab === 'suspicious' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Fraud & Suspicious Register Events</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated heuristics flagging suspicious till behaviors such as voids after receipt print and excessive drawer pops.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {suspicious.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      item.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.details}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          item.severity === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          item.severity === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {item.severity} Risk
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>Cashier: <strong className="text-slate-200">{item.cashierName}</strong></span>
                        {item.orderId && <span>Order: <strong className="font-mono text-slate-300">{item.orderId}</strong></span>}
                        {item.amount > 0 && <span>Amount: <strong className="font-mono text-white">${item.amount.toFixed(2)}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                    <div>{new Date(item.timestamp).toLocaleTimeString()}</div>
                    <div className="text-[10px]">{item.flaggedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE REFUND */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Process Customer Refund</span>
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Receipt Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. REC-1082"
                  value={refundReceiptNo}
                  onChange={e => setRefundReceiptNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Walk-in or registered customer"
                  value={refundCustomer}
                  onChange={e => setRefundCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Refund Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tender Method</label>
                  <select
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="cash">Cash Tender</option>
                    <option value="card">Original Card</option>
                    <option value="store_credit">Store Credit Voucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Return Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Defective item, customer changed mind"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="restock"
                  checked={restockInventory}
                  onChange={e => setRestockInventory(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="restock" className="text-slate-300">
                  Return item quantity back into active shop inventory stock
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold shadow-md"
                >
                  Confirm & Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SURCHARGE RULE */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Create Store Surcharge / Fee Rule</span>
              </h3>
              <button onClick={() => setShowChargeModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCharge} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fee / Surcharge Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Credit Card Fee, Bag Levy"
                  value={chargeName}
                  onChange={e => setChargeName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={chargeType}
                    onChange={e => setChargeType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="surcharge">Card Surcharge</option>
                    <option value="service_fee">Service Fee</option>
                    <option value="eco_levy">Eco / Bag Levy</option>
                    <option value="custom">Custom Tax/Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Calculation Type</label>
                  <select
                    value={chargeRateType}
                    onChange={e => setChargeRateType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Value ({chargeRateType === 'percentage' ? '%' : '$'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={chargeRateType === 'percentage' ? '1.5' : '0.50'}
                    value={chargeValue}
                    onChange={e => setChargeValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Applies To</label>
                  <select
                    value={chargeAppliesTo}
                    onChange={e => setChargeAppliesTo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="all">All Orders</option>
                    <option value="card_only">Card Payments Only</option>
                    <option value="dine_in">Dine-In Orders</option>
                    <option value="delivery">Takeaway / Delivery</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChargeModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Surcharge Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
