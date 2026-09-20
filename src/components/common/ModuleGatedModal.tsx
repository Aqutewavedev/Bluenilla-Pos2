import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Mail,
  Send,
  Building2,
  DollarSign
} from 'lucide-react';
import { TenantContext, User, WorkspaceRole, isSystemHostUser } from '../../types';
import { getModuleDefinition, SUBSCRIPTION_PLAN_TIERS } from '../../data/subscriptionPlans';
import { posAudio } from '../../services/hardware';
import { dbService } from '../../services/db';

interface ModuleGatedModalProps {
  isOpen: boolean;
  moduleRole: WorkspaceRole;
  tenant: TenantContext | null;
  currentUser: User;
  onClose: () => void;
  onOpenHiveConfig?: () => void;
  onRequestUpgrade?: (moduleKey: string) => void;
}

export const ModuleGatedModal: React.FC<ModuleGatedModalProps> = ({
  isOpen,
  moduleRole,
  tenant,
  currentUser,
  onClose,
  onOpenHiveConfig,
  onRequestUpgrade
}) => {
  if (!isOpen || !tenant) return null;

  const [requestSent, setRequestSent] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const isHost = isSystemHostUser(currentUser);

  const modDef = getModuleDefinition(moduleRole as any);

  const handleSendUpgradeRequest = async () => {
    posAudio.playSuccessChime();
    await dbService.addNotification({
      title: `Module Upgrade Requested: ${modDef?.name || moduleRole}`,
      message: `${currentUser.name} (${tenant.tenantName}) requested access to ${modDef?.name || moduleRole}. Current fee: $${tenant.monthlyFee}/mo (${tenant.plan}). Note: ${requestNotes || 'Please upgrade our subscription.'}`,
      type: 'warning',
      targetWorkspace: 'hive_master'
    });
    if (onRequestUpgrade) {
      onRequestUpgrade(moduleRole);
    }
    setRequestSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="modal-module-gated-notice"
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto text-slate-100"
      >
        {/* Top Visual Banner */}
        <div className="p-6 bg-linear-to-b from-amber-500/10 via-slate-900 to-slate-900 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 mb-3">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/80 mb-2">
            <span>Controlled by Hive Master</span>
          </div>

          <h3 className="text-lg font-extrabold text-white tracking-tight">
            {modDef?.name || 'Module'} Gated by Subscription
          </h3>

          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            This module is not included in <strong className="text-slate-200">{tenant.tenantName}</strong>'s current subscription agreement.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Current Subscription Status Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">
                Active Organization Plan
              </div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{tenant.plan} Subscription Tier</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-400 border border-indigo-800">
                  ${tenant.monthlyFee}/mo paid
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Module Status</div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                <Lock className="w-3 h-3" />
                <span>Gated</span>
              </span>
            </div>
          </div>

          {/* Module description */}
          {modDef && (
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center justify-between">
                <span>What this module delivers:</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Valued at ${modDef.standaloneMonthlyFee}/mo
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {modDef.tagline}
              </p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                {modDef.coreFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation of Hive control */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/50 text-indigo-200 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Centralized Platform Architecture:</strong> The Hive Master Host controls module access across all business tenants according to subscription fees paid.
            </div>
          </div>

          {/* Action Area */}
          {isHost ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>You are signed in as Hive Platform Host</span>
              </div>
              <p className="text-[11px] text-slate-300">
                You can immediately unlock this module for {tenant.tenantName} and configure their subscription fee in Hive Master.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenHiveConfig) onOpenHiveConfig();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4 font-bold" />
                <span>Configure Tenant Subscription in Hive</span>
              </button>
            </div>
          ) : requestSent ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-emerald-300">Upgrade Request Dispatched</div>
              <p className="text-[11px] text-slate-400">
                The Hive Master Platform Host (aqutewavedev@gmail.com) has received your request to enable {modDef?.name || moduleRole}.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="text-[11px] font-medium text-slate-400 block">
                Request Subscription Upgrade from Hive Host:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Optional message to platform administrator..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSendUpgradeRequest}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
