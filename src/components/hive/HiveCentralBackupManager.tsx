import React, { useState, useEffect } from 'react';
import {
  Server,
  ShieldAlert,
  ShieldCheck,
  FolderLock,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Building2,
  FileArchive,
  Lock,
  Unlock,
  Layers,
  Clock,
  X
} from 'lucide-react';
import { User, HiveCentralBackupSnapshot } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface HiveCentralBackupManagerProps {
  currentUser: User;
}

export const HiveCentralBackupManager: React.FC<HiveCentralBackupManagerProps> = ({
  currentUser
}) => {
  const [backups, setBackups] = useState<HiveCentralBackupSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [backupNotes, setBackupNotes] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Restore Modal
  const [restoreTarget, setRestoreTarget] = useState<HiveCentralBackupSnapshot | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Security Simulation Tester
  const [simulatedRole, setSimulatedRole] = useState<'cashier' | 'tenant_admin' | 'hive_master'>('tenant_admin');
  const [isTestingSimulation, setIsTestingSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const loadCentralBackups = async () => {
    setIsLoading(true);
    try {
      const res = await backOfficeApi.getHiveBackups(currentUser);
      if (res.success) {
        setBackups(res.backups);
      }
    } catch (err) {
      console.error('Failed to load Hive central backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCentralBackups();
  }, [currentUser.id]);

  const handleCreateCentralBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    posAudio.playButtonPress();

    try {
      const res = await backOfficeApi.createHiveBackup(backupNotes || 'Master Hive platform scheduled backup', currentUser);
      if (res.success) {
        posAudio.playSuccessChime();
        setShowCreateModal(false);
        setBackupNotes('');
        await loadCentralBackups();
      } else {
        alert(res.error || 'Failed to create Hive central backup');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    setRestoreSuccess(null);
    posAudio.playButtonPress();

    try {
      const res = await backOfficeApi.restoreHiveBackup(restoreTarget.id, currentUser);
      if (res.success) {
        posAudio.playSuccessChime();
        setRestoreSuccess(res.message || `Hive Platform successfully restored from snapshot ${restoreTarget.id}`);
        setRestoreTarget(null);
        await loadCentralBackups();
      } else {
        alert(res.error || 'Failed to restore Hive snapshot');
      }
    } catch (err: any) {
      alert(err.message || 'Error during central restore');
    } finally {
      setIsRestoring(false);
    }
  };

  // Run real API test with simulated role headers
  const handleRunSecurityTest = async () => {
    setIsTestingSimulation(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/hive/backups', {
        headers: {
          'X-User-Role': simulatedRole,
          'X-User-Name': `Simulated_${simulatedRole}`
        }
      });
      const data = await res.json();
      setSimulationResult({
        status: res.status,
        allowed: res.status === 200,
        data
      });
    } catch (err: any) {
      setSimulationResult({
        status: 500,
        allowed: false,
        error: err.message
      });
    } finally {
      setIsTestingSimulation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Server className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-white">Hive Central Platform Backup Control</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Master platform state management and alignment. 
            Hive platform backups reside strictly in <code className="text-amber-400 font-mono">hive/platform/backups/*</code>.
            Tenants are strictly blocked from viewing or restoring central platform backups.
          </p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-amber-400" />
              <span>Hive Partition: <strong>hive/platform/backups</strong></span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Master Authority Restrictive Policy Active</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadCentralBackups}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Create Hive Master Backup</span>
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

      {/* Security Architecture Interactive Simulation Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Interactive Tenant Isolation & Security Test</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Backend Route: /api/hive/backups</span>
        </div>

        <p className="text-xs text-slate-400">
          Verify how the backend enforces the strict separation where <em>&quot;a tenant cannot use or see Hive central backups&quot;</em>. 
          Select a role below to simulate a request to the Hive master control endpoint:
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {(['cashier', 'tenant_admin', 'hive_master'] as const).map(role => (
            <button
              key={role}
              onClick={() => setSimulatedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                simulatedRole === role
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === 'hive_master' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{role}</span>
            </button>
          ))}

          <button
            onClick={handleRunSecurityTest}
            disabled={isTestingSimulation}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition flex items-center gap-1.5 ml-auto"
          >
            {isTestingSimulation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Execute Access Test</span>
          </button>
        </div>

        {simulationResult && (
          <div className={`p-3 rounded-xl text-xs font-mono border ${
            simulationResult.status === 200
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {simulationResult.status === 200 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>HTTP 200 OK — Authorized Access (Hive Master)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>HTTP {simulationResult.status} Forbidden — Boundary Defended!</span>
                </>
              )}
            </div>
            <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(simulationResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Snapshots List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Central Platform Snapshots in <strong className="text-amber-300 font-mono">hive/platform/backups</strong>:</span>
          <span className="font-mono text-amber-400">{backups.length} snapshot(s)</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <FileArchive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Hive Platform Backups Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Click &quot;Create Hive Master Backup&quot; to snapshot all multi-tenant platform configurations and tier quotas.
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
                  <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                    <Server className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">{b.id}</h4>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                        v{b.version} • {b.scope}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{b.notes}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono flex-wrap">
                      <span>Total Tenants: <strong className="text-slate-300">{b.totalTenants}</strong></span>
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
                    <span>Restore Platform State</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: CREATE HIVE BACKUP */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>Create Central Hive Master Backup</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCentralBackup} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Firebase Partition</label>
                <input
                  type="text"
                  disabled
                  value="hive/platform/backups"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Central Backup Description</label>
                <textarea
                  rows={3}
                  value={backupNotes}
                  onChange={e => setBackupNotes(e.target.value)}
                  placeholder="e.g. Master snapshot before platform-wide schema migration..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center gap-1.5 shadow-md"
                >
                  {isCreating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Platform Snapshot</span>
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
              <h3 className="text-sm font-bold text-white">Restore Hive Central Platform State</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Are you sure you want to restore the platform state from central snapshot <strong>{restoreTarget.id}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                <div>Partition: <span className="text-amber-400">{restoreTarget.folderPath}</span></div>
                <div>Created At: <span className="text-slate-400">{new Date(restoreTarget.createdAt).toLocaleString()}</span></div>
                <div>Tenants recorded: <span className="text-emerald-400">{restoreTarget.totalTenants}</span></div>
              </div>
              <p className="text-rose-400/90 text-[11px]">
                Warning: This will restore platform subscription limits, plan tiers, and tenant registrations across the entire ecosystem.
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
                <span>Confirm & Restore Hive Platform</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
