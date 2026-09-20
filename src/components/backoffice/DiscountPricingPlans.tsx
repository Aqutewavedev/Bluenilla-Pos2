import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Layers, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  Tag,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react';
import { TenantContext, User as UserType, DiscountPlanItem, PricingTierPlan, ScheduledPriceChange } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface DiscountPricingPlansProps {
  tenant: TenantContext;
  currentUser: UserType | null;
}

export const DiscountPricingPlans: React.FC<DiscountPricingPlansProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'discounts' | 'pricing_tiers' | 'price_changes'>('discounts');
  const [discounts, setDiscounts] = useState<DiscountPlanItem[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingTierPlan[]>([]);
  const [priceChanges, setPriceChanges] = useState<ScheduledPriceChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Discount Modal
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [discName, setDiscName] = useState('');
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState<'percentage' | 'fixed_amount' | 'bogo' | 'basket_threshold'>('percentage');
  const [discValue, setDiscValue] = useState('10');
  const [discMinBasket, setDiscMinBasket] = useState('');

  // Schedule Price Change Modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [changeProduct, setChangeProduct] = useState('Artisan Espresso Beans 1kg');
  const [changeCurrent, setChangeCurrent] = useState('24.50');
  const [changeNew, setChangeNew] = useState('26.00');
  const [changeDate, setChangeDate] = useState('2026-10-01');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dRes, pRes, cRes] = await Promise.all([
        backOfficeApi.getDiscounts(tenant.id, currentUser),
        backOfficeApi.getPricingPlans(tenant.id, currentUser),
        backOfficeApi.getPriceChanges(tenant.id, currentUser)
      ]);

      if (dRes.success) setDiscounts(dRes.discounts || []);
      if (pRes.success) setPricingPlans(pRes.plans || []);
      if (cRes.success) setPriceChanges(cRes.changes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discName || !discValue) return;
    try {
      const res = await backOfficeApi.createDiscount(tenant.id, {
        name: discName,
        code: discCode || discName.replace(/\s+/g, '').slice(0, 8).toUpperCase(),
        type: discType,
        value: Number(discValue),
        minBasketTotal: discMinBasket ? Number(discMinBasket) : undefined,
        isActive: true
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowDiscModal(false);
        setDiscName('');
        setDiscCode('');
        setStatusMessage('Discount promotion plan saved.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    await backOfficeApi.deleteDiscount(tenant.id, id, currentUser);
    loadData();
  };

  const handleSchedulePriceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeProduct || !changeNew) return;
    try {
      const res = await backOfficeApi.schedulePriceChange(tenant.id, {
        productId: 'prod_custom',
        productName: changeProduct,
        currentPrice: Number(changeCurrent),
        newPrice: Number(changeNew),
        effectiveDate: new Date(changeDate).toISOString()
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowPriceModal(false);
        setStatusMessage('Price change queued in automated schedule.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              Discounts & Pricing Engine
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">BOGO, Tiers & Price Schedules</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Promotional Discounts, Pricing Plans & Future Changes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure promotional rules, customer pricing plans (Retail vs VIP vs Wholesale), and schedule future shelf price changes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Reload</span>
          </button>
          {subTab === 'discounts' && (
            <button
              onClick={() => setShowDiscModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Discount</span>
            </button>
          )}
          {subTab === 'price_changes' && (
            <button
              onClick={() => setShowPriceModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Price Change</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'discounts', label: `Discount Plans (${discounts.length})`, icon: Percent },
          { id: 'pricing_tiers', label: `Pricing Plans (${pricingPlans.length})`, icon: Layers },
          { id: 'price_changes', label: `Scheduled Price Changes (${priceChanges.length})`, icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id as any);
                posAudio.playButtonPress();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: DISCOUNTS */}
      {subTab === 'discounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map(disc => (
            <div key={disc.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{disc.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 block">
                      Type: {disc.type}
                    </span>
                  </div>
                  {disc.code && (
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-amber-400 border border-slate-700">
                      {disc.code}
                    </span>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Discount Benefit:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {disc.type === 'percentage' ? `${disc.value}% OFF` :
                     disc.type === 'fixed_amount' ? `$${disc.value.toFixed(2)} OFF` :
                     disc.type === 'basket_threshold' ? `Save $${disc.value.toFixed(2)} on $${disc.minBasketTotal}+` :
                     'Buy X Get Y'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-mono">● Active in Till</span>
                <button
                  onClick={() => handleDeleteDiscount(disc.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title="Remove Discount"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 2: PRICING PLANS */}
      {subTab === 'pricing_tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingPlans.map(plan => (
            <div key={plan.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                {plan.isDefault && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                    Default Shelf
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer Group:</span>
                  <span className="font-mono uppercase text-slate-200">{plan.tierCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Multiplier:</span>
                  <span className="font-mono font-bold text-indigo-400">{plan.priceMultiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Example ($100 Item):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${(100 * plan.priceMultiplier).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 3: SCHEDULED PRICE CHANGES */}
      {subTab === 'price_changes' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Product SKU</th>
                  <th className="pb-3 font-semibold">Current Shelf Price</th>
                  <th className="pb-3 font-semibold">Scheduled New Price</th>
                  <th className="pb-3 font-semibold">Price Delta</th>
                  <th className="pb-3 font-semibold">Effective Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Scheduled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {priceChanges.map(change => {
                  const delta = +(change.newPrice - change.currentPrice).toFixed(2);
                  return (
                    <tr key={change.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-white">{change.productName}</td>
                      <td className="py-3 font-mono text-slate-400">${change.currentPrice.toFixed(2)}</td>
                      <td className="py-3 font-mono font-bold text-white">${change.newPrice.toFixed(2)}</td>
                      <td className="py-3 font-mono">
                        <span className={`font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {delta >= 0 ? `+$${delta.toFixed(2)}` : `-$${Math.abs(delta).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-indigo-300">
                        {new Date(change.effectiveDate).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {change.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{change.scheduledBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD DISCOUNT */}
      {showDiscModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Create Discount Promotion</span>
              </h3>
              <button onClick={() => setShowDiscModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Promotion Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Cooler 20% Off"
                  value={discName}
                  onChange={e => setDiscName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SUMMER20"
                    value={discCode}
                    onChange={e => setDiscCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={discType}
                    onChange={e => setDiscType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ($)</option>
                    <option value="basket_threshold">Spend Threshold</option>
                    <option value="bogo">BOGO Buy/Get</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Value ({discType === 'percentage' ? '%' : '$'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={discValue}
                    onChange={e => setDiscValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Basket ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={discMinBasket}
                    onChange={e => setDiscMinBasket(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE PRICE CHANGE */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Schedule Shelf Price Change</span>
              </h3>
              <button onClick={() => setShowPriceModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSchedulePriceChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={changeProduct}
                  onChange={e => setChangeProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={changeCurrent}
                    onChange={e => setChangeCurrent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Effective Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={changeNew}
                    onChange={e => setChangeNew(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={changeDate}
                  onChange={e => setChangeDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Schedule Price Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
