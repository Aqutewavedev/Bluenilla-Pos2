import React, { useState } from 'react';
import {
  X,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  CreditCard,
  Building2,
  Check
} from 'lucide-react';
import { TenantContext, isShopSubscribed, User } from '../../types';
import { dbService } from '../../services/db';

interface ShopSubscriptionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: TenantContext;
  availableTenants: TenantContext[];
  currentUser?: User | null;
  onSwitchShop: (shop: TenantContext) => void;
  onOpenCreateShop: () => void;
  onTenantsUpdated?: () => void;
}

export const ShopSubscriptionManagerModal: React.FC<ShopSubscriptionManagerModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  availableTenants,
  currentUser,
  onSwitchShop,
  onOpenCreateShop,
  onTenantsUpdated
}) => {
  if (!isOpen) return null;

  // Filter to shops belonging to this tenant organization
  const tenantShops = availableTenants.filter(t => t.tenantId === activeTenant.tenantId);
  const subscribedShops = tenantShops.filter(t => isShopSubscribed(t));
  const guestShops = tenantShops.filter(t => !isShopSubscribed(t));

  const [processingShopId, setProcessingShopId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmTransferShop, setConfirmTransferShop] = useState<TenantContext | null>(null);

  const handleTransfer = async (targetShop: TenantContext) => {
    setProcessingShopId(targetShop.id);
    setSuccessMsg(null);
    try {
      await dbService.transferShopSubscription(activeTenant.tenantId, targetShop.id);
      setSuccessMsg(`Subscription transferred to "${targetShop.businessName}". It is now active with full read/write access. Other shops are set to Guest Mode.`);
      setConfirmTransferShop(null);
      if (onTenantsUpdated) onTenantsUpdated();
      // Also switch into this newly activated shop
      onSwitchShop({ ...targetShop, isSubscribed: true, status: 'active' });
    } catch (err: any) {
      console.error('Transfer failed:', err);
    } finally {
      setProcessingShopId(null);
    }
  };

  const handleAddSlot = async (targetShop: TenantContext) => {
    setProcessingShopId(targetShop.id);
    setSuccessMsg(null);
    try {
      await dbService.addShopSubscriptionSlot(activeTenant.tenantId, targetShop.id);
      setSuccessMsg(`Additional subscription slot activated for "${targetShop.businessName}". Both shops are now fully functional with write access!`);
      if (onTenantsUpdated) onTenantsUpdated();
      onSwitchShop({ ...targetShop, isSubscribed: true, status: 'active' });
    } catch (err: any) {
      console.error('Add slot failed:', err);
    } finally {
      setProcessingShopId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Tenant Shop Subscriptions & Activation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organization: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeTenant.tenantName}</strong> • Same Credentials Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status summary banner */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {tenantShops.length} Registered {tenantShops.length === 1 ? 'Shop' : 'Shops'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {subscribedShops.length} Subscribed (Active)
                </span>
                {guestShops.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    {guestShops.length} Guest Mode
                  </span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Under the 1-subscription rule, only 1 shop is activated for full write operations and checkout at a time. All other shops operate in Guest Mode (roam & read-only).
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCreateShop();
              }}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Another Shop</span>
            </button>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Transfer confirmation dialog if active */}
          {confirmTransferShop && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Confirm Transfer of Active Subscription
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed mt-0.5">
                    Your 1 active subscription will be transferred to <strong>"{confirmTransferShop.businessName}"</strong>. It will become fully functional with read and write capabilities. Previous shops under {activeTenant.tenantName} will transition to Guest Mode (roam & read-only).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmTransferShop(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTransfer(confirmTransferShop)}
                  disabled={processingShopId === confirmTransferShop.id}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {processingShopId === confirmTransferShop.id ? 'Transferring...' : 'Confirm Transfer & Activate'}
                </button>
              </div>
            </div>
          )}

          {/* List of Shops */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Shops Associated with Credentials ({currentUser?.email || activeTenant.contactEmail})
            </h3>

            <div className="space-y-2.5">
              {tenantShops.map(shop => {
                const isSub = isShopSubscribed(shop);
                const isCurrent = shop.id === activeTenant.id;

                return (
                  <div
                    key={shop.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isSub
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Store className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {shop.businessName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Current Active Workspace
                          </span>
                        )}
                        {isSub ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Subscribed • Read & Write
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Guest Mode (Read-Only)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {shop.branchAddress && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shop.branchAddress}
                          </span>
                        )}
                        <span>Plan: <strong>{shop.plan}</strong></span>
                        <span>Fee: <strong>${shop.monthlyFee}/mo</strong></span>
                        <span>Terminals: <strong>{shop.activeTerminalsCount || 0} / {shop.terminalQuota}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSwitchShop(shop);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                        >
                          <span>Switch Here</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {!isSub && (
                        <>
                          <button
                            onClick={() => setConfirmTransferShop(shop)}
                            disabled={processingShopId === shop.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition"
                            title="Transfer your 1 active subscription to this shop"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Activate (Transfer Slot)</span>
                          </button>
                          <button
                            onClick={() => handleAddSlot(shop)}
                            disabled={processingShopId === shop.id}
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-semibold transition"
                            title="Add a 2nd subscription slot so both shops are active"
                          >
                            <span>+Add Subscription Slot</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Navigation between shops requires no re-login. The same credentials roam all shops.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
