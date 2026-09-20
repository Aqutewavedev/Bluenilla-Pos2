import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  UploadCloud,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FolderLock,
  Clock,
  Database,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  FileArchive,
  Info,
  X
} from 'lucide-react';
import { TenantContext, User, TenantBackupSnapshot, isSystemHostUser } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface TenantBackupManagerProps {
  tenant: TenantContext | null;
  currentUser: User | null;
}

export const TenantBackupManager: React.FC<TenantBackupManagerProps> = ({
  tenant,
  currentUser
}) => {
  const [backups, setBackups] = useState<TenantBackupSnapshot[]>([]);
  const [partitionPath, setPartitionPath] = useState(tenant ? `tenants/${tenant.id}/backups` : 'tenants/backups');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState<TenantBackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Security Simulation State
  const [isTestingForbiddenHive, setIsTestingForbiddenHive] = useState(false);
  const [hiveTestResult, setHiveTestResult] = useState<{ status: number; message: string; blocked: boolean } | null>(null);

  const loadBackups = async () => {
    if (!tenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await backOfficeApi.getTenantBackups(tenant.id, currentUser);
      if (res.success) {
        setBackups(res.backups);
        if (res.partition) setPartitionPath(res.partition);
      }
    } catch (err) {
      console.error('Failed to load tenant backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      loadBackups();
    } else {
      setIsLoading(false);
    }
  }, [tenant?.id, currentUser?.id]);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsCreating(true);
    posAudio.playButtonPress();

    try {
      const res = await backOfficeApi.createTenantBackup(tenant.id, backupNotes || 'Manual shop administrative backup', currentUser);
      if (res.success) {
        posAudio.playSuccessChime();
        setShowCreateModal(false);
        setBackupNotes('');
        await loadBackups();
      } else {
        alert(res.error || 'Failed to generate shop backup snapshot');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!tenant || !restoreTarget) return;
    setIsRestoring(true);
    setRestoreSuccess(null);
    posAudio.playButtonPress();

    try {
      const res = await backOfficeApi.restoreTenantBackup(tenant.id, restoreTarget.id, currentUser);
      if (res.success) {
        posAudio.playSuccessChime();
        setRestoreSuccess(`Shop state successfully restored from snapshot ${restoreTarget.id}. Products, orders, and shop configurations synchronized.`);
        setRestoreTarget(null);
        await loadBackups();
      } else {
        alert(res.error || 'Failed to restore snapshot');
      }
    } catch (err: any) {
      alert(err.message || 'Error during restore');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (b: TenantBackupSnapshot) => {
    if (!tenant) return;
    if (!confirm(`Delete shop backup "${b.id}" permanently?`)) return;
    try {
      const res = await backOfficeApi.deleteTenantBackup(tenant.id, b.id, currentUser);
      if (res.success) {
        posAudio.playTrash();
        await loadBackups();
      } else {
        alert(res.error || 'Delete failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting backup');
    }
  };

  // Test that tenant cannot access central Hive platform backup
  const handleTestTenantCannotAccessHive = async () => {
    setIsTestingForbiddenHive(true);
    setHiveTestResult(null);
    try {
      const res = await fetch('/api/hive/backups', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'guest',
          'X-User-Role': currentUser?.role || 'tenant_admin',
          'X-User-Name': currentUser?.name || 'Guest User'
        }
      });
      const data = await res.json();
      if (res.status === 403) {
        setHiveTestResult({
          status: 403,
          message: data.message || 'Access Denied: Hive Central Platform Control is Restricted to Hive Master',
          blocked: true
        });
      } else {
        setHiveTestResult({
          status: res.status,
          message: 'Unexpected status: Central access was not strictly blocked',
          blocked: false
        });
      }
    } catch (err: any) {
      setHiveTestResult({
        status: 500,
        message: err.message,
        blocked: true
      });
    } finally {
      setIsTestingForbiddenHive(false);
    }
  };

  return (
    <div className="space-y-6">
      {isSystemHostUser(currentUser) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Hive Admin Data Backup & Disaster Recovery Aid</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                  Central Aid Authorized
                </span>
              </h4>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                As Hive Admin, you hold access to centralized backup stores across all shops and can aid this tenant by taking point-in-time snapshots or triggering a safe restore. Platform security rules prohibit direct writing to tenant business ledgers, preserving tenant data sovereignty.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Partition Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FolderLock className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-white">Shop-Isolated Backup & Restore Alignment</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Strict partitioned data storage for <strong>{tenant?.tenantName || 'Shop Workspace'}</strong>. 
            All snapshots, products, order ledgers, and registers are isolated inside your dedicated Firestore folder. 
            Your shop cannot access or overwrite Hive platform backups, and other tenants cannot access your data.
          </p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-400" />
              <span>Target Partition: <strong>{partitionPath}</strong></span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Tenant Security Isolation Active</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadBackups}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Create Shop Backup</span>
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{restoreSuccess}</span>
          </div>
          <button onClick={() => setRestoreSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Isolation Verification & Pinpoint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Dedicated Shop Storage</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Shop snapshots capture your local product catalog, daily sales transactions, branding configurations, and shift balances in a single pinpointed archive.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Restricted Central Platform</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Central Hive Master backups are stored under <code className="text-amber-400 font-mono">hive/platform/backups</code> and are mathematically inaccessible to individual tenants.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Verify Boundary Defense</span>
            <button
              onClick={handleTestTenantCannotAccessHive}
              disabled={isTestingForbiddenHive}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-[10px] font-bold border border-amber-500/30 transition"
            >
              {isTestingForbiddenHive ? 'Pinging...' : 'Test Tenant Rejection'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Verify that your tenant token cannot query Hive central backups.
          </p>
          {hiveTestResult && (
            <div className={`p-2 rounded-lg text-[10px] font-mono mt-1 ${
              hiveTestResult.blocked ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300'
            }`}>
              HTTP {hiveTestResult.status}: {hiveTestResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Snapshots List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Available Shop Backup Snapshots in <strong className="text-blue-300 font-mono">{partitionPath}</strong>:</span>
          <span className="font-mono text-blue-400">{backups.length} snapshot(s)</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <FileArchive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Shop Backups Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click &quot;Create Shop Backup&quot; to take a point-in-time snapshot of your catalog, register shifts, and transactions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map(b => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{b.id}</h4>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                        v{b.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{b.notes}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono flex-wrap">
                      <span>Products: <strong className="text-slate-300">{b.productsCount}</strong></span>
                      <span>Transactions: <strong className="text-slate-300">{b.transactionsCount}</strong></span>
                      <span>Saved At: <strong className="text-slate-300">{new Date(b.createdAt).toLocaleString()}</strong></span>
                      <span>By: <strong className="text-slate-300">{b.createdBy}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => setRestoreTarget(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Shop Data</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBackup(b)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: CREATE BACKUP */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Create Shop Backup Snapshot</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBackup} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Firebase Partition</label>
                <input
                  type="text"
                  disabled
                  value={partitionPath}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Isolated strictly to shop &quot;{tenant?.tenantName || 'Shop'}&quot;.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Backup Description / Notes</label>
                <textarea
                  rows={3}
                  value={backupNotes}
                  onChange={e => setBackupNotes(e.target.value)}
                  placeholder="e.g. End of month inventory adjustment snapshot before catalog update..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black transition flex items-center gap-1.5 shadow-md"
                >
                  {isCreating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM RESTORE */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Restore Shop Data From Snapshot</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Are you sure you want to restore your shop database from snapshot <strong>{restoreTarget.id}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                <div>Partition: <span className="text-blue-400">{restoreTarget.folderPath}</span></div>
                <div>Created At: <span className="text-slate-400">{new Date(restoreTarget.createdAt).toLocaleString()}</span></div>
                <div>Products in snapshot: <span className="text-emerald-400">{restoreTarget.productsCount}</span></div>
                <div>Transactions in snapshot: <span className="text-emerald-400">{restoreTarget.transactionsCount}</span></div>
              </div>
              <p className="text-amber-400/90 text-[11px]">
                Warning: Current product inventory and un-backed-up transactions in this tenant will be rolled back to the state in this snapshot.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md"
              >
                {isRestoring && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Restore Shop Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
