import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BookOpen, 
  Receipt, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { InvoiceAR, BillAP, JournalEntry, ExpenseRecord, User } from '../../types';
import { dbService } from '../../services/db';

interface AccountsWorkspaceProps {
  currentUser: User | null;
}

export const AccountsWorkspace: React.FC<AccountsWorkspaceProps> = ({ currentUser }) => {
  const [tab, setTab] = useState<'kpi' | 'ar' | 'ap' | 'gl' | 'expenses'>('kpi');
  const [invoicesAR, setInvoicesAR] = useState<InvoiceAR[]>([]);
  const [billsAP, setBillsAP] = useState<BillAP[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Modals / forms
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Supplies' as ExpenseRecord['category'],
    payee: '',
    amount: '',
    receiptNumber: '',
    paymentMethod: 'Corporate Debit Card'
  });

  const [showAddJournal, setShowAddJournal] = useState(false);
  const [journalForm, setJournalForm] = useState({
    description: '',
    debitAccount: '1010 - Operating Cash',
    creditAccount: '4010 - Merchandise Revenue',
    amount: ''
  });

  const loadData = async () => {
    if (!currentUser) {
      setInvoicesAR([]);
      setBillsAP([]);
      setJournalEntries([]);
      setExpenses([]);
      return;
    }

    try {
      const [ar, ap, gl, exp] = await Promise.all([
        dbService.getInvoicesAR(),
        dbService.getBillsAP(),
        dbService.getJournalEntries(),
        dbService.getExpenses()
      ]);
      setInvoicesAR(ar);
      setBillsAP(ap);
      setJournalEntries(gl);
      setExpenses(exp);
    } catch (err) {
      console.warn('Failed to load accounting ledgers:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const totalAROutstanding = invoicesAR.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const totalAPDue = billsAP.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0);
  const totalExpensesMonth = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Survey Mode: Expense records cannot be written to the database. Sign in with subscription to record live company expenses.');
      return;
    }
    const amountNum = parseFloat(expenseForm.amount) || 0;
    if (amountNum <= 0) return;

    await dbService.saveExpense({
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: expenseForm.category,
      payee: expenseForm.payee,
      amount: amountNum,
      receiptNumber: expenseForm.receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: expenseForm.paymentMethod,
      approvedBy: currentUser.name
    });

    setShowAddExpense(false);
    setExpenseForm({
      category: 'Supplies',
      payee: '',
      amount: '',
      receiptNumber: '',
      paymentMethod: 'Corporate Debit Card'
    });
    await loadData();
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Survey Mode: Journal entries cannot be written to the database. Sign in with subscription to post live journal entries.');
      return;
    }
    const amountNum = parseFloat(journalForm.amount) || 0;
    if (amountNum <= 0) return;

    await dbService.saveJournalEntry({
      id: `je-${Date.now()}`,
      reference: `JV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      description: journalForm.description,
      debitAccount: journalForm.debitAccount,
      creditAccount: journalForm.creditAccount,
      amount: amountNum,
      postedBy: currentUser.name
    });

    setShowAddJournal(false);
    setJournalForm({
      description: '',
      debitAccount: '1010 - Operating Cash',
      creditAccount: '4010 - Merchandise Revenue',
      amount: ''
    });
    await loadData();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Top Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Accounts & Financial Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Accounts receivable, payable liabilities, double-entry general ledger, and expenses
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('kpi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'kpi' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('ar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'ar' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Receivables (AR)
          </button>
          <button
            onClick={() => setTab('ap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'ap' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Payables (AP)
          </button>
          <button
            onClick={() => setTab('gl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'gl' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            General Ledger (GL)
          </button>
          <button
            onClick={() => setTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'expenses' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {tab === 'kpi' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">A/R Outstanding</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                      ${totalAROutstanding.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{invoicesAR.length} active corporate client accounts</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">A/P Liabilities</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                      ${totalAPDue.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{billsAP.filter(b => b.status !== 'paid').length} vendor invoices awaiting disbursement</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Expenses</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                      ${totalExpensesMonth.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Current month verified receipts</p>
              </div>
            </div>

            {/* Income & Cash Flow Snapshot */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Provisional Monthly Profit & Loss (P&L)</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Gross POS Retail & Beverage Revenue</span>
                  <span className="font-mono font-bold text-emerald-600">$10,983.45</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-mono text-rose-600">-$3,890.10</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                  <span>Gross Operating Margin (64.5%)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">$7,093.35</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Operating Expenses & Utilities</span>
                  <span className="font-mono text-rose-600">-${totalExpensesMonth.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-extrabold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                  <span>Net Estimated Operating Profit</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ${(7093.35 - totalExpensesMonth).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'ar' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Accounts Receivable Ledger (Customer Aging)
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer / Client</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Invoice Amount</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoicesAR.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400">{inv.customerEmail}</p>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{inv.dueDate}</td>
                      <td className="p-3 text-right font-mono">${inv.amount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">${inv.paidAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${(inv.amount - inv.paidAmount).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          inv.status === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ap' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Accounts Payable Ledger (Vendor Liabilities)
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Bill #</th>
                    <th className="p-3">Vendor Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {billsAP.map(bill => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{bill.billNumber}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{bill.vendorName}</td>
                      <td className="p-3 text-slate-500">{bill.category}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{bill.dueDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${bill.amount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          bill.status === 'scheduled' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'gl' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                General Ledger Journal Vouchers
              </h3>
              <button
                onClick={() => setShowAddJournal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Journal Voucher</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Voucher Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Debit Account</th>
                    <th className="p-3">Credit Account</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Posted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {journalEntries.map(je => (
                    <tr key={je.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{je.reference}</td>
                      <td className="p-3 text-slate-500 font-mono">{je.date}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{je.description}</td>
                      <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">{je.debitAccount}</td>
                      <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{je.creditAccount}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${je.amount.toFixed(2)}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{je.postedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Operational Expense Tracking
              </h3>
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Expense</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Receipt / Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Payee / Vendor</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{exp.receiptNumber}</td>
                      <td className="p-3 text-slate-500 font-mono">{exp.date}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{exp.payee}</td>
                      <td className="p-3 text-slate-500">{exp.paymentMethod}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${exp.amount.toFixed(2)}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{exp.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateExpense} className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Operating Expense</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="Supplies">Supplies & POS Paper</option>
                <option value="Logistics">Logistics & Shipping</option>
                <option value="Utilities">Utilities (Power, Water, Gas)</option>
                <option value="Maintenance">Store Repairs & Maintenance</option>
                <option value="Software & IT">Software & IT Services</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payee / Vendor</label>
              <input
                type="text"
                value={expenseForm.payee}
                onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Record Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Journal Modal */}
      {showAddJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateJournal} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Post Double-Entry Journal Voucher</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <input
                type="text"
                placeholder="e.g. End of day cash drop to merchant safe..."
                value={journalForm.description}
                onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Debit Account</label>
                <input
                  type="text"
                  value={journalForm.debitAccount}
                  onChange={(e) => setJournalForm({ ...journalForm, debitAccount: e.target.value })}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Credit Account</label>
                <input
                  type="text"
                  value={journalForm.creditAccount}
                  onChange={(e) => setJournalForm({ ...journalForm, creditAccount: e.target.value })}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={journalForm.amount}
                onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddJournal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Post Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
