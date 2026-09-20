import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  QrCode, 
  Check, 
  AlertCircle, 
  Building2, 
  Monitor, 
  Smartphone, 
  Globe, 
  ArrowRight,
  Sparkles,
  Camera
} from 'lucide-react';
import { TenantContext, TerminalDevice, DeviceInvite } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';

interface PairTerminalModalProps {
  currentTenant?: TenantContext | null;
  currentTerminal?: TerminalDevice | null;
  isOpen?: boolean;
  onClose: () => void;
  onTerminalPaired?: (newTerminal: TerminalDevice) => void;
  onPaired?: (newTerminal: TerminalDevice) => void;
}

export const PairTerminalModal: React.FC<PairTerminalModalProps> = ({
  currentTenant,
  currentTerminal,
  isOpen = true,
  onClose,
  onTerminalPaired,
  onPaired
}) => {
  if (!isOpen) return null;

  const [inviteCode, setInviteCode] = useState('');
  const [pendingInvites, setPendingInvites] = useState<DeviceInvite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const loadInvites = async () => {
      const invites = await dbService.getDeviceInvites(currentTenant?.tenantId);
      setPendingInvites(invites.filter(i => i.status === 'pending'));
    };
    loadInvites();
  }, [currentTenant?.tenantId]);

  const handlePair = async (codeToUse?: string) => {
    const code = (codeToUse || inviteCode).trim();
    if (!code) {
      setErrorMessage('Please enter an invitation pairing code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await dbService.pairDeviceWithInvite(code, {
        operatingSystem: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile Handheld Browser' : 'Desktop Workstation Browser') : 'Browser Register'
      });

      if (!result.success || !result.terminal) {
        setErrorMessage(result.message);
        posAudio.playScanBeep();
        return;
      }

      posAudio.playCashChime();
      setSuccessMessage(result.message);
      if (onTerminalPaired) onTerminalPaired(result.terminal);
      if (onPaired) onPaired(result.terminal);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage('Failed to connect and verify pairing code.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanCode = (scanned: string) => {
    setInviteCode(scanned);
    setShowScanner(false);
    handlePair(scanned);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Pair Terminal Device
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Join {currentTenant.businessName}
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

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Current Device Status */}
          {currentTerminal && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Currently: {currentTerminal.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    ID: {currentTerminal.terminalCode} • {currentTerminal.deviceType}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
                Paired
              </span>
            </div>
          )}

          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-start gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Invitation Code Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Enter Tenant Invitation Code</span>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="e.g. PAIR-BN-8821"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter') handlePair();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Obtain this pairing key from the Business Owner or Store Manager.
            </p>
          </div>

          {/* Quick Connect from Tenant's Pending Invites (Demo / Testing Helper) */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending Invitations for {currentTenant.businessName}
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {pendingInvites.map(invite => (
                  <button
                    key={invite.id}
                    type="button"
                    onClick={() => {
                      setInviteCode(invite.inviteCode);
                      handlePair(invite.inviteCode);
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/40 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {invite.terminalName}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        {invite.inviteCode} • {invite.terminalCode} ({invite.deviceType})
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition">
                      Pair Now
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handlePair()}
              disabled={isSubmitting || !inviteCode.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Pair Device'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* QR Barcode Camera Scanner */}
      {showScanner && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleScanCode}
        />
      )}
    </div>
  );
};
