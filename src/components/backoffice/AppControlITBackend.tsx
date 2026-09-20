import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Globe, 
  Smartphone, 
  CreditCard, 
  Receipt, 
  Cpu, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  Terminal,
  Printer,
  Copy,
  Layers,
  Settings
} from 'lucide-react';
import { TenantContext, User as UserType, TenantApiKeyRecord, WebhookConfigRecord, PosDeviceRegistration } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { posAudio } from '../../services/hardware';

interface AppControlITBackendProps {
  tenant: TenantContext;
  currentUser: UserType | null;
}

export const AppControlITBackend: React.FC<AppControlITBackendProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'api_keys' | 'webhooks' | 'devices' | 'payment_types' | 'receipt_customizer'>('api_keys');
  const [apiKeys, setApiKeys] = useState<TenantApiKeyRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfigRecord[]>([]);
  const [devices, setDevices] = useState<PosDeviceRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New API Key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');

  // New Webhook modal
  const [showHookModal, setShowHookModal] = useState(false);
  const [hookUrl, setHookUrl] = useState('');
  const [hookEvents, setHookEvents] = useState('orders.created, refunds.processed, zreport.closed');

  // New Device modal
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceIp, setDeviceIp] = useState('192.168.1.55');
  const [devicePrinterType, setDevicePrinterType] = useState('Epson TM-T88VI (80mm)');

  // Receipt customization state
  const [receiptHeader, setReceiptHeader] = useState('Thank you for supporting local business!');
  const [receiptFooter, setReceiptFooter] = useState('Follow us on Instagram @yourshop\nWifi: GuestPass / Key: welcome2026');
  const [showBarcode, setShowBarcode] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kRes, wRes, dRes] = await Promise.all([
        backOfficeApi.getApiKeys(tenant.id, currentUser),
        backOfficeApi.getWebhooks(tenant.id, currentUser),
        backOfficeApi.getPosDevices(tenant.id, currentUser)
      ]);

      if (kRes.success) setApiKeys(kRes.apiKeys || []);
      if (wRes.success) setWebhooks(wRes.webhooks || []);
      if (dRes.success) setDevices(dRes.devices || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    try {
      const res = await backOfficeApi.createApiKey(tenant.id, {
        name: keyName,
        scopes: ['orders.read', 'products.read', 'catalog.sync']
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowKeyModal(false);
        setKeyName('');
        setStatusMessage('Secret API Key generated successfully.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hookUrl) return;
    const events = hookEvents.split(',').map(s => s.trim());
    try {
      const res = await backOfficeApi.createWebhook(tenant.id, {
        targetUrl: hookUrl,
        subscribedEvents: events
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowHookModal(false);
        setHookUrl('');
        setStatusMessage('Webhook registered for live payload dispatch.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName) return;
    try {
      const res = await backOfficeApi.registerPosDevice(tenant.id, {
        deviceName,
        ipAddress: deviceIp,
        printerModel: devicePrinterType,
        status: 'online'
      }, currentUser);

      if (res.success) {
        posAudio.playSuccessChime();
        setShowDeviceModal(false);
        setDeviceName('');
        setStatusMessage('Terminal hardware paired.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    posAudio.playButtonPress();
    setStatusMessage('Copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              IT Systems & App Backend
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Developer API, Hardware & Terminals</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">App Control, Developer APIs & POS Devices</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Issue secure API keys, wire outbound event webhooks, register POS terminal hardware, and design thermal print templates.
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
          {subTab === 'api_keys' && (
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Generate API Key</span>
            </button>
          )}
          {subTab === 'webhooks' && (
            <button
              onClick={() => setShowHookModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Add Webhook</span>
            </button>
          )}
          {subTab === 'devices' && (
            <button
              onClick={() => setShowDeviceModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Register Terminal</span>
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
          { id: 'api_keys', label: `API Keys (${apiKeys.length})`, icon: Key },
          { id: 'webhooks', label: `Webhooks (${webhooks.length})`, icon: Globe },
          { id: 'devices', label: `POS Devices & Terminals (${devices.length})`, icon: Smartphone },
          { id: 'payment_types', label: 'Payment Tenders & Gateways', icon: CreditCard },
          { id: 'receipt_customizer', label: 'Receipt Designer', icon: Receipt }
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

      {/* SUB-VIEW 1: API KEYS */}
      {subTab === 'api_keys' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Key Identifier</th>
                  <th className="pb-3 font-semibold">Scopes / Permissions</th>
                  <th className="pb-3 font-semibold">API Secret Prefix</th>
                  <th className="pb-3 font-semibold">Last Used</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {apiKeys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-sans font-bold text-white">{k.name}</td>
                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-amber-400">{(k as any).keyPrefix || (k as any).prefix || 'pk_live'}••••••••••••</td>
                    <td className="py-3 text-slate-400">{k.lastUsed || (k as any).lastUsedAt ? new Date(k.lastUsed || (k as any).lastUsedAt).toLocaleDateString() : 'Never'}</td>
                    <td className="py-3">
                      <span className="text-emerald-400 font-bold">{k.isActive !== false ? 'Active' : 'Revoked'}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => copyToClipboard(`${(k as any).keyPrefix || (k as any).prefix || 'pk_live'}_live_test_token_88ec`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Copy Key Token"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: WEBHOOKS */}
      {subTab === 'webhooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {webhooks.map(hook => (
            <div key={hook.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-cyan-400 break-all block">{hook.url || (hook as any).targetUrl}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">Secret: {hook.secret || (hook as any).signingSecret}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {(hook as any).status || (hook.isActive ? 'active' : 'paused')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                <span className="text-slate-400 text-[10px] font-mono uppercase block">Subscribed Topics</span>
                <div className="flex gap-1 flex-wrap pt-0.5">
                  {(hook.events || (hook as any).subscribedEvents || []).map((ev: string, idx: number) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 3: POS DEVICES */}
      {subTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map(dev => (
            <div key={dev.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">{dev.deviceName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Online
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-1 font-mono">
                <div className="flex justify-between">
                  <span>Terminal IP:</span>
                  <span className="text-slate-200">{dev.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span>ESC/POS Printer:</span>
                  <span className="text-indigo-300">{dev.printerModel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Ping:</span>
                  <span className="text-slate-500">{new Date(dev.lastPing).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: PAYMENT TYPES */}
      {subTab === 'payment_types' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Active Tender Rails & Integrated Payment Gateways</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Cash Register Drawer', desc: 'Physical currency with auto change math', active: true, fee: '0%' },
              { name: 'Integrated EMV Card', desc: 'Stripe Terminal / Square Reader / Verifone', active: true, fee: '2.6% + 10¢' },
              { name: 'Store Credit / Debtor Account', desc: 'Invoiced customer charge on credit ledger', active: true, fee: '0%' },
              { name: 'Direct QR / Crypto Wallet', desc: 'USDT / Solana / Lightning Network POS QR', active: true, fee: '0.1%' }
            ].map((tender, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tender.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Enabled</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{tender.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                  Transaction Cost: {tender.fee}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: RECEIPT DESIGNER */}
      {subTab === 'receipt_customizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" />
              <span>Thermal Receipt Layout Settings</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Header Welcome Note</label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={e => setReceiptHeader(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Footer Message & Social Media</label>
                <textarea
                  rows={3}
                  value={receiptFooter}
                  onChange={e => setReceiptFooter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="barcode-toggle"
                  checked={showBarcode}
                  onChange={e => setShowBarcode(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                <label htmlFor="barcode-toggle" className="text-slate-300">
                  Print Code-128 Scan Barcode for fast refund returns
                </label>
              </div>

              <button
                onClick={() => {
                  posAudio.playSuccessChime();
                  setStatusMessage('Thermal printer layout template saved.');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md mt-2"
              >
                Apply Receipt Template
              </button>
            </div>
          </div>

          {/* Thermal Receipt Visual Preview */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">
              ESC/POS 80mm Virtual Tape Simulation
            </span>
            <div className="w-72 bg-amber-50 text-slate-900 p-6 rounded-2xl shadow-xl font-mono text-[11px] leading-tight space-y-3 border border-amber-200">
              <div className="text-center space-y-1">
                <div className="text-sm font-black uppercase tracking-wider">{tenant.businessName}</div>
                <div className="text-[10px] text-slate-600">{tenant.subdomain}.shopcloud.io</div>
                <div className="text-[10px] italic pt-1">{receiptHeader}</div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>2x Cold Brew Coffee</span>
                  <span>$11.00</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Almond Croissant</span>
                  <span>$4.50</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2" />

              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>$15.50</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (8%):</span>
                  <span>$1.24</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>$16.74</span>
                </div>
              </div>

              {showBarcode && (
                <div className="text-center pt-2">
                  <div className="h-8 bg-slate-800 text-white flex items-center justify-center tracking-widest text-[9px]">
                    ||| | || |||| | ||| ||
                  </div>
                  <span className="text-[9px] text-slate-500">REC-2026-0913</span>
                </div>
              )}

              <div className="text-center text-[9px] text-slate-600 whitespace-pre-line pt-2 border-t border-dashed border-slate-300">
                {receiptFooter}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE API KEY */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Issue Backend API Key</span>
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Application / Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ERP Inventory Bridge, Mobile Ordering App"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/80 text-indigo-200 text-[11px] leading-relaxed">
                This key allows authenticated server-to-server operations scoped to tenant ID <strong className="text-white font-mono">{tenant.id}</strong>.
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Generate Key Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WEBHOOK */}
      {showHookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Register Outbound Webhook</span>
              </h3>
              <button onClick={() => setShowHookModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Endpoint URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/pos-events"
                  value={hookUrl}
                  onChange={e => setHookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subscribed Events (Comma-separated)</label>
                <input
                  type="text"
                  value={hookEvents}
                  onChange={e => setHookEvents(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHookModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER DEVICE */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Pair Hardware Terminal</span>
              </h3>
              <button onClick={() => setShowDeviceModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Device Name / Station *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Register 2"
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">LAN IP Address</label>
                  <input
                    type="text"
                    value={deviceIp}
                    onChange={e => setDeviceIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Printer Model</label>
                  <input
                    type="text"
                    value={devicePrinterType}
                    onChange={e => setDevicePrinterType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Pair Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
