import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Search, 
  RefreshCw, 
  Database, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Copy, 
  Check, 
  Users, 
  Package, 
  Store, 
  Clock, 
  Receipt,
  FileCode,
  X,
  ExternalLink,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { dbService } from '../../services/db';
import { 
  saveUserToFirestore, 
  saveProductToFirestore, 
  saveUserShiftToFirestore
} from '../../services/firebaseDataService';
import { getFirebaseDb } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User, Product, TenantContext, ShiftRecord, Transaction } from '../../types';

type TableKey = 'users' | 'products' | 'tenants' | 'shifts' | 'transactions';

interface DatabaseTableViewerProps {
  currentTenantId?: string;
  onClose?: () => void;
}

export const DatabaseTableViewer: React.FC<DatabaseTableViewerProps> = ({
  currentTenantId = 'bluenilla_core',
  onClose
}) => {
  const [activeTable, setActiveTable] = useState<TableKey>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ message: string; success: boolean } | null>(null);
  
  // Table Data State
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tenants, setTenants] = useState<TenantContext[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Selected row for JSON inspector
  const [inspectDoc, setInspectDoc] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [showRulesHelper, setShowRulesHelper] = useState(false);

  const FIRESTORE_ALLOW_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_ALLOW_RULES);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [u, p, t, s, tr] = await Promise.all([
        dbService.getUsers(),
        dbService.getProducts(currentTenantId),
        dbService.getTenants(),
        dbService.getShifts(),
        dbService.getTransactions(currentTenantId)
      ]);
      setUsers(u || []);
      setProducts(p || []);
      setTenants(t || []);
      setShifts(s || []);
      setTransactions(tr || []);
    } catch (e) {
      console.error('Failed to load database tables:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenantId]);

  const handleCopyJson = async () => {
    if (!inspectDoc) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(inspectDoc, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const pushTableToFirestore = async () => {
    setIsPushing(true);
    setPushStatus(null);
    try {
      const db = getFirebaseDb();
      let count = 0;

      if (activeTable === 'users') {
        for (const u of users) {
          await saveUserToFirestore(u);
          count++;
        }
      } else if (activeTable === 'products') {
        for (const p of products) {
          await saveProductToFirestore(currentTenantId, p);
          count++;
        }
      } else if (activeTable === 'tenants') {
        for (const t of tenants) {
          const tDoc = doc(db, 'hive', 'platform', 'tenants', t.id);
          await setDoc(tDoc, t, { merge: true });
          count++;
        }
      } else if (activeTable === 'shifts') {
        for (const s of shifts) {
          await saveUserShiftToFirestore(s.userId, s, currentTenantId);
          count++;
        }
      } else if (activeTable === 'transactions') {
        for (const tr of transactions) {
          const trDoc = doc(db, 'tenants', currentTenantId, 'transactions', tr.id);
          await setDoc(trDoc, tr, { merge: true });
          count++;
        }
      }

      setPushStatus({
        message: `Successfully pushed ${count} records from '${activeTable}' to Cloud Firestore!`,
        success: true
      });
    } catch (err: any) {
      console.error('Push error:', err);
      const isPerm = err?.code === 'permission-denied' || err?.message?.includes('permission');
      if (isPerm) {
        setShowRulesHelper(true);
      }
      setPushStatus({
        message: isPerm 
          ? 'Write rejected: Firestore Security Rules on Firebase Console require permission.'
          : (err?.message || 'Failed to push table to Firestore.'),
        success: false
      });
    } finally {
      setIsPushing(false);
    }
  };

  const tableCounts = {
    users: users.length,
    products: products.length,
    tenants: tenants.length,
    shifts: shifts.length,
    transactions: transactions.length
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bar: Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => { setActiveTable('users'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTable === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>users</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTable === 'users' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {tableCounts.users}
            </span>
          </button>

          <button
            onClick={() => { setActiveTable('products'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTable === 'products'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTable === 'products' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {tableCounts.products}
            </span>
          </button>

          <button
            onClick={() => { setActiveTable('tenants'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTable === 'tenants'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>tenants</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTable === 'tenants' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {tableCounts.tenants}
            </span>
          </button>

          <button
            onClick={() => { setActiveTable('shifts'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTable === 'shifts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>shifts</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTable === 'shifts' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {tableCounts.shifts}
            </span>
          </button>

          <button
            onClick={() => { setActiveTable('transactions'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTable === 'transactions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>transactions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTable === 'transactions' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
            }`}>
              {tableCounts.transactions}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Reload from local & cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={pushTableToFirestore}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Push table rows to Cloud Firestore"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
            <span>{isPushing ? 'Pushing...' : `Push '${activeTable}' to Cloud`}</span>
          </button>
        </div>
      </div>

      {/* Push Status Toast */}
      {pushStatus && (
        <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
          pushStatus.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {pushStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span className="font-semibold">{pushStatus.message}</span>
          </div>
          <button onClick={() => setPushStatus(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Rules Resolution Guide when permission is denied */}
      {showRulesHelper && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>How to Enable Firestore Permission in Firebase Console (30 Seconds)</span>
            </div>
            <button 
              onClick={() => setShowRulesHelper(false)}
              className="p-1 rounded text-amber-600 hover:text-amber-800 dark:text-amber-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            By default, new Cloud Firestore databases start with locked rules (<code>allow read, write: if false;</code>). 
            To permit the web application to feed your tables into your database:
          </p>

          <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 dark:text-amber-200">
            <li>
              <span>Open the <strong>Rules</strong> tab in your Firebase Console: </span>
              <a 
                href="https://console.firebase.google.com/project/bluenilla-60232/firestore/databases/-default-/rules" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 underline ml-1 hover:text-indigo-700"
              >
                <span>Go to bluenilla-60232 Rules Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <span>Replace the rules with this rule:</span>
              <div className="mt-1.5 relative">
                <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-700">
                  {FIRESTORE_ALLOW_RULES}
                </pre>
                <button
                  onClick={handleCopyRules}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-slate-600 cursor-pointer"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRules ? 'Copied!' : 'Copy Rule'}</span>
                </button>
              </div>
            </li>
            <li>
              Click the blue <strong>"Publish"</strong> button in Firebase Console.
            </li>
            <li>
              Return here and click <strong className="text-emerald-600 dark:text-emerald-400">Push '{activeTable}' to Cloud</strong> again. Your table will appear immediately in Firebase!
            </li>
          </ol>
        </div>
      )}

      {/* Search & Metadata Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Filter ${activeTable} records...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Cloud Path: <code className="text-indigo-600 dark:text-indigo-400">
            {activeTable === 'users' ? '/users/{userId}' : 
             activeTable === 'products' ? `/tenants/${currentTenantId}/products/{productId}` :
             activeTable === 'tenants' ? '/hive/platform/tenants/{tenantId}' :
             activeTable === 'shifts' ? '/users/{userId}/shifts/{shiftId}' :
             `/tenants/${currentTenantId}/transactions/{id}`}
          </code>
        </span>
      </div>

      {/* Rendered Table */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex-1 min-h-[300px] overflow-y-auto">
        {activeTable === 'users' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Tenant ID</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users
                .filter(u => 
                  !searchQuery || 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.id.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{u.id}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{u.tenantId || 'global_host'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectDoc(u)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {activeTable === 'products' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Batch/Lot #</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products
                .filter(p => 
                  !searchQuery || 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">{p.sku}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-3 text-slate-500">{p.category}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">${p.price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        p.stock < 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{p.batchLotNumber || 'LOT-2026'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectDoc(p)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {activeTable === 'tenants' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Tenant ID</th>
                <th className="p-3">Business Name</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Currency</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tenants
                .filter(t => 
                  !searchQuery || 
                  t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.tenantId.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{t.tenantId}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{t.businessName}</td>
                    <td className="p-3 uppercase font-bold text-[10px] text-slate-500">{t.plan || 'enterprise'}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{t.currency || 'USD'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {t.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectDoc(t)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {activeTable === 'shifts' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Shift ID</th>
                <th className="p-3">User Name</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts
                .filter(s => 
                  !searchQuery || 
                  s.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.id.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-slate-500">{s.id}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{s.userName}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{new Date(s.clockIn).toLocaleTimeString()}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{s.clockOut ? new Date(s.clockOut).toLocaleTimeString() : 'Active'}</td>
                    <td className="p-3 font-bold font-mono">{s.hoursWorked.toFixed(1)} hrs</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectDoc(s)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {activeTable === 'transactions' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions
                .filter(tr => 
                  !searchQuery || 
                  tr.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (tr.cashierName && tr.cashierName.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{tr.id}</td>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{tr.cashierName || 'Operator'}</td>
                    <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">${tr.total.toFixed(2)}</td>
                    <td className="p-3 uppercase text-[10px] font-bold text-slate-500">
                      {tr.payments?.[0]?.type || 'cash'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(tr.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setInspectDoc(tr)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Document Inspector Modal / Overlay */}
      {inspectDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Document JSON Inspector ({inspectDoc.id || 'record'})
                </h3>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 flex-1 overflow-y-auto">
              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(inspectDoc, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied to Clipboard!' : 'Copy Document JSON'}</span>
              </button>
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
