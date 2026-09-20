import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  Send,
  AlertCircle
} from 'lucide-react';
import { TenantContext, User, WorkspaceRole, isSystemHostUser } from '../../types';
import { getModuleDefinition, SUBSCRIPTION_PLAN_TIERS } from '../../data/subscriptionPlans';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface ModuleGatedWorkspaceProps {
  moduleRole: WorkspaceRole;
  tenant: TenantContext | null;
  currentUser: User | null;
  onOpenHiveConfig?: () => void;
  onSwitchToAllowed?: (role: WorkspaceRole) => void;
  onRequestUpgrade?: (moduleKey: string) => void;
}

export const ModuleGatedWorkspace: React.FC<ModuleGatedWorkspaceProps> = ({
  moduleRole,
  tenant,
  currentUser,
  onOpenHiveConfig,
  onSwitchToAllowed,
  onRequestUpgrade
}) => {
  const [requestSent, setRequestSent] = useState(false);
  const [notes, setNotes] = useState('');
  const isHost = isSystemHostUser(currentUser);
  const modDef = getModuleDefinition(moduleRole as any);

  const handleSendRequest = async () => {
    if (!tenant) return;
    posAudio.playSuccessChime();
    await dbService.addNotification({
      title: `Subscription Upgrade Request: ${modDef?.name || moduleRole}`,
      message: `${currentUser?.name || 'Survey Guest'} at ${tenant.tenantName} requested access to ${modDef?.name || moduleRole}. Current plan: ${tenant.plan} ($${tenant.monthlyFee}/mo). Note: ${notes || 'Requested workspace access.'}`,
      type: 'warning',
      targetWorkspace: 'hive_master'
    });
    if (onRequestUpgrade) {
      onRequestUpgrade(moduleRole);
    }
    setRequestSent(true);
  };

  // Find first allowed module for tenant
  const allowedRole: WorkspaceRole = (['sales', 'storeroom', 'accounts', 'manager', 'it', 'hr'] as WorkspaceRole[]).find(
    r => tenant?.enabledModules ? tenant.enabledModules[r as keyof typeof tenant.enabledModules] : true
  ) || 'sales';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950 text-slate-100 select-none overflow-y-auto">
      <div 
        id="view-module-gated-workspace"
        className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Top Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/80 mb-2">
            <span>Module Controlled by Hive Master</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {modDef?.name || moduleRole.toUpperCase()} Not Included in Subscription
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            The Hive Platform Host controls access to this module based on subscription fees paid.
          </p>
        </div>

        {/* Tenant Subscription Matrix Card */}
        {tenant && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                  Tenant Organization
                </span>
                <span className="text-sm font-bold text-white">{tenant.tenantName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                  Active Tier
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {tenant.plan} (${tenant.monthlyFee}/mo)
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Gating Reason: </span>
              <span>
                {modDef?.name || moduleRole} requires an upgraded subscription agreement or custom fee allocation configured by the Hive Master administrator.
              </span>
            </div>
          </div>
        )}

        {/* Module capabilities overview */}
        {modDef && (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-left space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Included Capabilities When Unlocked:</span>
              <span className="text-[10px] font-mono text-slate-400">
                ${modDef.standaloneMonthlyFee}/mo valuation
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-300">
              {modDef.coreFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3 pt-2">
          {isHost ? (
            <button
              onClick={onOpenHiveConfig}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure Subscription in Hive Master (Host Mode)</span>
            </button>
          ) : requestSent ? (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
              ✓ Upgrade request sent to Hive Master (aqutewavedev@gmail.com).
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional request note to Hive host..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-indigo-500"
              />
              <button
                onClick={handleSendRequest}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Upgrade</span>
              </button>
            </div>
          )}

          {onSwitchToAllowed && (
            <button
              onClick={() => onSwitchToAllowed(allowedRole)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Return to Permitted Workspace ({allowedRole.toUpperCase()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
