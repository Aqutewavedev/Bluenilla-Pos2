import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Cloud, 
  Database, 
  RefreshCw, 
  Printer, 
  Coins, 
  Volume2, 
  FileText, 
  Download, 
  Upload, 
  UserX, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AuditLog, SyncQueueItem, User } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { exportAuditLogsPDF, exportAuditLogsCSV } from '../../services/pdfReport';

interface ITWorkspaceProps {
  currentUser: User | null;
  isOffline: boolean;
  onTriggerSync: () => Promise<number>;
}

export const ITWorkspace: React.FC<ITWorkspaceProps> = ({
  currentUser,
  isOffline,
  onTriggerSync
}) => {
  const [tab, setTab] = useState<'sync' | 'gdpr' | 'backup' | 'hardware' | 'audit'>('sync');
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  // GDPR State
  const [gdprTargetEmail, setGdprTargetEmail] = useState('');
  const [gdprFeedback, setGdprFeedback] = useState<string | null>(null);

  // Backup State
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const queue = await dbService.getSyncQueue();
      setSyncQueue(queue);
      const logs = await dbService.getAuditLogs();
      setAuditLogs(logs.slice(-30).reverse());
    } catch (err) {
      console.warn('Failed to load IT telemetry data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleManualSync = async () => {
    if (!currentUser) {
      alert('Survey Mode: Cloud database synchronization requires subscription login.');
      return;
    }
    setIsSyncing(true);
    posAudio.playScanBeep();
    try {
      const syncedCount = await onTriggerSync();
      setLastSyncResult(`Synced ${syncedCount} queued change(s) to cloud.`);
      await loadData();
    } catch (e: any) {
      setLastSyncResult(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateCloudBackup = async () => {
    setBackupStatus('Creating encrypted snapshot bundle...');
    const snapshot = await dbService.createCloudBackup();
    
    // Download as JSON file
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bluenilla_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupStatus(`Cloud backup snapshot created & downloaded (${snapshot.timestamp})`);
  };

  const handleGDPRExport = async () => {
    if (!gdprTargetEmail.trim()) return;
    const data = await dbService.exportGDPRUserData(gdprTargetEmail.trim());
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gdpr_portable_data_${gdprTargetEmail.trim()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setGdprFeedback(`Portable GDPR user archive exported for ${gdprTargetEmail}`);
  };

  const handleGDPRAnonymize = async () => {
    if (!gdprTargetEmail.trim()) return;
    if (confirm(`Are you sure you want to anonymize / erase personal data for ${gdprTargetEmail}? This action is irreversible according to GDPR Article 17.`)) {
      await dbService.anonymizeGDPRUserData(gdprTargetEmail.trim(), currentUser.name);
      setGdprFeedback(`User data pseudonymized / anonymized successfully.`);
      await loadData();
    }
  };

  // Hardware tests
  const testPrinter = () => {
    posAudio.playScanBeep();
    window.print();
  };

  const testDrawer = () => {
    posAudio.playDrawerKick();
  };

  const testAudio = () => {
    posAudio.playScanBeep();
    setTimeout(() => posAudio.playErrorTone(), 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>I.T. Operations & Security Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Offline sync engine, GDPR Article 17 compliance, cloud backups, hardware self-test, and audit ledger
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'sync' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sync Engine ({syncQueue.length})
          </button>
          <button
            onClick={() => setTab('gdpr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'gdpr' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            GDPR Compliance
          </button>
          <button
            onClick={() => setTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'backup' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cloud Backups
          </button>
          <button
            onClick={() => setTab('hardware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'hardware' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'audit' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {tab === 'sync' && (
          <div className="space-y-4">
            {/* Sync Status Banner */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isOffline ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isOffline ? 'Offline Local Storage Active (IndexedDB)' : 'Online Cloud Master Synchronization'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOffline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isOffline ? 'Offline' : 'Connected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {syncQueue.length} pending local write mutation(s) in offline buffer queue.
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Force Sync to Cloud'}</span>
              </button>
            </div>

            {lastSyncResult && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {lastSyncResult}
              </div>
            )}

            {/* Sync Queue Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Offline Write Queue Buffer
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Queued Timestamp</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {syncQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                        All local mutations are fully synchronized with the cloud database.
                      </td>
                    </tr>
                  ) : (
                    syncQueue.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white capitalize">{item.entity}</td>
                        <td className="p-3 uppercase font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{item.action}</td>
                        <td className="p-3 font-mono text-slate-500">{item.data.id || 'N/A'}</td>
                        <td className="p-3 font-mono text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'gdpr' && (
          <div className="max-w-2xl space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  EU GDPR & Privacy Protection Controls
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                BLUENILLA implements privacy-by-design, cryptographic tokenization, role-based scoping, and automated compliance with GDPR Article 15 (Right of Access) and Article 17 (Right to Erasure / "To be forgotten").
              </p>

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Email Identifier:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter customer or employee email (e.g. s.connor@gmail.com)..."
                    value={gdprTargetEmail}
                    onChange={(e) => setGdprTargetEmail(e.target.value)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <button
                    onClick={handleGDPRExport}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Portable JSON</span>
                  </button>
                  <button
                    onClick={handleGDPRAnonymize}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Pseudonymize / Erase</span>
                  </button>
                </div>
              </div>

              {gdprFeedback && (
                <p className="text-xs text-emerald-600 font-medium p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                  {gdprFeedback}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'backup' && (
          <div className="max-w-2xl space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cloud Snapshot & Disaster Recovery
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate an immutable full-state snapshot of your catalogue, orders, invoices, staff timecards, and general ledger for secure off-site archive.
              </p>

              <button
                onClick={handleCreateCloudBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Create & Download Cloud Backup File</span>
              </button>

              {backupStatus && (
                <p className="text-xs text-emerald-600 font-medium p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                  {backupStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'hardware' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-center">
              <Printer className="w-8 h-8 mx-auto text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Thermal Receipt Printer</h4>
              <p className="text-[11px] text-slate-500">Test ESC/POS 80mm feed & font rendering</p>
              <button
                onClick={testPrinter}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
              >
                Trigger Test Print
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-center">
              <Coins className="w-8 h-8 mx-auto text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cash Drawer Kick</h4>
              <p className="text-[11px] text-slate-500">Simulate RJ12 24V solenoid pulse</p>
              <button
                onClick={testDrawer}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
              >
                Test Drawer Solenoid
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-center">
              <Volume2 className="w-8 h-8 mx-auto text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">POS Audio Beeper</h4>
              <p className="text-[11px] text-slate-500">Test Web Audio API synthesized frequencies</p>
              <button
                onClick={testAudio}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
              >
                Play Audio Tone
              </button>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Immutable System Audit Trail
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportAuditLogsCSV(auditLogs)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => exportAuditLogsPDF(auditLogs)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{log.actorName || 'System'}</td>
                      <td className="p-3 capitalize text-slate-500 text-[11px]">{(log.actorRole || 'system').replace('_', ' ')}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.action || '-'}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{log.entity || '-'}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
