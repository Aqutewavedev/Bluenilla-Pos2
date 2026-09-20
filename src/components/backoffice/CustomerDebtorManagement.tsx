import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  BookOpen, 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  RefreshCw,
  Phone,
  Mail,
  Building,
  UserCheck
} from 'lucide-react';
import { TenantContext, User as UserType, CustomerRecord, DebtorInvoiceRecord, DebtorSettlementRecord } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface CustomerDebtorManagementProps {
  tenant: TenantContext;
  currentUser: UserType | null;
}

export const CustomerDebtorManagement: React.FC<CustomerDebtorManagementProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'customers' | 'debtors' | 'settlements'>('customers');
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [invoices, setInvoices] = useState<DebtorInvoiceRecord[]>([]);
  const [settlements, setSettlements] = useState<DebtorSettlementRecord[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Customer Modal
  const [showCustModal, setShowCustModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custGroup, setCustGroup] = useState<'retail' | 'vip' | 'wholesale'>('retail');
  const [custCreditLimit, setCustCreditLimit] = useState('500');
  const [custTaxNumber, setCustTaxNumber] = useState('');

  // Settle Debt Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DebtorInvoiceRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentType, setSettlePaymentType] = useState('card');
  const [settleReference, setSettleReference] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        backOfficeApi.getCustomers(tenant.id, currentUser),
        backOfficeApi.getDebtors(tenant.id, currentUser)
      ]);

      if (cRes.success) setCustomers(cRes.customers || []);
      if (dRes.success) {
        setInvoices(dRes.invoices || []);
        setSettlements(dRes.settlements || []);
        setTotalOutstanding(dRes.totalOutstanding || 0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    try {
      const res = await backOfficeApi.createCustomer(tenant.id, {
        name: custName,
        phone: custPhone,
        email: custEmail,
        address: custAddress,
        customerGroup: custGroup,
        creditLimit: Number(custCreditLimit),
        taxNumber: custTaxNumber
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowCustModal(false);
        setCustName('');
        setCustPhone('');
        setCustEmail('');
        setStatusMessage('Customer profile registered.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleAmount || Number(settleAmount) <= 0) return;
    try {
      const res = await backOfficeApi.settleDebtorCredit(tenant.id, {
        customerId: selectedInvoice?.customerId || 'cust-manual',
        customerName: selectedInvoice?.customerName || 'Customer Account',
        amount: Number(settleAmount),
        paymentType: settlePaymentType,
        reference: settleReference,
        allocatedInvoiceId: selectedInvoice?.id
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowSettleModal(false);
        setSelectedInvoice(null);
        setSettleAmount('');
        setStatusMessage('Payment settled on debtor ledger.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              Customer CRM & Ledger
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Loyalty Tiers & Debtor Invoices</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Customer Directory & Debtor Settlements</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer accounts, loyalty point balances, debtor credit allowances, and reconcile credit settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={() => setShowCustModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Registered Profiles</span>
          <div className="text-2xl font-black text-white mt-1">{customers.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active loyalty members & corporate accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Total Debtor Ledger Due</span>
          <div className="text-2xl font-black text-rose-400 mt-1">${totalOutstanding.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Outstanding customer accounts receivable</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Total Settlements</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{settlements.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Settled invoice receipts on record</span>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'customers', label: `Customer Base (${customers.length})`, icon: Users },
          { id: 'debtors', label: `Debtor Invoices (${invoices.length})`, icon: BookOpen },
          { id: 'settlements', label: `Credit Settlements (${settlements.length})`, icon: CreditCard }
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

      {/* SUB-VIEW 1: CUSTOMERS */}
      {subTab === 'customers' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers by name, telephone, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(c => (
              <div key={c.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                      {c.customerGroup} Tier
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{c.loyaltyTier}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      {c.loyaltyPoints} Points
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-[11px]">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] truncate">{c.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Credit Limit</span>
                    <span className="font-mono font-bold text-slate-200">${c.creditLimit.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Current Debt</span>
                    <span className={`font-mono font-bold ${c.currentDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${c.currentDebt.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DEBTOR INVOICES */}
      {subTab === 'debtors' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Invoice #</th>
                  <th className="pb-3 font-semibold">Customer Account</th>
                  <th className="pb-3 font-semibold">Due Date</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Balance Due</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate-200 font-semibold">{inv.customerName}</td>
                    <td className="py-3 font-mono text-slate-400">{inv.dueDate}</td>
                    <td className="py-3 font-mono text-slate-300">${inv.amount.toFixed(2)}</td>
                    <td className="py-3 font-mono font-black text-rose-400">${inv.balanceDue.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        inv.status === 'settled' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        inv.status.includes('overdue') ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setSettleAmount(inv.balanceDue.toString());
                            setShowSettleModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition shadow"
                        >
                          Settle Debt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SETTLEMENTS */}
      {subTab === 'settlements' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Settlement #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Payment Tender</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Settled Amount</th>
                  <th className="pb-3 font-semibold">Recorded By</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {settlements.map(set => (
                  <tr key={set.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-emerald-400">{set.settlementNumber}</td>
                    <td className="py-3 text-slate-200">{set.customerName}</td>
                    <td className="py-3 uppercase font-mono text-[10px] text-slate-300">{set.paymentType}</td>
                    <td className="py-3 font-mono text-slate-400">{set.reference}</td>
                    <td className="py-3 font-mono font-black text-emerald-400">${set.amount.toFixed(2)}</td>
                    <td className="py-3 text-slate-400">{set.recordedBy}</td>
                    <td className="py-3 font-mono text-slate-500 text-[10px]">
                      {new Date(set.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showCustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Register Customer Profile</span>
              </h3>
              <button onClick={() => setShowCustModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Corporate Account"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="account@domain.com"
                    value={custEmail}
                    onChange={e => setCustEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Group</label>
                  <select
                    value={custGroup}
                    onChange={e => setCustGroup(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="retail">Retail Consumer</option>
                    <option value="vip">VIP Patron</option>
                    <option value="wholesale">Wholesale B2B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    step="10"
                    value={custCreditLimit}
                    onChange={e => setCustCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address / Billing Location</label>
                <input
                  type="text"
                  placeholder="Street address, city, postal code"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE DEBT */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Receive Debtor Settlement</span>
              </h3>
              <button onClick={() => setShowSettleModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSettleDebt} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Customer: <strong className="text-white">{selectedInvoice?.customerName}</strong></div>
                <div className="text-slate-400">Invoice: <strong className="text-indigo-400">{selectedInvoice?.invoiceNumber}</strong></div>
                <div className="text-slate-400">Total Outstanding: <strong className="text-rose-400">${selectedInvoice?.balanceDue.toFixed(2)}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Settlement Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onChange={e => setSettleAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Tender</label>
                  <select
                    value={settlePaymentType}
                    onChange={e => setSettlePaymentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white uppercase font-mono"
                  >
                    <option value="cash">Cash Tender</option>
                    <option value="card">Card Terminal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Reference / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. TR-998124 or Check #104"
                  value={settleReference}
                  onChange={e => setSettleReference(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md"
                >
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
