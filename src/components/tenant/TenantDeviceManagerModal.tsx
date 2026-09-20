import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Monitor, 
  Smartphone, 
  Globe, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Building2, 
  Clock, 
  Wifi, 
  RefreshCw, 
  KeyRound, 
  QrCode,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { TenantContext, TerminalDevice, DeviceInvite, User } from '../../types';
import { dbService, subscribeToSyncEvents } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { InviteDeviceModal } from './InviteDeviceModal';

interface TenantDeviceManagerModalProps {
  currentTenant?: TenantContext;
  tenant?: TenantContext;
  currentUser: User;
  currentTerminal?: TerminalDevice | null;
  isOpen?: boolean;
  onClose: () => void;
  onOpenInviteModal?: () => void;
  onOpenPairModal?: () => void;
  onTerminalUpdated?: () => void;
}

export const TenantDeviceManagerModal: React.FC<TenantDeviceManagerModalProps> = ({
  currentTenant: currentTenantProp,
  tenant: tenantProp,
  currentUser,
  currentTerminal,
  isOpen = true,
  onClose,
  onOpenInviteModal,
  onOpenPairModal,
  onTerminalUpdated
}) => {
  const currentTenant = currentTenantProp || tenantProp;
  if (!isOpen || !currentTenant) return null;

  const [activeTab, setActiveTab] = useState<'terminals' | 'invites'>('terminals');
  const [terminals, setTerminals] = useState<TerminalDevice[]>([]);
  const [invites, setInvites] = useState<DeviceInvite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    const [allTerms, allInvites] = await Promise.all([
      dbService.getTerminals(),
      dbService.getDeviceInvites(currentTenant.tenantId)
    ]);
    // Filter terminals belonging to this tenant
    const tenantTerms = allTerms.filter(t => t.tenantId === currentTenant.tenantId || t.businessId === currentTenant.businessId);
    setTerminals(tenantTerms);
    setInvites(allInvites);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToSyncEvents((event) => {
      if (event.type === 'TERMINALS_UPDATED' || event.type === 'INVITES_UPDATED' || event.type === 'TENANTS_UPDATED') {
        loadData();
      }
    });
    return unsub;
  }, [currentTenant.tenantId]);

  const handleRevokeTerminal = async (term: TerminalDevice) => {
    if (confirm(`Are you sure you want to revoke access for terminal "${term.name}" (${term.terminalCode})? This will immediately disconnect the register till.`)) {
      posAudio.playScanBeep();
      await dbService.revokeTerminal(term.id);
      loadData();
      if (onTerminalUpdated) onTerminalUpdated();
    }
  };

  const handleRevokeInvite = async (inv: DeviceInvite) => {
    if (confirm(`Revoke invitation for "${inv.terminalName}" [${inv.inviteCode}]?`)) {
      posAudio.playScanBeep();
      await dbService.revokeDeviceInvite(inv.id);
      loadData();
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    posAudio.playScanBeep();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const activeTerminals = terminals.filter(t => t.isRegistered !== false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {currentTenant.businessName}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {currentTenant.plan}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Business Owner Device & Terminal Fleet Management • {currentTenant.tenantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Invite New Device</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quota & Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-xs shrink-0">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Active Terminals</span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1">
              <span>{activeTerminals.length}</span>
              <span className="text-xs text-slate-400 font-normal">/ {currentTenant.terminalQuota} max</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Pending Invites</span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {pendingInvites.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Current Device</span>
            <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
              {currentTerminal?.terminalCode || 'Unregistered'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Pair This Terminal</span>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                Join register till
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPairModal();
              }}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition font-bold"
              title="Pair with invite code"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('terminals')}
            className={`px-4 py-2 border-b-2 font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'terminals'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Active Terminals ({activeTerminals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 border-b-2 font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'invites'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Device Invitations & Codes ({pendingInvites.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Active Terminals Table */}
          {activeTab === 'terminals' && (
            <div className="space-y-2">
              {activeTerminals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Monitor className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Terminals Paired Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                    Invite a register till, Android Zebra scanner, or iPad POS to connect it to {currentTenant.businessName}.
                  </p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition"
                  >
                    + Invite First Device
                  </button>
                </div>
              ) : (
                activeTerminals.map(term => {
                  const isCurrent = currentTerminal?.id === term.id;
                  const isOnline = term.status === 'online';

                  return (
                    <div 
                      key={term.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          term.deviceType === 'android' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                            : term.deviceType === 'desktop' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' 
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}>
                          {term.deviceType === 'android' ? (
                            <Smartphone className="w-5 h-5" />
                          ) : term.deviceType === 'desktop' ? (
                            <Monitor className="w-5 h-5" />
                          ) : (
                            <Globe className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              {term.terminalCode}
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {term.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-indigo-600 text-white font-mono">
                                THIS BROWSER
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                            <span>OS: {term.operatingSystem}</span>
                            <span>•</span>
                            <span>IP: {term.ipAddress}</span>
                            <span>•</span>
                            <span>Heartbeat: {term.lastHeartbeat}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">
                            {term.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRevokeTerminal(term)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                            title="Revoke and wipe terminal credentials"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Pending Invitations Table */}
          {activeTab === 'invites' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Device Onboarding via Invitation Keys</span>
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  Provide these codes to the staff deploying registers, or scan the QR code from the new device to automatically link it to <strong>{currentTenant.businessName}</strong>.
                </p>
              </div>

              {pendingInvites.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Pending Device Invitations</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition"
                  >
                    + Generate Device Invitation
                  </button>
                </div>
              ) : (
                pendingInvites.map(inv => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {inv.terminalName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {inv.terminalCode}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({inv.deviceType})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Branch: {inv.branchName} • Created {inv.createdAt} • Expires: {inv.expiresAt}
                      </div>
                      {inv.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5 italic">
                          Note: "{inv.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-extrabold text-sm tracking-wider text-indigo-600 dark:text-indigo-400 select-all">
                        {inv.inviteCode}
                      </div>

                      <button
                        onClick={() => handleCopyCode(inv.inviteCode, inv.id)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                        title="Copy pairing code"
                      >
                        {copiedId === inv.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleRevokeInvite(inv)}
                        className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Tenant ID: <code className="font-mono">{currentTenant.tenantId}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>

      {/* Invite Modal nested */}
      {showInviteModal && (
        <InviteDeviceModal
          currentTenant={currentTenant}
          onClose={() => setShowInviteModal(false)}
          onInviteCreated={() => loadData()}
          onPairNow={() => {
            setShowInviteModal(false);
            if (onOpenPairModal) onOpenPairModal();
          }}
        />
      )}
    </div>
  );
};
