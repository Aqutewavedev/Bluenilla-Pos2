import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Coins, 
  Award, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Transaction, Product, User } from '../../types';
import { dbService } from '../../services/db';
import { exportSalesReportPDF } from '../../services/pdfReport';
import { posAudio } from '../../services/hardware';

interface ManagerWorkspaceProps {
  currentUser: User | null;
}

export const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({ currentUser }) => {
  const [tab, setTab] = useState<'analytics' | 'reconciliation' | 'leaderboard'>('analytics');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Drawer Reconciliation state
  const [actualCashCount, setActualCashCount] = useState<string>('');
  const [reconciled, setReconciled] = useState(false);

  const loadData = async () => {
    if (!currentUser) {
      setTransactions([]);
      setProducts([]);
      return;
    }

    try {
      const [txs, prods] = await Promise.all([dbService.getTransactions(), dbService.getProducts()]);
      setTransactions(txs);
      setProducts(prods);
    } catch (err) {
      console.warn('Failed to load manager analytics data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const totalSalesRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const totalCashCollected = transactions.reduce((s, t) => {
    const cashPay = t.payments.filter(p => p.type === 'cash').reduce((ps, p) => ps + p.amount, 0);
    return s + cashPay;
  }, 0);
  const totalCardCollected = transactions.reduce((s, t) => {
    const cardPay = t.payments.filter(p => p.type === 'card' || p.type === 'mobile_nfc').reduce((ps, p) => ps + p.amount, 0);
    return s + cardPay;
  }, 0);

  // Top products
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  transactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productSalesMap.get(item.product.name) || { name: item.product.name, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.total;
      productSalesMap.set(item.product.name, existing);
    });
  });
  const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Cashier leaderboard
  const cashierMap = new Map<string, { name: string; count: number; total: number }>();
  transactions.forEach(t => {
    const existing = cashierMap.get(t.cashierName) || { name: t.cashierName, count: 0, total: 0 };
    existing.count += 1;
    existing.total += t.total;
    cashierMap.set(t.cashierName, existing);
  });
  const cashierLeaderboard = Array.from(cashierMap.values()).sort((a, b) => b.total - a.total);

  // Opening float
  const openingFloat = 200.00;
  const expectedDrawerCash = openingFloat + totalCashCollected;
  const countedNum = parseFloat(actualCashCount) || 0;
  const variance = countedNum - expectedDrawerCash;

  const handleRunZReport = () => {
    posAudio.playScanBeep();
    setReconciled(true);
    exportSalesReportPDF(transactions, `Today Z-Report - Shift Close`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Management & Analytical Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time revenue metrics, staff sales leaderboards, drawer reconciliation, and Z-Reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'analytics' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Revenue Analytics
            </button>
            <button
              onClick={() => setTab('reconciliation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'reconciliation' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Z-Report / Drawer Close
            </button>
            <button
              onClick={() => setTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'leaderboard' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cashier Performance
            </button>
          </div>

          <button
            onClick={() => exportSalesReportPDF(transactions, 'Executive Sales Summary')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {tab === 'analytics' && (
          <div className="space-y-4">
            {/* Top KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Total</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  ${totalSalesRevenue.toFixed(2)}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +14.2% vs last cycle
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets Processed</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {transactions.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Avg Ticket: ${(totalSalesRevenue / Math.max(1, transactions.length)).toFixed(2)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tender: Card & NFC</p>
                <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  ${totalCardCollected.toFixed(2)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {totalSalesRevenue > 0 ? ((totalCardCollected / totalSalesRevenue) * 100).toFixed(0) : 0}% of sales volume
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tender: Cash Intake</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  ${totalCashCollected.toFixed(2)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Physical bills in register</p>
              </div>
            </div>

            {/* Visual breakdown cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Selling Products */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Top Selling Products by Volume</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {topProducts.length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">No sales logged in active session.</p>
                  ) : (
                    topProducts.map((p, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{p.qty} sold</span>
                          <span className="text-[11px] text-slate-400 block font-mono">${p.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hourly Velocity Simulation */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hourly Sales Throughput (Peak Hours)</h3>
                <div className="h-44 flex items-end gap-2 pt-6">
                  {[
                    { hour: '08:00', vol: 32 },
                    { hour: '10:00', vol: 85 },
                    { hour: '12:00', vol: 140 },
                    { hour: '14:00', vol: 95 },
                    { hour: '16:00', vol: 110 },
                    { hour: '18:00', vol: 165 },
                    { hour: '20:00', vol: 70 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div 
                        style={{ height: `${(bar.vol / 165) * 100}%` }}
                        className="w-full bg-indigo-500/80 hover:bg-indigo-600 rounded-t-md transition-all group relative cursor-pointer"
                      >
                        <div className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-white whitespace-nowrap z-10">
                          {bar.vol} orders
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{bar.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'reconciliation' && (
          <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cash Drawer Z-Report & Shift Balancing</h3>
              <p className="text-xs text-slate-500">Count physical bills and reconcile register against electronic totals</p>
            </div>

            <div className="space-y-2 text-xs border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Opening Register Float:</span>
                <span className="font-mono font-bold">${openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recorded Cash Sales:</span>
                <span className="font-mono font-bold text-emerald-600">+${totalCashCollected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Expected Drawer Total:</span>
                <span className="font-mono">${expectedDrawerCash.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Physical Cash Counted in Drawer ($):
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter physical bill count..."
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            {actualCashCount && (
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                Math.abs(variance) < 0.05
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : variance > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div>
                  <span className="font-bold uppercase tracking-wider block">
                    {Math.abs(variance) < 0.05 ? 'Balanced (Perfect Match)' : variance > 0 ? 'Cash Over' : 'Cash Short'}
                  </span>
                  <span className="text-[11px]">Variance from expected ledger</span>
                </div>
                <span className="text-base font-extrabold font-mono">
                  {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                </span>
              </div>
            )}

            <button
              onClick={handleRunZReport}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lock Register, Print Z-Report & Archive Shift</span>
            </button>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Staff Sales Throughput & Conversion Leaderboard
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Cashier / Associate</th>
                  <th className="p-3 text-right">Transactions Completed</th>
                  <th className="p-3 text-right">Average Ticket</th>
                  <th className="p-3 text-right">Gross Sales Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashierLeaderboard.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="p-3 text-right font-mono">{c.count} txs</td>
                    <td className="p-3 text-right font-mono">${(c.total / Math.max(1, c.count)).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      ${c.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
