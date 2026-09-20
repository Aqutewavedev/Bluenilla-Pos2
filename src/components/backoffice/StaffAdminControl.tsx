import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Award, 
  FileText, 
  Plus, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Clock,
  Laptop
} from 'lucide-react';
import { 
  TenantContext, 
  User as UserType, 
  StaffCommissionRule, 
  StaffAccessLog,
  isSystemHostUser,
  isBusinessOwnerUser,
  isTenantAdminUser
} from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface StaffAdminControlProps {
  tenant: TenantContext | null;
  currentUser: UserType | null;
  availableUsers: UserType[];
}

export const StaffAdminControl: React.FC<StaffAdminControlProps> = ({ 
  tenant, 
  currentUser, 
  availableUsers 
}) => {
  const [subTab, setSubTab] = useState<'employees' | 'permissions' | 'commissions' | 'access_logs'>('employees');
  const [commissionRules, setCommissionRules] = useState<StaffCommissionRule[]>([]);
  const [accessLogs, setAccessLogs] = useState<StaffAccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Commission Rule Modal
  const [showCommModal, setShowCommModal] = useState(false);
  const [commName, setCommName] = useState('');
  const [commType, setCommType] = useState<'percentage_sales' | 'flat_per_item'>('percentage_sales');
  const [commRate, setCommRate] = useState('2.5');
  const [commRole, setCommRole] = useState('cashier');

  const loadData = async () => {
    if (!tenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        backOfficeApi.getStaffCommissionRules(tenant.id, currentUser),
        backOfficeApi.getStaffAccessLogs(tenant.id, currentUser)
      ]);

      if (cRes.success) setCommissionRules(cRes.rules || []);
      if (lRes.success) setAccessLogs(lRes.logs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [tenant?.id, currentUser?.id]);

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName || !commRate) return;
    try {
      const res = await backOfficeApi.createStaffCommissionRule(tenant.id, {
        name: commName,
        type: commType,
        rate: Number(commRate),
        appliesToRole: commRole,
        isActive: true
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowCommModal(false);
        setCommName('');
        setStatusMessage('Staff commission incentive rule active.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Strict Multi-Tenant Isolation for Staff Accounts:
  // - Cashiers/staff can ONLY see their own account details
  // - Tenant owners/managers can ONLY see their shop's staff
  // - Under NO circumstances can Hive users or other shop accounts be seen
  const scopedUsers = React.useMemo(() => {
    if (!currentUser) return [];

    if (isSystemHostUser(currentUser)) {
      return availableUsers;
    }

    const tenantId = tenant?.id || currentUser.tenantId;

    const tenantStaff = availableUsers.filter(u => {
      // Strictly exclude Hive central / system host accounts
      if (
        isSystemHostUser(u) ||
        u.role === 'system_host' ||
        u.tenantId === 'hive_central' ||
        u.email === 'aqutewavedev@gmail.com' ||
        u.email === 'admin.it@bluenilla.com'
      ) {
        return false;
      }
      // Must belong to this shop partition
      return u.tenantId === tenantId;
    });

    if (isBusinessOwnerUser(currentUser) || isTenantAdminUser(currentUser) || (currentUser.role as string) === 'manager' || (currentUser.role as string) === 'store_manager') {
      return tenantStaff;
    }

    // Regular staff: view own account only
    return tenantStaff.filter(u => u.id === currentUser.id);
  }, [availableUsers, currentUser, tenant?.id]);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              Staff HR & Security
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">RBAC Matrix, Commissions & Audit Trail</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Staff Roster, Access Permissions & Commission Plans</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee staff terminal accounts, configure role-based access limits, establish cashier commission payouts, and audit security access logs.
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
          {subTab === 'commissions' && (
            <button
              onClick={() => setShowCommModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Commission Incentive</span>
            </button>
          )}
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

      {/* Sub-Navigation Pills */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'employees', label: `Staff Accounts (${availableUsers.length})`, icon: Users },
          { id: 'permissions', label: 'Role Access Matrix', icon: Shield },
          { id: 'commissions', label: `Commission Rules (${commissionRules.length})`, icon: Award },
          { id: 'access_logs', label: `Security Access Logs (${accessLogs.length})`, icon: FileText }
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

      {/* SUB-VIEW 1: EMPLOYEES */}
      {subTab === 'employees' && (
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 flex items-center justify-between text-xs text-indigo-300">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Isolated Staff Directory Scoped to: <strong className="text-white font-mono">{tenant?.businessName || 'Active Shop'}</strong></span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-900 text-indigo-200">
              {scopedUsers.length} Active {scopedUsers.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>

          {scopedUsers.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-300">No staff accounts found for this shop.</p>
              <p className="text-[11px] text-slate-500 mt-1">Cross-tenant and Hive accounts are isolated from this view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scopedUsers.map(user => (
                <div key={user.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-2xl border border-slate-700 object-cover" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-amber-400 border border-slate-700 inline-block mt-0.5">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Workspace Scope:</span>
                      <strong className="text-slate-200 uppercase font-mono">{user.workspace}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Email:</span>
                      <strong className="text-slate-300 font-mono text-[11px] truncate max-w-36">{user.email}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Quick PIN Code:</span>
                      <strong className="font-mono text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        •••• (Secured)
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: PERMISSIONS MATRIX */}
      {subTab === 'permissions' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Operational Permission Boundaries</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">POS Capability</th>
                  <th className="pb-3 font-semibold text-center">Cashier</th>
                  <th className="pb-3 font-semibold text-center">Supervisor</th>
                  <th className="pb-3 font-semibold text-center">Store Manager</th>
                  <th className="pb-3 font-semibold text-center">Tenant Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {[
                  { cap: 'Ring Up Products & Take Cash/Card', c: true, s: true, m: true, a: true },
                  { cap: 'Apply Line Item & Basket Discounts', c: false, s: true, m: true, a: true },
                  { cap: 'Void Item After Receipt Printed', c: false, s: true, m: true, a: true },
                  { cap: 'Open Cash Drawer Without Sale (No-Sale)', c: false, s: true, m: true, a: true },
                  { cap: 'Run Mid-Day X-Report Read', c: true, s: true, m: true, a: true },
                  { cap: 'Close Register & Reconcile Daily Z-Report', c: false, s: false, m: true, a: true },
                  { cap: 'Modify Shop Catalog, Modifiers & Tax Rates', c: false, s: false, m: false, a: true },
                  { cap: 'Create Store Backups & Export Ledgers', c: false, s: false, m: false, a: true }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 text-slate-200 font-sans font-medium">{row.cap}</td>
                    <td className="py-2.5 text-center">{row.c ? <span className="text-emerald-400">✓ Granted</span> : <span className="text-slate-600">✕</span>}</td>
                    <td className="py-2.5 text-center">{row.s ? <span className="text-emerald-400">✓ Granted</span> : <span className="text-slate-600">✕</span>}</td>
                    <td className="py-2.5 text-center">{row.m ? <span className="text-emerald-400">✓ Granted</span> : <span className="text-slate-600">✕</span>}</td>
                    <td className="py-2.5 text-center">{row.a ? <span className="text-emerald-400">✓ Granted</span> : <span className="text-slate-600">✕</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: COMMISSIONS */}
      {subTab === 'commissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commissionRules.map(rule => (
            <div key={rule.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 block">
                    Applies To: {rule.appliesToRole} role
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {rule.type === 'percentage_sales' ? `${rule.rate}% of Ring Sales` : `$${rule.rate.toFixed(2)} per Item`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculation Engine:</span>
                <span className="text-slate-200 font-mono">Automated at Daily Z-Close</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: ACCESS LOGS */}
      {subTab === 'access_logs' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Staff Employee</th>
                  <th className="pb-3 font-semibold">Terminal / Device</th>
                  <th className="pb-3 font-semibold">Action Performed</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accessLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-white block">{log.employeeName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.role}</span>
                    </td>
                    <td className="py-3 font-mono text-slate-300 text-[11px] flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.deviceType} ({log.ipAddress})</span>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">{log.action}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        log.status === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD COMMISSION */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Create Staff Commission Rule</span>
              </h3>
              <button onClick={() => setShowCommModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCommission} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Sales Bonus"
                  value={commName}
                  onChange={e => setCommName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Calculation Type</label>
                  <select
                    value={commType}
                    onChange={e => setCommType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="percentage_sales">Percentage of Sales (%)</option>
                    <option value="flat_per_item">Flat per Item ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rate ({commType === 'percentage_sales' ? '%' : '$'}) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={commRate}
                    onChange={e => setCommRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Applies to Staff Role</label>
                <select
                  value={commRole}
                  onChange={e => setCommRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white uppercase font-mono"
                >
                  <option value="cashier">Cashier</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="barista">Barista / Clerk</option>
                  <option value="manager">Store Manager</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Incentive Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
