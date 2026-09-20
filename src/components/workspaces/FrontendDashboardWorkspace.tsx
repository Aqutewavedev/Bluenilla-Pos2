import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Package,
  DollarSign,
  Users,
  BarChart3,
  Cpu,
  Store,
  Crown,
  Search,
  Zap,
  Tag,
  Receipt,
  RotateCcw,
  CreditCard,
  Barcode,
  Truck,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Sliders,
  Sparkles,
  Smartphone,
  KeyRound,
  Fingerprint,
  Database,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Layers,
  Inbox,
  Lock,
  Flame,
  LayoutGrid,
  Wallet,
  Banknote,
  Building2
} from 'lucide-react';
import {
  User,
  WorkspaceRole,
  TenantContext,
  TerminalDevice,
  Product,
  Transaction,
  isSystemHostUser,
  isBusinessOwnerUser
} from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';

interface FrontendDashboardWorkspaceProps {
  currentUser: User | null;
  currentTenant: TenantContext | null;
  availableTenants: TenantContext[];
  currentTerminal: TerminalDevice | null;
  isOffline: boolean;
  onNavigate: (role: WorkspaceRole) => void;
  onSwitchTenant: (tenant: TenantContext) => void;
  onOpenAuthModal: () => void;
  onOpenPairModal: () => void;
  onOpenDeviceManager: () => void;
  onOpenSubscriptionManager: () => void;
  onOpenCreateShop: () => void;
  onOpenBiometric: () => void;
  onOpenOAuth: () => void;
  onOpenFirebase: () => void;
  onTriggerSync: () => void;
  onToggleOfflineMode: () => void;
  onOpenNotifications: () => void;
}

type TabType = 'all' | 'pos' | 'inventory' | 'management' | 'system';

interface ShortcutItem {
  id: string;
  title: string;
  category: 'pos' | 'inventory' | 'management' | 'system';
  description: string;
  hotkey?: string;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: string;
  isPopular?: boolean;
  execute: () => void;
}

export function FrontendDashboardWorkspace({
  currentUser,
  currentTenant,
  availableTenants,
  currentTerminal,
  isOffline,
  onNavigate,
  onSwitchTenant,
  onOpenAuthModal,
  onOpenPairModal,
  onOpenDeviceManager,
  onOpenSubscriptionManager,
  onOpenCreateShop,
  onOpenBiometric,
  onOpenOAuth,
  onOpenFirebase,
  onTriggerSync,
  onToggleOfflineMode,
  onOpenNotifications
}: FrontendDashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real metrics from local + cloud db
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Quick Utility Modals
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [drawerKickFeedback, setDrawerKickFeedback] = useState(false);
  const [showHotkeysModal, setShowHotkeysModal] = useState(false);

  // Load essential summary metrics
  const loadEssentialMetrics = async () => {
    if (!currentUser) {
      // Roaming user without login: no existing business, so no database data displayed
      setProducts([]);
      setTransactions([]);
      setIsLoadingData(false);
      return;
    }

    try {
      const tenantId = currentTenant?.id || 'bluenilla_core';
      const [prodList, txList] = await Promise.all([
        dbService.getProducts(tenantId),
        dbService.getTransactions(tenantId)
      ]);
      setProducts(prodList || []);
      setTransactions(txList || []);
    } catch (err) {
      console.warn('Dashboard metrics load error:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadEssentialMetrics();
  }, [currentTenant?.id, currentUser]);

  // Derived key figures
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.timestamp && t.timestamp.startsWith(todayDateStr));
  }, [transactions, todayDateStr]);

  const todayGrossSales = useMemo(() => {
    return todayTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  }, [todayTransactions]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const summary = {
      cash: 0,
      cashCount: 0,
      card: 0,
      cardCount: 0,
      digital: 0,
      digitalCount: 0,
      other: 0,
      otherCount: 0,
      totalCount: todayTransactions.length,
      avgOrderValue: todayTransactions.length > 0 ? (todayGrossSales / todayTransactions.length) : 0
    };
    todayTransactions.forEach(t => {
      const amt = Number(t.total) || 0;
      const primaryPayment = Array.isArray(t.payments) && t.payments.length > 0 ? t.payments[0].type : '';
      const method = (primaryPayment || (t as any).paymentMethod || (t as any).paymentType || 'cash').toLowerCase();
      if (method.includes('cash')) {
        summary.cash += amt;
        summary.cashCount += 1;
      } else if (method.includes('card') || method.includes('credit') || method.includes('debit')) {
        summary.card += amt;
        summary.cardCount += 1;
      } else if (method.includes('digital') || method.includes('qr') || method.includes('mobile') || method.includes('wallet') || method.includes('nfc')) {
        summary.digital += amt;
        summary.digitalCount += 1;
      } else {
        summary.other += amt;
        summary.otherCount += 1;
      }
    });
    return summary;
  }, [todayTransactions, todayGrossSales]);

  // Recent Settled Orders (Last 5 transactions)
  const recentSettledOrders = useMemo(() => {
    return [...todayTransactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [todayTransactions]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= (p.reorderPoint ?? 5));
  }, [products]);

  // Quick Action: Instant Cash Drawer Kick
  const handleKickDrawer = () => {
    posAudio.playDrawerKick();
    setDrawerKickFeedback(true);
    setTimeout(() => setDrawerKickFeedback(false), 2400);

    // Record audit entry
    dbService.logAudit({
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Operator',
      workspace: 'sales',
      action: 'Quick Drawer Kick Triggered',
      details: `Cash drawer kicked from Dashboard Hub at terminal ${currentTerminal?.id || 'REG-01'}`,
      severity: 'info'
    }).catch(() => {});
  };

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (e.key === 'Escape') {
          target.blur();
          setShowPriceCheckModal(false);
          setShowHotkeysModal(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        setShowPriceCheckModal(false);
        setShowHotkeysModal(false);
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHotkeysModal(prev => !prev);
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('sales');
      } else if (e.key === 'F2') {
        e.preventDefault();
        posAudio.playButtonPress();
        setShowPriceCheckModal(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('storeroom');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleKickDrawer();
      } else if (e.key === 'F5') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('manager');
      } else if (e.key === 'F7') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('back_office');
      } else if (e.key === 'F8') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('sales');
      } else if (e.key === 'F9') {
        e.preventDefault();
        posAudio.playButtonPress();
        onNavigate('it');
      } else if (e.key === 'F12') {
        e.preventDefault();
        posAudio.playButtonPress();
        onTriggerSync();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onTriggerSync]);

  // Master List of Shortcuts
  const shortcuts: ShortcutItem[] = useMemo(() => [
    // POS & Floor Operations
    {
      id: 'sc-pos',
      title: 'Sales POS Terminal',
      category: 'pos',
      description: 'Open active cash register for barcode scanning, cart & instant payment.',
      hotkey: 'F1',
      icon: ShoppingBag,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'Primary',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('sales');
      }
    },
    {
      id: 'sc-price-check',
      title: 'Quick Price & Stock Check',
      category: 'pos',
      description: 'Instant lookup for product price, tax rate, and real-time shelf stock.',
      hotkey: 'F2',
      icon: Tag,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        setShowPriceCheckModal(true);
      }
    },
    {
      id: 'sc-drawer-kick',
      title: 'Kick Cash Drawer',
      category: 'pos',
      description: 'Trigger hardware solenoid impulse to open register cash till.',
      hotkey: 'F4',
      icon: Zap,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      isPopular: true,
      execute: handleKickDrawer
    },
    {
      id: 'sc-barcode-scan',
      title: 'Barcode Quick Scanner',
      category: 'pos',
      description: 'Activate camera or hardware barcode reader for item check-in.',
      hotkey: 'F8',
      icon: Barcode,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
      iconColor: 'text-sky-600 dark:text-sky-400',
      execute: () => {
        posAudio.playScanBeep();
        onNavigate('sales');
      }
    },
    {
      id: 'sc-customer-debtors',
      title: 'Customers & Debtors Ledger',
      category: 'pos',
      description: 'Review credit accounts, outstanding customer invoices & store balance.',
      icon: CreditCard,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('back_office');
      }
    },
    {
      id: 'sc-returns-refunds',
      title: 'Returns & Refunds Center',
      category: 'pos',
      description: 'Process receipted customer returns, restocking & cash/card reversals.',
      icon: RotateCcw,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      iconColor: 'text-rose-600 dark:text-rose-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('back_office');
      }
    },

    // Stock & Storeroom
    {
      id: 'sc-storeroom-po',
      title: 'Storeroom & PO Receiving',
      category: 'inventory',
      description: 'Check in incoming supplier shipments, POs, and stock quantities.',
      hotkey: 'F3',
      icon: Package,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('storeroom');
      }
    },
    {
      id: 'sc-stock-adjust',
      title: 'Stock Adjustment & Audit',
      category: 'inventory',
      description: 'Perform cycle counts, write-offs, shrinkage or surplus adjustments.',
      icon: Sliders,
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
      iconColor: 'text-teal-600 dark:text-teal-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('storeroom');
      }
    },
    {
      id: 'sc-low-stock',
      title: 'Low Stock Alerts',
      category: 'inventory',
      description: `View ${lowStockItems.length} items currently at or below minimum threshold.`,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length} Low` : undefined,
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-600 dark:text-orange-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('storeroom');
      }
    },
    {
      id: 'sc-catalog-management',
      title: 'Catalog & Categories',
      category: 'inventory',
      description: 'Manage shop products, SKUs, barcode mappings, and modifier groups.',
      icon: Layers,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('back_office');
      }
    },
    {
      id: 'sc-suppliers',
      title: 'Vendors & Suppliers',
      category: 'inventory',
      description: 'Access supplier phone contacts, payment terms, and vendor orders.',
      icon: Truck,
      iconBg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('storeroom');
      }
    },

    // Management & Finance
    {
      id: 'sc-manager-analytics',
      title: 'Manager Analytics',
      category: 'management',
      description: 'Hourly sales velocity, category breakdown, top cashier performance.',
      hotkey: 'F5',
      icon: BarChart3,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('manager');
      }
    },
    {
      id: 'sc-daily-z',
      title: 'Daily Z-Report & Close',
      category: 'management',
      description: 'Generate fiscal end-of-day register closure, tax totals & tender summary.',
      hotkey: 'F7',
      icon: Receipt,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('back_office');
      }
    },
    {
      id: 'sc-tenant-shops-manager',
      title: 'Tenant Shops (Create, Manage, Delete)',
      category: 'management',
      description: 'Create new branches, configure shop settings, put on hold, or permanently delete shops.',
      icon: Building2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: `${availableTenants?.length || 1} Branches`,
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        if (onOpenCreateShop) {
          onOpenCreateShop();
        } else {
          onNavigate('back_office');
        }
      }
    },
    {
      id: 'sc-shop-backoffice',
      title: 'Shop Back Office Hub',
      category: 'management',
      description: 'Tenant operational rules, receipt headers, surcharges, staff commissions.',
      icon: Store,
      iconBg: 'bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800',
      iconColor: 'text-violet-600 dark:text-violet-400',
      badge: 'Admin',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('back_office');
      }
    },
    {
      id: 'sc-financials',
      title: 'Accounts & General Ledger',
      category: 'management',
      description: 'Profit & Loss, Invoices AR, Vendor Bills AP, and journal entries.',
      icon: DollarSign,
      iconBg: 'bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('accounts');
      }
    },
    {
      id: 'sc-hr-roster',
      title: 'HR Workforce & Shifts',
      category: 'management',
      description: 'Staff clock-in records, active shifts, timecards, and payroll export.',
      icon: Users,
      iconBg: 'bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800',
      iconColor: 'text-pink-600 dark:text-pink-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('hr');
      }
    },
    {
      id: 'sc-hive-master',
      title: 'Hive Master Platform',
      category: 'management',
      description: 'Multi-shop tenant control plane, hosting plans, and platform billing.',
      icon: Crown,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'Host',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('hive_master');
      }
    },

    // System, Terminals & Sync
    {
      id: 'sc-cloud-sync',
      title: 'Immediate Cloud Sync',
      category: 'system',
      description: 'Push offline queue and synchronize IndexedDB cache with Cloud Firestore.',
      hotkey: 'F12',
      icon: RefreshCw,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
      iconColor: 'text-sky-600 dark:text-sky-400',
      isPopular: true,
      execute: () => {
        posAudio.playButtonPress();
        onTriggerSync();
      }
    },
    {
      id: 'sc-it-security',
      title: 'I.T. Diagnostic & Security',
      category: 'system',
      description: 'Network latency, hardware peripheral check, audit trail & webhooks.',
      hotkey: 'F9',
      icon: Cpu,
      iconBg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400',
      execute: () => {
        posAudio.playButtonPress();
        onNavigate('it');
      }
    },
    {
      id: 'sc-pair-terminal',
      title: 'Pair New POS Device',
      category: 'system',
      description: 'Generate 6-digit cryptographic pairing code to bind register hardware.',
      icon: Smartphone,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      execute: () => {
        posAudio.playButtonPress();
        onOpenPairModal();
      }
    },
    {
      id: 'sc-device-fleet',
      title: 'Terminal Fleet Manager',
      category: 'system',
      description: 'View linked registers, revoke rogue devices, and assign staff modules.',
      icon: Settings,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
      execute: () => {
        posAudio.playButtonPress();
        onOpenDeviceManager();
      }
    },
    {
      id: 'sc-offline-mode',
      title: isOffline ? 'Switch to Online Mode' : 'Toggle Remote Offline Mode',
      category: 'system',
      description: isOffline ? 'Reconnect terminal to cloud master stream.' : 'Simulate remote field disconnection (100% offline cache).',
      icon: isOffline ? Wifi : WifiOff,
      iconBg: isOffline ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      iconColor: isOffline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
      execute: () => {
        posAudio.playButtonPress();
        onToggleOfflineMode();
      }
    },
    {
      id: 'sc-firebase-cloud',
      title: 'Firebase Cloud DB Health',
      category: 'system',
      description: 'Inspect live collections, auth tokens, and security rules status.',
      icon: Database,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      execute: () => {
        posAudio.playButtonPress();
        onOpenFirebase();
      }
    },
    {
      id: 'sc-biometric-auth',
      title: 'Biometric Scanner Auth',
      category: 'system',
      description: 'Verify operator identity using WebAuthn fingerprint sensor.',
      icon: Fingerprint,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      execute: () => {
        posAudio.playButtonPress();
        onOpenBiometric();
      }
    }
  ], [
    isOffline,
    lowStockItems.length,
    currentTerminal?.id,
    currentUser?.id,
    currentUser?.name,
    onNavigate,
    onOpenPairModal,
    onOpenDeviceManager,
    onToggleOfflineMode,
    onOpenFirebase,
    onOpenBiometric,
    onTriggerSync
  ]);

  // Filtered Shortcuts based on Tab and Search
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter(s => {
      // Tab filter
      if (activeTab !== 'all' && s.category !== activeTab) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.hotkey && s.hotkey.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [shortcuts, activeTab, searchQuery]);

  // Price Checker results
  const priceCheckResults = useMemo(() => {
    if (!priceSearchQuery.trim()) return [];
    const q = priceSearchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [products, priceSearchQuery]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100/70 dark:bg-slate-950 p-3 sm:p-5 lg:p-6 pb-36 sm:pb-24 transition-colors overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* =========================================================================
            1. TOP HERO: SHOP CONTEXT & LIVE OPERATIONAL STATUS (LIMITED, ESSENTIAL)
            ========================================================================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Shop & Terminal Identity */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentTenant?.tenantName || 'Bluenilla Flagship Store'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                    {currentTenant?.plan || 'Enterprise'} Plan
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Terminal: {currentTerminal?.id || 'REG-01'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span>Branch: {currentTenant?.branchAddress || currentTenant?.businessName || 'Main Counter'}</span>
                  <span>•</span>
                  <span>Cloud DB: <strong className="text-emerald-600 dark:text-emerald-400 font-medium">Synced</strong></span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </p>
              </div>
            </div>

            {/* Operator Session & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {currentUser ? (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 object-cover"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-mono">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={onOpenAuthModal}
                    className="ml-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Switch
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Survey Mode (Guest) • Sign In</span>
                </button>
              )}

              {/* Instant Hotkeys Cheat Sheet Trigger */}
              <button
                onClick={() => setShowHotkeysModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title="View Keyboard Shortcut Keys (?)"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Shortcuts</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500">?</kbd>
              </button>
            </div>

          </div>
        </div>

        {/* =========================================================================
            2. ESSENTIAL METRIC BAR (4 CRISP, PURPOSEFUL TILES - LIMITED INFO)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Metric 1: Today's POS Sales */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today&apos;s Gross Sales</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${todayGrossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>{todayTransactions.length} orders settled</span>
                <button
                  onClick={() => onNavigate('sales')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  POS <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Metric 2: Active Inventory Status */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inventory Status</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {products.length}
                </span>
                <span className="text-xs text-slate-500">SKUs in catalog</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                {lowStockItems.length > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {lowStockItems.length} low stock alerts
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">All stock healthy</span>
                )}
                <button
                  onClick={() => onNavigate('storeroom')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  Audit <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Metric 3: Register & Cash Drawer Status */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash Register & Till</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {currentTerminal?.name || 'Main Counter Register'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px]">
                <span className="text-slate-500 font-mono">Status: Ready</span>
                <button
                  onClick={handleKickDrawer}
                  disabled={drawerKickFeedback}
                  className={`font-bold px-2 py-0.5 rounded text-[10px] transition ${
                    drawerKickFeedback 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' 
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                  }`}
                >
                  {drawerKickFeedback ? 'Drawer Kicked!' : 'Kick Drawer (F4)'}
                </button>
              </div>
            </div>
          </div>

          {/* Metric 4: Fleet & Cloud Health */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fleet & Connectivity</span>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                isOffline
                  ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                  : 'bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
              }`}>
                {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {isOffline ? 'Remote Offline' : 'Cloud Online'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  v3.4
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                <span>IndexedDB Cache Ready</span>
                <button
                  onClick={onTriggerSync}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  Sync (F12)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            2.5 EXTENDED LIVE OPERATIONS: PAYMENT BREAKDOWN, ORDERS STREAM & DATA ISOLATION
            ========================================================================= */}
        <div className="space-y-4">
          
          {/* Row 1: Live Payment Tender Breakdown Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Cash Tenders */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>Cash Tenders</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                  {paymentBreakdown.totalCount > 0 ? Math.round((paymentBreakdown.cash / (todayGrossSales || 1)) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ${paymentBreakdown.cash.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {paymentBreakdown.cashCount} {paymentBreakdown.cashCount === 1 ? 'sale' : 'sales'}
                </span>
              </div>
            </div>

            {/* Card & Chip/Pin */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>Card / EMV</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  {paymentBreakdown.totalCount > 0 ? Math.round((paymentBreakdown.card / (todayGrossSales || 1)) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ${paymentBreakdown.card.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {paymentBreakdown.cardCount} {paymentBreakdown.cardCount === 1 ? 'sale' : 'sales'}
                </span>
              </div>
            </div>

            {/* Digital / QR / Mobile */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-sky-500" />
                  <span>Digital / QR</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
                  {paymentBreakdown.totalCount > 0 ? Math.round((paymentBreakdown.digital / (todayGrossSales || 1)) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ${paymentBreakdown.digital.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {paymentBreakdown.digitalCount} {paymentBreakdown.digitalCount === 1 ? 'sale' : 'sales'}
                </span>
              </div>
            </div>

            {/* Average Ticket Value */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Avg Ticket Size</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                  Basket
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ${paymentBreakdown.avgOrderValue.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {paymentBreakdown.totalCount} orders total
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Recent Settled Orders Feed + Critical Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Col (2 spans): Recent Settled Transactions */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Settled Transactions ({todayTransactions.length})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('sales')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open POS Register (F1)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {recentSettledOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold">No sales transactions settled yet today.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Use Sales Register (F1) to begin ringing up customer orders.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSettledOrders.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          TX
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                              #{tx.id.replace('tx-', '').slice(0, 10)}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {(tx.payments?.[0]?.type || (tx as any).paymentMethod || 'Cash').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {tx.items?.length || 1} items • Cashier: {tx.cashierName || 'Operator'} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 dark:text-white text-sm block">
                          ${Number(tx.total).toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Settled</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col (1 span): Critical Inventory & Account Partition Status */}
            <div className="space-y-4">
              {/* Critical Low Stock Watchlist */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Inventory Watchlist
                    </h3>
                  </div>
                  <button
                    onClick={() => onNavigate('storeroom')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Storeroom (F3)
                  </button>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-80" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">All inventory levels healthy</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No stock below replenishment point.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 3).map((prod) => (
                      <div
                        key={prod.id}
                        className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            SKU: {prod.sku} • Min: {prod.reorderPoint ?? 5}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-rose-600 dark:text-rose-400 text-xs px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
                            {prod.stock} left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strict Account & Database Push Isolation Indicator */}
              <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 p-4 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h4 className="font-bold text-indigo-950 dark:text-indigo-200">
                      Isolated Database Partition
                    </h4>
                    <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                      All POS data pushes write strictly to shop partition <strong className="font-mono">{currentTenant?.id || 'bluenilla_core'}</strong>. Cross-tenant access is strictly blocked by security rules.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                        User: {currentUser?.email || 'Survey Operator'}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Private
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* =========================================================================
            3. TABS & SEARCH BAR (ORGANIZED SHORTCUTS NAVIGATION)
            ========================================================================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Shortcuts ({shortcuts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                <span>POS & Floor</span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>Stock & Storeroom</span>
              </button>

              <button
                onClick={() => setActiveTab('management')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'management'
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
                <span>Management & Admin</span>
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'system'
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                <span>System & Terminals</span>
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter shortcuts (e.g. Z-report, F1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* =========================================================================
              4. GRIDS OF SHORTCUTS (INTERACTIVE TILES WITH HOTKEYS)
              ========================================================================= */}
          <div className="pt-4">
            {filteredShortcuts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No shortcuts matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Clear search and reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredShortcuts.map((shortcut) => {
                  const Icon = shortcut.icon;
                  return (
                    <button
                      key={shortcut.id}
                      onClick={shortcut.execute}
                      className="group p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Row: Icon + Hotkey Badge */}
                      <div className="flex items-start justify-between w-full">
                        <div className={`w-10 h-10 rounded-xl ${shortcut.iconBg} border flex items-center justify-center ${shortcut.iconColor} group-hover:scale-105 transition-transform shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          {shortcut.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              {shortcut.badge}
                            </span>
                          )}
                          {shortcut.hotkey && (
                            <kbd className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 shadow-2xs group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/80 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition">
                              {shortcut.hotkey}
                            </kbd>
                          )}
                        </div>
                      </div>

                      {/* Content: Title & Essential Description */}
                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                          <span>{shortcut.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-500" />
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {shortcut.description}
                        </p>
                      </div>

                      {/* Bottom Visual Accent Line on hover */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* =========================================================================
            5. QUICK SHOP SWITCHER FOOTNOTE (FOR MULTI-STORE OPERATORS)
            ========================================================================= */}
        {availableTenants.length > 1 && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Store className="w-4 h-4 text-indigo-500" />
              <span>Multi-Store Context: Currently connected to <strong className="text-slate-800 dark:text-slate-200">{currentTenant?.tenantName}</strong>.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Switch Shop:</span>
              <select
                value={currentTenant?.id || ''}
                onChange={(e) => {
                  const selected = availableTenants.find(t => t.id === e.target.value);
                  if (selected) onSwitchTenant(selected);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {availableTenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tenantName} ({t.plan})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL 1: INSTANT PRICE & STOCK CHECKER (TRIGGERED VIA F2 OR SHORTCUT)
          ========================================================================= */}
      {showPriceCheckModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instant Price & Stock Checker
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Press F2 anytime or Esc to close</span>
                </div>
              </div>
              <button
                onClick={() => setShowPriceCheckModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan barcode or type SKU / product name..."
                  value={priceSearchQuery}
                  onChange={(e) => setPriceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Results List */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {priceCheckResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  {priceSearchQuery.trim() ? (
                    <p className="text-xs">No product matching &quot;{priceSearchQuery}&quot;</p>
                  ) : (
                    <p className="text-xs">Type a keyword or scan a barcode to view instant pricing.</p>
                  )}
                </div>
              ) : (
                priceCheckResults.map(prod => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {prod.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <span>BC: {prod.barcode}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        ${Number(prod.price).toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        prod.stock <= (prod.reorderPoint ?? 5)
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {prod.stock} in stock
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{products.length} products available locally</span>
              <button
                onClick={() => {
                  setShowPriceCheckModal(false);
                  onNavigate('sales');
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Go to Sales POS <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: KEYBOARD SHORTCUTS CHEAT SHEET (TRIGGERED VIA ?)
          ========================================================================= */}
      {showHotkeysModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Keyboard Shortcuts & Hotkey Reference
                </h3>
              </div>
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Open Sales POS Register</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F1</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Instant Price & Stock Checker</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F2</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Storeroom & PO Receiving</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F3</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Hardware Cash Drawer Kick</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F4</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Manager Analytics Dashboard</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F5</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Daily Z-Report & Sales Ledger</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F7</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Barcode Quick Scanner</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F8</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">I.T. Network & Security Diagnostic</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F9</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Immediate Cloud & Local Sync</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">F12</kbd>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Close Open Modal / Dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold">Esc</kbd>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                Got it
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
