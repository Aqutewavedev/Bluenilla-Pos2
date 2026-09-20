import React from 'react';
import { 
  Lock, 
  Eye, 
  Sparkles, 
  Store, 
  X, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TenantContext, isShopSubscribed } from '../../types';

interface GuestModeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  currentTenant: TenantContext;
  availableTenants: TenantContext[];
  onSwitchToSubscribedShop: (shop: TenantContext) => void;
  onOpenSubscriptionManager: () => void;
}

export const GuestModeNoticeModal: React.FC<GuestModeNoticeModalProps> = ({
  isOpen,
  onClose,
  actionName,
  currentTenant,
  availableTenants,
  onSwitchToSubscribedShop,
  onOpenSubscriptionManager
}) => {
  if (!isOpen) return null;

  const subscribedShop = availableTenants.find(
    t => t.tenantId === currentTenant.tenantId && isShopSubscribed(t) && t.id !== currentTenant.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Action Locked: Shop Guest Mode
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {currentTenant.businessName} (Unsubscribed)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Attempted action: <strong className="text-slate-900 dark:text-white">{actionName}</strong>.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Roam & Read Mode Only</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Under your tenant subscription plan, only 1 shop is active for write transactions at a time. All other shops operate in Guest Mode where you can explore catalogs, inventory, and reports, but writing data is restricted.
            </p>
          </div>

          {/* Quick choices */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenSubscriptionManager();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Activate Subscription for {currentTenant.businessName}</span>
            </button>

            {subscribedShop && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchToSubscribedShop(subscribedShop);
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Store className="w-3.5 h-3.5 text-emerald-500" />
                <span>Switch to Subscribed Shop ({subscribedShop.businessName})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-1.5 px-3 text-center text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Continue Roaming in Guest Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
