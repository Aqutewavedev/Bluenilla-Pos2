import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  BookOpen, 
  Send, 
  CheckCircle2, 
  Search, 
  LifeBuoy, 
  ExternalLink,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Mail,
  Bell,
  Radio,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { TenantContext, User as UserType, HelpCenterArticle, LiveSupportTicket, TenantCommunication } from '../../types';
import { backOfficeApi } from '../../services/apiClient';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface HelpDeskSupportProps {
  tenant: TenantContext;
  currentUser: UserType | null;
}

export const HelpDeskSupport: React.FC<HelpDeskSupportProps> = ({ tenant, currentUser }) => {
  const [subTab, setSubTab] = useState<'help_center' | 'live_chat' | 'hive_messages'>('help_center');
  const [articles, setArticles] = useState<HelpCenterArticle[]>([]);
  const [tickets, setTickets] = useState<LiveSupportTicket[]>([]);
  const [communications, setCommunications] = useState<TenantCommunication[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpCenterArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Tenant-to-Hive Message state
  const [tenantSubject, setTenantSubject] = useState('');
  const [tenantMessage, setTenantMessage] = useState('');
  const [isSendingToHive, setIsSendingToHive] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hRes, tRes, comms] = await Promise.all([
        backOfficeApi.getHelpArticles(tenant.id, currentUser),
        backOfficeApi.getSupportTickets(tenant.id, currentUser),
        dbService.getTenantCommunications(tenant.id)
      ]);

      if (hRes.success) setArticles(hRes.articles || []);
      if (tRes.success) setTickets(tRes.tickets || []);
      setCommunications(comms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleCommEvent = () => loadData();
    window.addEventListener('TENANT_COMMUNICATION_DISPATCHED', handleCommEvent);
    return () => window.removeEventListener('TENANT_COMMUNICATION_DISPATCHED', handleCommEvent);
  }, [tenant.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const msgText = chatMessage.trim();

      // Create support ticket
      const res = await backOfficeApi.createSupportTicket(tenant.id, {
        subject: 'Merchant Live Inquiry',
        description: msgText,
        priority: 'medium'
      }, currentUser);

      // Also record direct live chat communication to Hive Master
      await dbService.sendTenantCommunication({
        tenantId: tenant.id,
        tenantName: tenant.businessName,
        recipientEmail: 'aqutewavedev@gmail.com',
        senderRole: 'tenant',
        senderName: currentUser?.name || 'Store Manager',
        senderEmail: currentUser?.email || tenant.contactEmail || tenant.ownerEmail || 'merchant@bluenilla.com',
        subject: 'Live Inquiry from ' + tenant.businessName,
        message: msgText,
        channel: 'live_chat',
        priority: 'normal',
        isLiveChat: true
      });

      if (res.success) {
        posAudio.playSuccessChime();
        setChatMessage('');
        setStatusMessage('Live message dispatched to Hive Master support desk.');
        loadData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendToHive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantSubject.trim() || !tenantMessage.trim()) {
      alert('Please enter both subject and message for Hive Master.');
      return;
    }

    setIsSendingToHive(true);
    try {
      await dbService.sendTenantCommunication({
        tenantId: tenant.id,
        tenantName: tenant.businessName,
        recipientEmail: 'aqutewavedev@gmail.com',
        senderRole: 'tenant',
        senderName: currentUser?.name || tenant.businessName,
        senderEmail: currentUser?.email || tenant.contactEmail || 'merchant@bluenilla.com',
        subject: tenantSubject.trim(),
        message: tenantMessage.trim(),
        channel: 'both',
        priority: 'important'
      });

      posAudio.playSuccessChime();
      setStatusMessage('Direct communication transmitted to Hive Master host.');
      setTenantSubject('');
      setTenantMessage('');
      await loadData();
    } catch (err: any) {
      alert('Failed to transmit message: ' + err.message);
    } finally {
      setIsSendingToHive(false);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
              24/7 Merchant Support
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Knowledge Base & Live Operator Desk</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">Help Centre, Community Guides & Live Chat</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Access merchant troubleshooting guides, setup documentation for thermal hardware, and connect directly with support operators.
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
          { id: 'help_center', label: `Help Centre Guides (${articles.length})`, icon: BookOpen },
          { id: 'live_chat', label: `Support Desk & Active Tickets (${tickets.length})`, icon: MessageSquare },
          { id: 'hive_messages', label: `Hive Master Direct & Email Notices (${communications.length})`, icon: Mail }
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

      {/* SUB-VIEW 1: HELP CENTER */}
      {subTab === 'help_center' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search help articles (e.g. thermal printer, refunds, Z-report balancing, debtor credit)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map(art => (
              <div 
                key={art.id} 
                onClick={() => setSelectedArticle(art)}
                className="p-5 rounded-3xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      {art.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Guide</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2 group-hover:text-amber-400 transition">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {art.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span>Read Article</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* ARTICLE READER MODAL */}
          {selectedArticle && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      {selectedArticle.category}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{selectedArticle.title}</h3>
                  </div>
                  <button onClick={() => setSelectedArticle(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line py-2 max-h-96 overflow-y-auto font-sans">
                  {selectedArticle.content}
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                  >
                    Close Guide
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: LIVE CHAT & TICKETS */}
      {subTab === 'live_chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Tickets List */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Merchant Tickets</span>
            </h3>

            <div className="space-y-2">
              {tickets.map(tick => (
                <div key={tick.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{tick.subject}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                      tick.status === 'open' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {tick.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{(tick as any).description || tick.messages?.[0]?.text || 'Merchant inquiry'}</p>
                  <div className="text-[10px] font-mono text-slate-500 pt-1">
                    {new Date(tick.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-xs text-slate-500 italic py-4 text-center">No tickets submitted yet.</p>
              )}
            </div>
          </div>

          {/* Interactive Live Chat Desk */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Live Support Operator</h3>
                    <span className="text-[10px] text-slate-400">Average response time: &lt; 2 minutes</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  Ticket Desk Active
                </span>
              </div>

              {/* Chat Thread */}
              <div className="py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 max-w-md">
                    Welcome to the tenant support desk! How can our specialists assist your shop operations today?
                  </div>
                </div>

                {/* Real-time Inside-App Live Chat Messages */}
                {communications
                  .filter(c => c.isLiveChat || c.channel === 'live_chat')
                  .slice(0, 10)
                  .reverse()
                  .map(comm => {
                    const isFromHive = comm.senderRole === 'hive_master';
                    return (
                      <div
                        key={comm.id}
                        className={`flex items-start gap-2.5 ${isFromHive ? 'justify-start' : 'justify-end'}`}
                      >
                        {isFromHive && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/40">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-md ${
                            isFromHive
                              ? 'bg-slate-950 border border-slate-800 text-slate-200'
                              : 'bg-indigo-950/80 border border-indigo-800 text-indigo-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono mb-1">
                            <span className="font-bold text-white">
                              {isFromHive ? 'Hive Master' : comm.senderName || 'You'}
                            </span>
                            <span>
                              {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="whitespace-pre-line font-mono">{comm.message}</div>
                        </div>
                        {!isFromHive && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/40">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                {tickets.slice(0, 2).map(tick => (
                  <div key={tick.id} className="flex items-start justify-end gap-2.5">
                    <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-xs text-indigo-100 max-w-md">
                      {(tick as any).description || tick.messages?.[0]?.text || tick.subject}
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/40">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type your question or support request here..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-2xl text-xs text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: HIVE MASTER COMMUNICATIONS & ACCOUNT EMAILS */}
      {subTab === 'hive_messages' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Account Credential Destination Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold block">
                  Registered Account Credential Email
                </span>
                <span className="font-bold text-white text-sm">
                  {tenant.ownerEmail || tenant.contactEmail || currentUser?.email || 'accounts@bluenilla.com'}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The Hive Master transmits official operational notices, quota alerts, and subscription invoices to this credential address.
                </p>
              </div>
            </div>

            <a
              href={`mailto:aqutewavedev@gmail.com?subject=Merchant Inquiry from ${encodeURIComponent(tenant.businessName)}`}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold text-xs border border-indigo-800/80 transition flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Email Host Directly</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Message Log Stream (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-400" />
                  <span>Inbox & Communication Log ({communications.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
              </div>

              {communications.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p className="text-xs font-semibold">No communications from Hive Master yet</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Notices and email dispatches will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {communications.map(comm => (
                    <div
                      key={comm.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                            comm.channel === 'both'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : comm.channel === 'in_app'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {comm.channel === 'both' ? <Sparkles className="w-3 h-3" /> : comm.channel === 'in_app' ? <Bell className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                            <span className="uppercase">{comm.channel}</span>
                          </span>

                          {comm.priority === 'critical' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                              CRITICAL
                            </span>
                          )}
                          {comm.priority === 'important' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                              IMPORTANT
                            </span>
                          )}

                          <span className="text-xs font-bold text-white">
                            {comm.subject}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>From: <strong className="text-slate-300">{comm.senderName}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">{comm.senderEmail}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                        {comm.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Compose Message to Hive Master (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Send className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Direct Line to Hive Master
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Send an authenticated message directly into the Hive Master operations dashboard or trigger an escalation.
              </p>

              <form onSubmit={handleSendToHive} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Requesting Terminal Quota Extension"
                    value={tenantSubject}
                    onChange={(e) => setTenantSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry, request, or hardware issue..."
                    value={tenantMessage}
                    onChange={(e) => setTenantMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-amber-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Recipient:</span>
                  <span className="font-mono font-bold text-amber-400">aqutewavedev@gmail.com</span>
                </div>

                <button
                  type="submit"
                  disabled={isSendingToHive}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingToHive ? 'Transmitting...' : 'Send Message to Hive'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
