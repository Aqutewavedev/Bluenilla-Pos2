import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Smartphone, 
  Monitor, 
  Globe, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TenantContext, PlatformMode, DeviceInvite, TerminalDevice, User } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface InviteDeviceModalProps {
  currentTenant?: TenantContext;
  tenant?: TenantContext;
  isOpen?: boolean;
  currentUser?: User;
  onClose: () => void;
  onInviteCreated?: (invite?: DeviceInvite) => void;
  onPairNow?: (invite: DeviceInvite) => void;
}

export const InviteDeviceModal: React.FC<InviteDeviceModalProps> = ({
  currentTenant: currentTenantProp,
  tenant: tenantProp,
  isOpen = true,
  currentUser,
  onClose,
  onInviteCreated,
  onPairNow
}) => {
  const activeTenant = currentTenantProp || tenantProp;
  if (!isOpen || !activeTenant) return null;

  const [terminalName, setTerminalName] = useState('');
  const [terminalCode, setTerminalCode] = useState('REG-04');
  const [deviceType, setDeviceType] = useState<PlatformMode>('browser');
  const [branchName, setBranchName] = useState('Downtown Flagship');
  const [expiresAt, setExpiresAt] = useState('7 Days');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Once generated
  const [createdInvite, setCreatedInvite] = useState<DeviceInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalName.trim()) return;

    setIsSubmitting(true);
    try {
      const invite = await dbService.createDeviceInvite({
        tenantId: activeTenant.tenantId,
        businessId: activeTenant.businessId,
        businessName: activeTenant.businessName,
        terminalName: terminalName.trim(),
        terminalCode: terminalCode.trim().toUpperCase(),
        deviceType,
        branchId: 'br-1',
        branchName,
        expiresAt,
        notes: notes.trim()
      });

      posAudio.playScanBeep();
      setCreatedInvite(invite);
      if (onInviteCreated) onInviteCreated(invite);
    } catch (err) {
      console.error('Failed to create device invite:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite.inviteCode);
    setCopied(true);
    posAudio.playScanBeep();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {createdInvite ? 'Device Invitation Ready' : 'Invite New Device to Tenant'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTenant.businessName} • {activeTenant.tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!createdInvite ? (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Tenant Business Owner Authorization</span>
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                As business owner of <strong>{activeTenant.businessName}</strong>, generate an authorized pairing token for a new POS till, mobile tablet, or checkout terminal.
              </p>
            </div>

            {/* Terminal Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Terminal / Register Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lane 04 Self-Checkout"
                  value={terminalName}
                  onChange={e => setTerminalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Code ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REG-04"
                  value={terminalCode}
                  onChange={e => setTerminalCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Platform Type Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Target Device Architecture
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'browser', label: 'Web / iPad PWA', icon: Globe, desc: 'Browser & tablets' },
                  { id: 'android', label: 'Android POS', icon: Smartphone, desc: 'Zebra / Handheld' },
                  { id: 'desktop', label: 'Desktop Kiosk', icon: Monitor, desc: 'Windows / Linux till' }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = deviceType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDeviceType(item.id as PlatformMode)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center sm:items-start text-center sm:text-left ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-white ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <div className="font-bold text-[11px] leading-tight">{item.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Branch Assignment & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Assigned Store Branch
                </label>
                <select
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="Downtown Flagship">Downtown Flagship Roastery</option>
                  <option value="Airport Concourse B">Airport Concourse B Express</option>
                  <option value="Westside Drive-Thru">Westside Drive-Thru</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Invitation Validity
                </label>
                <select
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="24 Hours">24 Hours</option>
                  <option value="7 Days">7 Days (Recommended)</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>
            </div>

            {/* Operational Notes */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Deployment Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dedicated to outdoor terrace weekend brunch rush"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !terminalName.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Generating...' : 'Generate Pairing Invitation'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Invitation Generated View */
          <div className="p-5 space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
              <Check className="w-3.5 h-3.5" />
              <span>Invitation Active & Waiting For Device</span>
            </div>

            {/* Big Monospace Pairing Code */}
            <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-bold">
                Device Pairing Code
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 select-all">
                {createdInvite.inviteCode}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Valid for {createdInvite.expiresAt} • Register ID: {createdInvite.terminalCode}
              </p>
            </div>

            {/* Stylized QR Code Representation */}
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xs mx-auto shadow-inner">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                {/* Clean SVG Matrix Pattern representing QR */}
                <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-900" fill="currentColor">
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="19" y="19" width="12" height="12" fill="currentColor" />

                  <rect x="80" y="10" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="89" y="19" width="12" height="12" fill="currentColor" />

                  <rect x="10" y="80" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="19" y="89" width="12" height="12" fill="currentColor" />

                  {/* High density data points */}
                  <rect x="48" y="14" width="8" height="8" />
                  <rect x="62" y="14" width="8" height="8" />
                  <rect x="48" y="28" width="8" height="8" />
                  <rect x="62" y="28" width="8" height="8" />
                  <rect x="14" y="48" width="8" height="8" />
                  <rect x="28" y="48" width="8" height="8" />
                  <rect x="42" y="48" width="8" height="8" />
                  <rect x="56" y="48" width="8" height="8" />
                  <rect x="70" y="48" width="8" height="8" />
                  <rect x="84" y="48" width="8" height="8" />
                  <rect x="98" y="48" width="8" height="8" />
                  <rect x="48" y="62" width="8" height="8" />
                  <rect x="62" y="62" width="8" height="8" />
                  <rect x="76" y="62" width="8" height="8" />
                  <rect x="90" y="62" width="8" height="8" />
                  <rect x="48" y="76" width="8" height="8" />
                  <rect x="62" y="76" width="8" height="8" />
                  <rect x="76" y="76" width="8" height="8" />
                  <rect x="48" y="90" width="8" height="8" />
                  <rect x="62" y="90" width="8" height="8" />
                  <rect x="76" y="90" width="8" height="8" />
                  <rect x="90" y="90" width="8" height="8" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">
                Scan with Handheld or Tablet Camera
              </p>
            </div>

            {/* Instructions */}
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              On the target terminal or register, launch <strong>BLUENILLA POS</strong>, tap <strong>"Pair Terminal"</strong>, and enter code <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{createdInvite.inviteCode}</span>.
            </p>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Code Copied!' : 'Copy Pairing Code'}</span>
              </button>

              {onPairNow && (
                <button
                  type="button"
                  onClick={() => {
                    onPairNow(createdInvite);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Pair This Browser Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
