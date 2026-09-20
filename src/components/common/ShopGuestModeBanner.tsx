import React, { useState } from 'react';
import { 
  Eye, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Store, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { TenantContext, isShopSubscribed } from '../../types';

interface ShopGuestModeBannerProps {
  currentTenant: TenantContext;
  availableTenants: TenantContext[];
  onSwitchToSubscribedShop: (shop: TenantContext) => void;
  onOpenSubscriptionManager: () => void;
}

export const ShopGuestModeBanner: React.FC<ShopGuestModeBannerProps> = ({
  currentTenant,
  availableTenants,
  onSwitchToSubscribedShop,
  onOpenSubscriptionManager
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // If the shop is already subscribed, don't show the banner
  if (isShopSubscribed(currentTenant)) return null;

  // Find if tenant has another shop that IS subscribed
  const subscribedSiblingShop = availableTenants.find(
    t => t.tenantId === currentTenant.tenantId && isShopSubscribed(t) && t.id !== currentTenant.id
  );

  if (collapsed) {
    return (
      <div className="bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
          <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Shop Guest Mode (Read-Only): <strong>{currentTenant.businessName}</strong></span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="text-amber-700 dark:text-amber-300 underline font-semibold text-[11px] hover:text-amber-900"
        >
          Expand Details
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-orange-950/60 border-b border-amber-500/30 px-4 py-2.5 transition-all animate-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left Info */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Shop Guest Mode (Read-Only)
              </span>
              <span className="px-1.5 py-0.2 text-[10px] rounded font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-400/40">
                {currentTenant.businessName}
              </span>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Tenant: {currentTenant.tenantName}
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
              You are navigating this shop under your tenant credentials. Because this shop is currently <strong>unsubscribed</strong>, you can roam and read all modules (POS catalog, inventory, accounts, staff), but transaction checkout and data writes are locked.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {subscribedSiblingShop && (
            <button
              onClick={() => onSwitchToSubscribedShop(subscribedSiblingShop)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-emerald-500" />
              <span>Switch to Subscribed Shop ({subscribedSiblingShop.businessName})</span>
            </button>
          )}

          <button
            onClick={onOpenSubscriptionManager}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Activate Subscription for this Shop</span>
          </button>

          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition"
            title="Minimize banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
