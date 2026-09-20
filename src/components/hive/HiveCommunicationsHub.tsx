import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Bell,
  MessageSquare,
  Building2,
  Users,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  ExternalLink,
  Trash2,
  Filter,
  RefreshCw,
  Sparkles,
  Inbox,
  ShieldCheck,
  Radio,
  FileText,
  Phone,
  MessageCircle,
  Smartphone,
  Check,
  Clock,
  ArrowRight,
  CornerDownLeft,
  ChevronRight,
  Bot,
  UserCheck
} from 'lucide-react';
import {
  TenantContext,
  User,
  TenantCommunication,
  CommunicationChannel
} from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface HiveCommunicationsHubProps {
  tenants: TenantContext[];
  currentUser: User | null;
  onRefreshTenants?: () => Promise<void>;
  preselectedTenantId?: string | null;
}

export const HiveCommunicationsHub: React.FC<HiveCommunicationsHubProps> = ({
  tenants,
  currentUser,
  onRefreshTenants,
  preselectedTenantId
}) => {
  const [communications, setCommunications] = useState<TenantCommunication[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(preselectedTenantId || 'ALL_TENANTS');
  const [viewMode, setViewMode] = useState<'dispatch' | 'live_chat'>('dispatch');
  const [channel, setChannel] = useState<CommunicationChannel>('both');
  const [priority, setPriority] = useState<'normal' | 'important' | 'critical'>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Live Chat Reply state
  const [liveChatMessage, setLiveChatMessage] = useState('');
  const [isSendingLiveChat, setIsSendingLiveChat] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Load communications
  const loadCommunications = async () => {
    try {
      const comms = await dbService.getTenantCommunications();
      setCommunications(comms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to load communications:', err);
    }
  };

  useEffect(() => {
    loadCommunications();
    const handleCommEvent = () => loadCommunications();
    window.addEventListener('TENANT_COMMUNICATION_DISPATCHED', handleCommEvent);
    return () => window.removeEventListener('TENANT_COMMUNICATION_DISPATCHED', handleCommEvent);
  }, []);

  useEffect(() => {
    if (preselectedTenantId) {
      setSelectedTenantId(preselectedTenantId);
    }
  }, [preselectedTenantId]);

  // Find target tenant object
  const targetTenant = tenants.find(t => t.id === selectedTenantId || t.tenantId === selectedTenantId);
  const targetEmail = selectedTenantId === 'ALL_TENANTS'
    ? 'all-tenants-broadcast@hive.bluenilla.com'
    : targetTenant?.ownerEmail || targetTenant?.contactEmail || 'tenant.contact@bluenilla.com';
  const targetName = selectedTenantId === 'ALL_TENANTS'
    ? 'All Registered Business Tenants (Broadcast)'
    : targetTenant?.businessName || targetTenant?.tenantName || 'Tenant Business';
  const targetMobile = targetTenant?.mobileNumber || '';
  const targetWhatsApp = targetTenant?.whatsappNumber || targetMobile;
  const isWhatsAppActive = targetTenant?.isWhatsAppAvailable !== false && Boolean(targetWhatsApp);

  // Clean phone numbers for URL protocols
  const cleanPhone = (num: string) => num.replace(/[^0-9+]/g, '');

  // Templates
  const applyTemplate = (type: 'renewal' | 'maintenance' | 'terminal_quota' | 'welcome' | 'whatsapp_ping') => {
    if (type === 'renewal') {
      setSubject('Notice: Subscription Renewal & Scale Quota');
      setMessage(
        `Hello ${targetName},\n\nThis is an official notice from Hive Master regarding your store subscription. Please review your active till licenses and billing cycle in the Subscription Manager to prevent service disruption.\n\nBest regards,\nHive Master Host (${currentUser?.email || 'aqutewavedev@gmail.com'})`
      );
      setPriority('important');
      setChannel('both');
    } else if (type === 'maintenance') {
      setSubject('Scheduled Platform Synchronization & Maintenance');
      setMessage(
        `Dear ${targetName} Team,\n\nWe will be conducting platform cluster optimization this Sunday at 02:00 UTC. Your offline till terminals will continue processing sales uninterrupted.\n\nThank you for choosing BlueNilla Enterprise.`
      );
      setPriority('normal');
      setChannel('in_app');
    } else if (type === 'terminal_quota') {
      setSubject('Warning: Terminal Hardware Quota Approaching Limit');
      setMessage(
        `Attention Management at ${targetName},\n\nYour active register device count is near the custom allocation set for your shop (${targetTenant?.terminalQuota || 3} max terminals). Contact Hive Master or update your plan to authorize additional POS terminals.`
      );
      setPriority('critical');
      setChannel('both');
    } else if (type === 'welcome') {
      setSubject('Welcome to Enterprise POS Cloud Cluster');
      setMessage(
        `Hello and welcome to BlueNilla POS!\n\nYour store workspace and dedicated database cluster have been successfully provisioned. All terminal registers are ready to pair.\n\nFeel free to reach out directly through inside-app live chat, mobile SMS (${targetMobile || 'configured mobile'}), or email.`
      );
      setPriority('normal');
      setChannel('all');
    } else if (type === 'whatsapp_ping') {
      setSubject('Direct Operational Ping via WhatsApp');
      setMessage(
        `Hi ${targetName} Team! This is Hive Master checking in on your terminal deployment. Please let us know if you need assistance configuring your cash drawers or barcode scanners.`
      );
      setPriority('normal');
      setChannel('whatsapp');
    }
  };

  // Dispatch Communication from Main Form
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please provide both a subject and message body.');
      return;
    }

    setIsSending(true);
    posAudio.playButtonPress();

    try {
      await dbService.sendTenantCommunication({
        tenantId: selectedTenantId,
        tenantName: targetName,
        recipientEmail: targetEmail,
        recipientPhone: targetMobile,
        recipientWhatsApp: isWhatsAppActive ? targetWhatsApp : undefined,
        senderRole: 'hive_master',
        senderName: currentUser?.name || 'Hive Master Host',
        senderEmail: currentUser?.email || 'aqutewavedev@gmail.com',
        subject: subject.trim(),
        message: message.trim(),
        channel,
        priority,
        isLiveChat: channel === 'live_chat'
      });

      posAudio.playSuccessChime();
      setSuccessToast(
        channel === 'email'
          ? `Email dispatched to ${targetEmail}`
          : channel === 'sms'
          ? `SMS logged & prepared for ${targetMobile || targetName}`
          : channel === 'whatsapp'
          ? `WhatsApp message recorded for ${targetWhatsApp || targetName}`
          : channel === 'live_chat'
          ? `Inside-App live chat message transmitted to ${targetName}`
          : channel === 'in_app'
          ? `In-app notice dispatched to ${targetName}`
          : `Dispatched across multi-channels to ${targetName}`
      );

      // If WhatsApp channel, optionally open WhatsApp link
      if (channel === 'whatsapp' && targetWhatsApp) {
        handleOpenWhatsApp(targetWhatsApp, `${subject}: ${message}`);
      }

      // Reset form
      setSubject('');
      setMessage('');
      await loadCommunications();

      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Failed to send communication: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Dispatch inside-app live chat reply directly
  const handleSendLiveChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatMessage.trim()) return;
    if (selectedTenantId === 'ALL_TENANTS') {
      alert('Please select a specific tenant store to send a live chat message.');
      return;
    }

    setIsSendingLiveChat(true);
    posAudio.playButtonPress();

    try {
      await dbService.sendTenantCommunication({
        tenantId: selectedTenantId,
        tenantName: targetName,
        recipientEmail: targetEmail,
        recipientPhone: targetMobile,
        recipientWhatsApp: isWhatsAppActive ? targetWhatsApp : undefined,
        senderRole: 'hive_master',
        senderName: currentUser?.name || 'Hive Master Host',
        senderEmail: currentUser?.email || 'aqutewavedev@gmail.com',
        subject: 'Live Support Chat Message',
        message: liveChatMessage.trim(),
        channel: 'live_chat',
        priority: 'normal',
        isLiveChat: true
      });

      posAudio.playSuccessChime();
      setLiveChatMessage('');
      await loadCommunications();
    } catch (err: any) {
      alert('Failed to send live chat: ' + err.message);
    } finally {
      setIsSendingLiveChat(false);
    }
  };

  // Open direct Mailto client
  const handleOpenMailto = (toEmail: string, mailSubject: string, mailBody: string) => {
    const url = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    window.open(url, '_blank');
  };

  // Open direct WhatsApp Web / App chat
  const handleOpenWhatsApp = (whatsappNum: string, text: string) => {
    const cleaned = cleanPhone(whatsappNum);
    if (!cleaned) {
      alert('No valid WhatsApp number registered for this tenant.');
      return;
    }
    const url = `https://wa.me/${cleaned.replace('+', '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Open native SMS launcher
  const handleOpenSMS = (mobileNum: string, text: string) => {
    const cleaned = cleanPhone(mobileNum);
    if (!cleaned) {
      alert('No valid mobile number registered for this tenant.');
      return;
    }
    const url = `sms:${cleaned}?body=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy Email Payload
  const handleCopyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    posAudio.playScanBeep();
    setSuccessToast('Message payload copied to clipboard!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Delete communication record
  const handleDeleteComm = async (id: string) => {
    if (!confirm('Delete this communication record?')) return;
    await dbService.deleteTenantCommunication(id);
    await loadCommunications();
  };

  // Filtered communications
  const filteredComms = communications.filter(c => {
    if (filterTenant !== 'all' && c.tenantId !== filterTenant && c.tenantId !== 'ALL_TENANTS') return false;
    if (filterChannel !== 'all' && c.channel !== filterChannel && c.channel !== 'both' && c.channel !== 'all') return false;
    return true;
  });

  // Thread of messages for selected tenant in Live Chat Desk
  const liveChatThread = communications.filter(c => 
    selectedTenantId !== 'ALL_TENANTS' && (c.tenantId === selectedTenantId || c.tenantId === targetTenant?.tenantId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const inAppCount = communications.filter(c => c.channel === 'in_app' || c.channel === 'both' || c.channel === 'all').length;
  const emailCount = communications.filter(c => c.channel === 'email' || c.channel === 'both' || c.channel === 'all').length;
  const whatsAppCount = communications.filter(c => c.channel === 'whatsapp' || c.channel === 'all').length;
  const liveChatCount = communications.filter(c => c.channel === 'live_chat' || c.isLiveChat).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Tenant Communications & Live Chat Hub</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  DATABASE SYNC ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch messages via inside-app live chat, official credential email, mobile SMS, and WhatsApp with instant Firestore synchronization.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('dispatch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'dispatch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Composer & Logs</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('live_chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              viewMode === 'live_chat'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Inside-App Live Chat</span>
            {liveChatCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                {liveChatCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold">Total Logs</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{communications.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Cloud synchronized</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold">Live Chats</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{liveChatCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Inside-app instant messages</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold">WhatsApp / SMS</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{whatsAppCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Direct mobile channels</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold">Credential Emails</span>
            <Mail className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400">{emailCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Official account dispatches</div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* VIEW MODE 1: DISPATCH & OUTBOX LOGS */}
      {viewMode === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Message Composer (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Channel Dispatcher</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Firestore Persisted</span>
            </div>

            {/* Quick Templates Bar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase font-mono">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyTemplate('welcome')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Welcome Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('whatsapp_ping')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 font-medium transition"
                >
                  WhatsApp Ping
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('terminal_quota')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Quota Notice
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('renewal')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Renewal Alert
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('maintenance')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Maintenance
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3.5">
              {/* Target Tenant Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Select Recipient Tenant:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:border-indigo-500 outline-none"
                >
                  <option value="ALL_TENANTS">📢 Broadcast to All Registered Tenants</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.businessName} ({t.ownerEmail || t.contactEmail || t.mobileNumber || 'No contact specified'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolved Contact Details Card */}
              {selectedTenantId !== 'ALL_TENANTS' && targetTenant && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{targetTenant.businessName}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Limit: {targetTenant.terminalQuota || 3} Tills
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {/* Business Email */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="truncate mr-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Business Login Email</span>
                        <span className="font-mono text-slate-200 truncate">{targetEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMailto(targetEmail, subject || 'Message from Hive Master', message)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                        title="Open email client"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Essential Mobile */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="truncate mr-1">
                        <span className="text-[10px] text-amber-400 block font-mono font-bold">Essential Mobile</span>
                        <span className="font-mono text-slate-200 truncate">{targetMobile || 'Not provided'}</span>
                      </div>
                      {targetMobile && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSMS(targetMobile, message || subject)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                            title="Send SMS"
                          >
                            <Smartphone className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Status */}
                    <div className="sm:col-span-2 flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageCircle className={`w-3.5 h-3.5 ${isWhatsAppActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">WhatsApp Channel</span>
                          <span className="text-slate-200 font-mono">
                            {isWhatsAppActive ? targetWhatsApp : 'WhatsApp not enabled'}
                          </span>
                        </div>
                      </div>
                      {isWhatsAppActive && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(targetWhatsApp, `${subject}: ${message}`)}
                          className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex items-center gap-1 transition"
                          title="Open WhatsApp Chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp Web</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Channel Radio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Select Communication Channel:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('live_chat')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'live_chat'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'whatsapp'
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'sms'
                        ? 'bg-amber-600/30 border-amber-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mobile SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'email'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>Login Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('in_app')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'in_app'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>In-App Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('all')}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                      channel === 'all'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>All Channels</span>
                  </button>
                </div>
              </div>

              {/* Priority & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:border-indigo-500 outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="critical">Critical Alert</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scheduled Maintenance or Billing Alert"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Message Content:
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message to the tenant..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-indigo-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Transmitting...' : 'Dispatch Communication'}</span>
                </button>

                {/* Quick WhatsApp / Mail trigger */}
                {isWhatsAppActive && targetWhatsApp && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(targetWhatsApp, `${subject}: ${message}`)}
                    className="p-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
                    title="Launch directly in WhatsApp Web"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenMailto(targetEmail, subject || 'Message from Hive Master', message)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Launch in Desktop/Web Email Client (Mailto)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Communications History & Outbox (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
            {/* Outbox Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Dispatched Communications Log ({filteredComms.length})
                </h3>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <select
                  value={filterTenant}
                  onChange={(e) => setFilterTenant(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] outline-none"
                >
                  <option value="all">All Tenants</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.businessName}</option>
                  ))}
                </select>

                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] outline-none"
                >
                  <option value="all">All Channels</option>
                  <option value="live_chat">Live Chat</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">Mobile SMS</option>
                  <option value="email">Email</option>
                  <option value="in_app">In-App</option>
                  <option value="all">Unified All</option>
                </select>
              </div>
            </div>

            {/* Communications Stream */}
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1 flex-1">
              {filteredComms.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <p className="text-xs font-semibold">No communications logged yet</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Compose a message or live chat ping to reach your business tenants.
                  </p>
                </div>
              ) : (
                filteredComms.map(comm => {
                  const isBroadcast = comm.tenantId === 'ALL_TENANTS';

                  return (
                    <div
                      key={comm.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Channel Badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                            comm.channel === 'whatsapp'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : comm.channel === 'live_chat'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : comm.channel === 'sms'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : comm.channel === 'email'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : comm.channel === 'in_app'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {comm.channel === 'whatsapp' ? <MessageCircle className="w-3 h-3" /> :
                             comm.channel === 'live_chat' ? <MessageSquare className="w-3 h-3" /> :
                             comm.channel === 'sms' ? <Smartphone className="w-3 h-3" /> :
                             comm.channel === 'email' ? <Mail className="w-3 h-3" /> :
                             comm.channel === 'in_app' ? <Bell className="w-3 h-3" /> :
                             <Sparkles className="w-3 h-3" />}
                            <span className="uppercase">{comm.channel}</span>
                          </span>

                          {/* Priority Badge */}
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

                          <span className="text-xs font-bold text-white truncate max-w-64">
                            {comm.subject}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                          {new Date(comm.createdAt).toLocaleDateString()} {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Recipient & Credential Info */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-semibold text-slate-300">
                          {isBroadcast ? 'All Tenants (Broadcast)' : comm.tenantName}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{comm.recipientEmail}</span>
                        {comm.recipientPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-amber-400/90">{comm.recipientPhone}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Delivered</span>
                      </div>

                      {/* Message Preview */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-line">
                        {comm.message}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyPayload(`To: ${comm.recipientEmail}\nSubject: ${comm.subject}\n\n${comm.message}`)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>

                        {comm.recipientWhatsApp && (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(comm.recipientWhatsApp!, `${comm.subject}: ${comm.message}`)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 font-medium transition flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenMailto(comm.recipientEmail, comm.subject, comm.message)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Mail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteComm(comm.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete log record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INSIDE-APP LIVE CHAT DESK */}
      {viewMode === 'live_chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tenant Conversations Directory (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col max-h-[640px]">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tenant Stores</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">{tenants.length} Registered</span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {tenants.map(t => {
                const isSelected = selectedTenantId === t.id;
                const tenantComms = communications.filter(c => c.tenantId === t.id || c.tenantId === t.tenantId);
                const lastMsg = tenantComms[0];

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTenantId(t.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">
                        {t.businessName}
                      </span>
                      {t.isWhatsAppAvailable && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="WhatsApp Enabled" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">{t.ownerEmail || t.contactEmail || t.mobileNumber || 'No contact email'}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {tenantComms.length} msg{tenantComms.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {lastMsg && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 font-mono italic">
                        {lastMsg.senderRole === 'hive_master' ? 'You: ' : 'Tenant: '}{lastMsg.message}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Chat Conversation Thread (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[640px]">
            {selectedTenantId === 'ALL_TENANTS' ? (
              <div className="text-center py-24 text-slate-500 space-y-2">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-700" />
                <h4 className="text-sm font-bold text-white">Select a Tenant Store to Chat</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Choose a store from the left column to view their inside-app live chat thread, inspect credentials, and send real-time replies.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Topbar */}
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{targetName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                          Online Live Sync
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Credential: {targetEmail}</span>
                        {targetMobile && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono">Mobile: {targetMobile}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick external triggers */}
                  <div className="flex items-center gap-1.5">
                    {isWhatsAppActive && targetWhatsApp && (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(targetWhatsApp, 'Hello from Hive Master!')}
                        className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition flex items-center gap-1"
                        title="Open in WhatsApp Web"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

                    {targetMobile && (
                      <button
                        type="button"
                        onClick={() => handleOpenSMS(targetMobile, 'Message from Hive Master')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                        title="Open SMS"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">SMS</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenMailto(targetEmail, 'Operational message from Hive Master', '')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                      title="Open Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Email</span>
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="py-4 space-y-3 overflow-y-auto max-h-[460px] pr-2 flex-1">
                  {liveChatThread.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-xs font-semibold">No messages with this tenant yet</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Send a message below. It will appear live inside their POS Backoffice Help Desk!
                      </p>
                    </div>
                  ) : (
                    liveChatThread.map(item => {
                      const isFromHive = item.senderRole === 'hive_master';

                      return (
                        <div
                          key={item.id}
                          className={`flex items-start gap-2.5 ${isFromHive ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isFromHive && (
                            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/40">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl max-w-lg space-y-1 ${
                              isFromHive
                                ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-100 rounded-tr-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-white flex items-center gap-1">
                                {isFromHive ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                                    <span>Hive Master ({item.senderName})</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                    <span>{item.senderName || 'Store Manager'}</span>
                                  </>
                                )}
                              </span>
                              <span>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {item.subject && item.subject !== 'Live Support Chat Message' && (
                              <div className="text-xs font-bold text-slate-300 border-b border-slate-800/60 pb-1">
                                {item.subject}
                              </div>
                            )}

                            <div className="text-xs font-mono whitespace-pre-line leading-relaxed">
                              {item.message}
                            </div>
                          </div>

                          {isFromHive && (
                            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live Chat Composer Bar */}
                <form onSubmit={handleSendLiveChatReply} className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Reply to ${targetName} in live chat...`}
                    value={liveChatMessage}
                    onChange={(e) => setLiveChatMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSendingLiveChat}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingLiveChat ? 'Sending...' : 'Send'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
