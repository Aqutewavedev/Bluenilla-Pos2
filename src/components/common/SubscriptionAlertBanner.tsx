import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  X, 
  Mail, 
  ExternalLink,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { TenantContext, getSubscriptionAlertState } from '../../types';

interface SubscriptionAlertBannerProps {
  tenant: TenantContext | null | undefined;
  onOpenSubscriptionManager?: () => void;
  onSendEmailAlert?: () => void;
}

export const SubscriptionAlertBanner: React.FC<SubscriptionAlertBannerProps> = ({
  tenant,
  onOpenSubscriptionManager,
  onSendEmailAlert
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!tenant || dismissed) return null;

  const alertInfo = getSubscriptionAlertState(tenant);

  // If healthy or guest mode (handled by ShopGuestModeBanner), do not show this banner
  if (alertInfo.state === 'healthy' || alertInfo.state === 'unsubscribed') {
    return null;
  }

  return (
    <aside 
      aria-label="Subscription Status Alert"
      className={`border-b px-4 py-2.5 transition-all animate-in slide-in-from-top-1 duration-200 ${alertInfo.bannerColor}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Icon and Alert Content */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {alertInfo.state === 'overdue' && (
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
            )}
            {alertInfo.state === 'expiring_critical' && (
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
            )}
            {alertInfo.state === 'expiring_warning' && (
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            )}
            {alertInfo.state === 'approved' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs tracking-wide uppercase flex items-center gap-1.5 text-white">
                {alertInfo.title}
              </span>
              <span className={`px-2 py-0.5 text-[10px] rounded-md font-mono font-bold border ${alertInfo.badgeColor}`}>
                {tenant.customPlanName || tenant.plan}
              </span>
              {alertInfo.isOverdue && (
                <span className="px-2 py-0.5 text-[10px] rounded-md font-mono font-bold bg-rose-600 text-white animate-bounce">
                  ACTION REQUIRED
                </span>
              )}
              {alertInfo.isExpiringSoon && (
                <span className="px-2 py-0.5 text-[10px] rounded-md font-mono font-semibold bg-amber-900/60 text-amber-200 border border-amber-500/30">
                  {alertInfo.daysRemaining} days left
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${alertInfo.textColor}`}>
              {alertInfo.message}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {onOpenSubscriptionManager && (
            <button
              onClick={onOpenSubscriptionManager}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                alertInfo.state === 'overdue' 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30' 
                  : alertInfo.state === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/30'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{alertInfo.actionText}</span>
            </button>
          )}

          {onSendEmailAlert && (alertInfo.isOverdue || alertInfo.isExpiringSoon) && (
            <button
              onClick={onSendEmailAlert}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-700 shadow-xs transition flex items-center gap-1.5"
              title="Send notice email to tenant owner"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Email Notice</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
