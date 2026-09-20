import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Layers, 
  Sliders, 
  Scale, 
  Barcode, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { 
  TenantContext, 
  User as UserType, 
  Product, 
  ProductCategoryItem, 
  ProductModifierGroup, 
  UnitOfMeasurement, 
  ProductClassificationCode 
} from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface CatalogManagementProps {
  tenant: TenantContext | null;
  currentUser: UserType | null;
}

export const CatalogManagement: React.FC<CatalogManagementProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'products' | 'categories' | 'modifiers' | 'uom' | 'codes'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [modifiers, setModifiers] = useState<ProductModifierGroup[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasurement[]>([]);
  const [codes, setCodes] = useState<ProductClassificationCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryColor, setCategoryColor] = useState('#6366f1');
  const [categoryTax, setCategoryTax] = useState('8.0');

  // Modifier modal
  const [showModModal, setShowModModal] = useState(false);
  const [modName, setModName] = useState('');
  const [modMin, setModMin] = useState('0');
  const [modMax, setModMax] = useState('1');
  const [modOptionsText, setModOptionsText] = useState('Small (+0.00), Medium (+1.00), Large (+2.00)');

  // UOM modal
  const [showUomModal, setShowUomModal] = useState(false);
  const [uomName, setUomName] = useState('');
  const [uomSymbol, setUomSymbol] = useState('');
  const [uomFractional, setUomFractional] = useState(false);

  const loadData = async () => {
    if (!tenant) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [pList, catRes, modRes, uomRes, codeRes] = await Promise.all([
        dbService.getProducts(tenant.id),
        backOfficeApi.getCategories(tenant.id, currentUser),
        backOfficeApi.getModifiers(tenant.id, currentUser),
        backOfficeApi.getUOM(tenant.id, currentUser),
        backOfficeApi.getClassificationCodes(tenant.id, currentUser)
      ]);

      setProducts(pList);
      if (catRes.success) setCategories(catRes.categories || []);
      if (modRes.success) setModifiers(modRes.modifiers || []);
      if (uomRes.success) setUoms(uomRes.uom || []);
      if (codeRes.success) setCodes(codeRes.codes || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenant) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [tenant?.id, currentUser?.id]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;
    try {
      const res = await backOfficeApi.createCategory(tenant.id, {
        name: categoryName,
        code: categoryCode || categoryName.slice(0, 3).toUpperCase(),
        colorCode: categoryColor,
        taxRatePercent: Number(categoryTax)
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowCategoryModal(false);
        setCategoryName('');
        setCategoryCode('');
        setStatusMessage('Category added to catalog.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await backOfficeApi.deleteCategory(tenant.id, id, currentUser);
    loadData();
  };

  const handleCreateModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName) return;

    // Parse options from comma list
    const options = modOptionsText.split(',').map((item, idx) => {
      const parts = item.trim().split('(');
      const name = parts[0].trim();
      let priceDelta = 0;
      if (parts[1]) {
        priceDelta = parseFloat(parts[1].replace(/[^0-9.-]/g, '')) || 0;
      }
      return {
        id: `opt-${Date.now()}-${idx}`,
        name,
        priceDelta,
        isDefault: idx === 0
      };
    });

    try {
      const res = await backOfficeApi.createModifier(tenant.id, {
        name: modName,
        minSelect: Number(modMin),
        maxSelect: Number(modMax),
        options
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowModModal(false);
        setModName('');
        setStatusMessage('Modifier group added.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateUOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uomName || !uomSymbol) return;
    try {
      const res = await backOfficeApi.createUOM(tenant.id, {
        name: uomName,
        symbol: uomSymbol,
        isFractional: uomFractional,
        ratioToBase: 1
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowUomModal(false);
        setUomName('');
        setUomSymbol('');
        setStatusMessage('Unit of measure created.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.barcode && p.barcode.includes(searchTerm)) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              Catalog & Inventory
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Stock Tracking & Classification</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Products, Modifiers, Categories & UOM</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure menu modifiers, multi-tier categories, inventory stock levels, units of measurement, and HS commodity classification codes.
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
          {subTab === 'categories' && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
          {subTab === 'modifiers' && (
            <button
              onClick={() => setShowModModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Modifier Group</span>
            </button>
          )}
          {subTab === 'uom' && (
            <button
              onClick={() => setShowUomModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Unit (UOM)</span>
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
          { id: 'products', label: `Product List & Stock (${products.length})`, icon: Package },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'modifiers', label: `Modifiers & Options (${modifiers.length})`, icon: Sliders },
          { id: 'uom', label: `Units of Measurement (${uoms.length})`, icon: Scale },
          { id: 'codes', label: `Classification Codes (${codes.length})`, icon: Barcode }
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

      {/* SUB-VIEW 1: PRODUCTS & STOCK TRACKING */}
      {subTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, SKU, barcode, or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">Product</th>
                    <th className="pb-3 font-semibold">SKU / Barcode</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Cost</th>
                    <th className="pb-3 font-semibold">Margin</th>
                    <th className="pb-3 font-semibold">In Stock</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map(p => {
                    const costVal = (p as any).costPrice ?? (p as any).cost;
                    const margin = p.price && costVal ? (((p.price - costVal) / p.price) * 100).toFixed(1) : null;
                    const isLowStock = (p.stock || 0) <= ((p as any).reorderPoint ?? (p as any).minStockThreshold ?? 5);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-white block">{p.name}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">{p.description || 'Standard catalog SKU'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-300">
                          <div>{p.sku || 'N/A'}</div>
                          {p.barcode && <div className="text-[10px] text-slate-500">{p.barcode}</div>}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-400">${p.price?.toFixed(2)}</td>
                        <td className="py-3 font-mono text-slate-400">${costVal ? Number(costVal).toFixed(2) : '—'}</td>
                        <td className="py-3 font-mono text-indigo-400">{margin ? `${margin}%` : '—'}</td>
                        <td className="py-3 font-mono">
                          <span className={`font-bold ${isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                            {p.stock ?? 0}
                          </span>
                        </td>
                        <td className="py-3">
                          {isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold w-fit block">
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs italic">
                        No products match your search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CATEGORIES */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.colorCode }} />
                      <span className="font-bold text-white text-xs">{cat.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.code}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Default Tax Rate:</span>
                      <strong className="text-slate-200 font-mono">{cat.taxRatePercent}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Products Linked:</span>
                      <strong className="text-slate-200 font-mono">{cat.itemCount || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-slate-500 hover:text-rose-400 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MODIFIERS */}
      {subTab === 'modifiers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modifiers.map(mod => (
              <div key={mod.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>{mod.name}</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Select {mod.minSelect} to {mod.maxSelect}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {mod.options.map(opt => (
                    <div key={opt.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{opt.name}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {opt.priceDelta > 0 ? `+$${opt.priceDelta.toFixed(2)}` : 'Included'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: UNITS OF MEASUREMENT */}
      {subTab === 'uom' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Standard Units of Sale & Inventory Conversions</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {uoms.map(uom => (
                <div key={uom.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{uom.name}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-800">
                      {uom.symbol}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    Fractional Quantity Allowed: {uom.isFractional ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: CLASSIFICATION CODES */}
      {subTab === 'codes' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Barcode className="w-4 h-4 text-emerald-400" />
              <span>Harmonized Commodity Codes (HS & UNSPSC Tax Classifications)</span>
            </h4>

            <div className="divide-y divide-slate-800/80">
              {codes.map(code => (
                <div key={code.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-400 block">{code.code}</span>
                    <span className="text-slate-300 text-xs mt-0.5 block">{code.description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    {code.standard}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Juices & Smoothies"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. JUC"
                    value={categoryCode}
                    onChange={e => setCategoryCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={categoryTax}
                    onChange={e => setCategoryTax(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Color Tag</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={e => setCategoryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={categoryColor}
                    onChange={e => setCategoryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MODIFIER */}
      {showModModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Modifier Group</h3>
              <button onClick={() => setShowModModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateModifier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ice Level, Syrup Flavors"
                  value={modName}
                  onChange={e => setModName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Selection</label>
                  <input
                    type="number"
                    min="0"
                    value={modMin}
                    onChange={e => setModMin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Selection</label>
                  <input
                    type="number"
                    min="1"
                    value={modMax}
                    onChange={e => setModMax(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Options with Prices (Comma separated)</label>
                <textarea
                  rows={3}
                  value={modOptionsText}
                  onChange={e => setModOptionsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                  placeholder="Vanilla (+0.75), Caramel (+0.75), Hazelnut (+0.75)"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save Modifier Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD UOM */}
      {showUomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Unit of Measurement (UOM)</h3>
              <button onClick={() => setShowUomModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateUOM} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gram, Pound, Bottle"
                  value={uomName}
                  onChange={e => setUomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Symbol *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. g, lb, btl"
                  value={uomSymbol}
                  onChange={e => setUomSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="fract"
                  checked={uomFractional}
                  onChange={e => setUomFractional(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                <label htmlFor="fract" className="text-slate-300">
                  Allows fractional sale (e.g. 1.25 kg on weighing scale)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUomModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Save UOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
