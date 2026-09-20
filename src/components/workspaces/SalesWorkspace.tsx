import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  Trash2, 
  CreditCard, 
  Tag, 
  Coins, 
  FolderOpen, 
  History, 
  Printer, 
  Check, 
  X, 
  Search, 
  Banknote, 
  Smartphone, 
  Plus, 
  Minus,
  ShoppingBag,
  Grid,
  Calculator,
  ArrowRight,
  Layers,
  Sparkles,
  Receipt,
  Lock
} from 'lucide-react';
import { Product, CartItem, Transaction, ParkedOrder, User, PaymentRecord, PaymentType, TenantContext, isShopGuestMode, isSubmoduleEnabled } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { ReceiptModal } from '../pos/ReceiptModal';
import { GuestModeNoticeModal } from '../common/GuestModeNoticeModal';

interface SalesWorkspaceProps {
  currentUser: User | null;
  isOffline: boolean;
  onStockChanged?: () => void;
  currentTenant?: TenantContext | null;
  availableTenants?: TenantContext[];
  onOpenSubscriptionManager?: () => void;
  onSwitchTenant?: (tenant: TenantContext) => void;
}

export const SalesWorkspace: React.FC<SalesWorkspaceProps> = ({
  currentUser,
  isOffline,
  onStockChanged,
  currentTenant,
  availableTenants = [],
  onOpenSubscriptionManager,
  onSwitchTenant
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showGuestNotice, setShowGuestNotice] = useState(false);
  const [guestNoticeAction, setGuestNoticeAction] = useState('Tender Sale');

  const isGuestMode = isShopGuestMode(currentTenant);

  // Hive submodule gating
  const canQuickCash = isSubmoduleEnabled(currentTenant, 'sales', 'quickCashButtons');
  const canDiscounts = isSubmoduleEnabled(currentTenant, 'sales', 'cashierDiscounts');
  const canSplitPayments = isSubmoduleEnabled(currentTenant, 'sales', 'splitPayments');
  const canParkedOrders = isSubmoduleEnabled(currentTenant, 'sales', 'parkedOrders');
  const canAutoKickDrawer = isSubmoduleEnabled(currentTenant, 'sales', 'autoKickCashDrawer');

  // Mobile / compact view tab selector: 'ticket' | 'items' | 'keypad'
  const [mobileTab, setMobileTab] = useState<'ticket' | 'items' | 'keypad'>('items');

  // Punch & Keypad state
  const [punchInput, setPunchInput] = useState<string>('');
  const [qtyMultiplier, setQtyMultiplier] = useState<number>(1);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [punchMode, setPunchMode] = useState<'item' | 'qty' | 'discount'>('item');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Tendering
  const [tenderMethod, setTenderMethod] = useState<PaymentType>('cash');
  const [tenderAmountInput, setTenderAmountInput] = useState<string>('');
  const [lastChangeGiven, setLastChangeGiven] = useState<number | null>(null);

  // Modals & Drawers
  const [showParkedDrawer, setShowParkedDrawer] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [drawerOpenVisual, setDrawerOpenVisual] = useState(false);
  const [tillStatusMessage, setTillStatusMessage] = useState<string>('Till Point Ready');

  const punchInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = async () => {
    if (!currentUser) {
      // Roaming user not logged in: non-existing business, do not display database data
      setProducts([]);
      setParkedOrders([]);
      setRecentTransactions([]);
      return;
    }

    try {
      const prods = await dbService.getProducts();
      setProducts(prods);
      const parked = await dbService.getParkedOrders();
      setParkedOrders(parked);
      const txs = await dbService.getTransactions();
      setRecentTransactions(txs.slice(-15).reverse());
    } catch (err) {
      console.warn('Failed to load products for Sales POS:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Keyboard shortcut listener for F12 (Tender & Print) and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) {
          handleCompleteSaleAndPrint();
        }
      } else if (e.key === 'Escape') {
        setPunchInput('');
        setQtyMultiplier(1);
        setPunchMode('item');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, tenderAmountInput, tenderMethod]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = !searchFilter || 
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.barcode.includes(searchFilter);
    return matchesCat && matchesSearch;
  });

  // Financial Calculations
  const subtotal = cart.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
  const totalAfterDiscount = cart.reduce((sum, it) => sum + it.total, 0);
  const discountTotal = subtotal - totalAfterDiscount;
  const taxTotal = cart.reduce((sum, it) => sum + (it.total * (it.product.taxRate || 0.08)), 0);
  const grandTotal = totalAfterDiscount + taxTotal;
  const totalItemsCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  // Punch an item
  const punchProduct = (product: Product, customQty?: number) => {
    const qty = customQty || qtyMultiplier;
    posAudio.playScanBeep();

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: newQty * updated[existingIdx].unitPrice * (1 - updated[existingIdx].discountPercent / 100)
        };
        setSelectedCartIndex(existingIdx);
        return updated;
      } else {
        const newItem: CartItem = {
          product,
          quantity: qty,
          unitPrice: product.price,
          discountPercent: 0,
          total: qty * product.price
        };
        const updated = [...prev, newItem];
        setSelectedCartIndex(updated.length - 1);
        return updated;
      }
    });

    setTillStatusMessage(`Added: ${qty}x ${product.name} ($${(qty * product.price).toFixed(2)})`);
    setQtyMultiplier(1);
    setPunchInput('');
    setPunchMode('item');
    if (punchInputRef.current) punchInputRef.current.focus();
  };

  // Submit typed SKU, Barcode, PLU, or Keyword
  const handlePunchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = punchInput.trim();
    if (!query) return;

    if (punchMode === 'qty') {
      const parsedQty = parseFloat(query);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        if (selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
          setCart(prev => prev.map((item, idx) => {
            if (idx === selectedCartIndex) {
              return {
                ...item,
                quantity: parsedQty,
                total: parsedQty * item.unitPrice * (1 - item.discountPercent / 100)
              };
            }
            return item;
          }));
          setTillStatusMessage(`Quantity updated to ${parsedQty}`);
        } else {
          setQtyMultiplier(parsedQty);
          setTillStatusMessage(`Multiplier set to ${parsedQty}x for next punch`);
        }
      }
      setPunchInput('');
      setPunchMode('item');
      return;
    }

    if (punchMode === 'discount') {
      if (!canDiscounts) {
        posAudio.playErrorTone();
        setTillStatusMessage('Cashier Discounts module is gated by Hive plan.');
        setPunchInput('');
        setPunchMode('item');
        return;
      }
      const parsedDisc = parseFloat(query);
      if (!isNaN(parsedDisc) && parsedDisc >= 0 && parsedDisc <= 100) {
        if (selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
          setCart(prev => prev.map((item, idx) => {
            if (idx === selectedCartIndex) {
              return {
                ...item,
                discountPercent: parsedDisc,
                total: item.quantity * item.unitPrice * (1 - parsedDisc / 100)
              };
            }
            return item;
          }));
          setTillStatusMessage(`Discount of ${parsedDisc}% applied to line item`);
        }
      }
      setPunchInput('');
      setPunchMode('item');
      return;
    }

    // Lookup product
    const matched = products.find(p => 
      p.barcode.toLowerCase() === query.toLowerCase() ||
      p.sku.toLowerCase() === query.toLowerCase() ||
      p.id.toLowerCase() === query.toLowerCase()
    );

    if (matched) {
      punchProduct(matched);
    } else {
      const partial = products.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
      if (partial) {
        punchProduct(partial);
      } else {
        posAudio.playErrorTone();
        setTillStatusMessage(`Item code "${query}" not found`);
      }
    }
  };

  // Handle Numpad keypress
  const handleNumpadKey = (val: string) => {
    if (val === 'C') {
      setPunchInput('');
      setQtyMultiplier(1);
      setPunchMode('item');
    } else if (val === 'BS') {
      setPunchInput(prev => prev.slice(0, -1));
    } else if (val === 'QTY') {
      if (punchInput) {
        const q = parseFloat(punchInput);
        if (!isNaN(q) && q > 0) {
          if (selectedCartIndex >= 0 && selectedCartIndex < cart.length) {
            setCart(prev => prev.map((item, idx) => {
              if (idx === selectedCartIndex) {
                return {
                  ...item,
                  quantity: q,
                  total: q * item.unitPrice * (1 - item.discountPercent / 100)
                };
              }
              return item;
            }));
            setTillStatusMessage(`Line quantity adjusted to ${q}`);
            setPunchInput('');
          } else {
            setQtyMultiplier(q);
            setTillStatusMessage(`Multiplier: ${q}x for next item`);
            setPunchInput('');
          }
        }
      } else {
        setPunchMode('qty');
      }
    } else if (val === 'DISC') {
      if (!canDiscounts) {
        posAudio.playErrorTone();
        setTillStatusMessage('Cashier Discounts feature is locked by Hive.');
        return;
      }
      if (punchInput && selectedCartIndex >= 0) {
        const d = parseFloat(punchInput);
        if (!isNaN(d) && d >= 0 && d <= 100) {
          setCart(prev => prev.map((item, idx) => {
            if (idx === selectedCartIndex) {
              return {
                ...item,
                discountPercent: d,
                total: item.quantity * item.unitPrice * (1 - d / 100)
              };
            }
            return item;
          }));
          setTillStatusMessage(`Discount ${d}% applied to selected line`);
          setPunchInput('');
        }
      } else {
        setPunchMode('discount');
      }
    } else if (val === 'ENTER') {
      handlePunchSubmit();
    } else {
      setPunchInput(prev => prev + val);
    }
  };

  // Adjust item quantity on ticket
  const adjustLineQty = (index: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQ = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQ,
          total: newQ * item.unitPrice * (1 - item.discountPercent / 100)
        };
      }
      return item;
    }));
  };

  // Void selected line
  const handleVoidSelectedLine = (index: number) => {
    posAudio.playErrorTone();
    const removed = cart[index];
    setCart(prev => prev.filter((_, idx) => idx !== index));
    setTillStatusMessage(`Voided: ${removed.product.name}`);
    setSelectedCartIndex(-1);
  };

  // Void whole ticket
  const handleVoidTicket = () => {
    if (cart.length === 0) return;
    if (confirm('Void and clear all items on current ticket?')) {
      posAudio.playErrorTone();
      setCart([]);
      setSelectedCartIndex(-1);
      setTillStatusMessage('Ticket voided — Till cleared');
    }
  };

  // Park Order / Hold Ticket
  const handleParkSale = async () => {
    if (isGuestMode) {
      posAudio.playErrorTone();
      setGuestNoticeAction('Park / Hold Order');
      setShowGuestNotice(true);
      return;
    }
    if (!currentUser) {
      posAudio.playErrorTone();
      alert('Survey Mode: Parking orders to the persistent database is disabled for unauthenticated guests. Sign in with subscription to park and hold active orders.');
      return;
    }
    if (cart.length === 0) return;
    const orderTitle = prompt('Enter customer name or table/tag number for held ticket:', `Ticket #${Math.floor(100 + Math.random() * 900)}`);
    if (!orderTitle) return;

    const newParked: ParkedOrder = {
      id: `park-${Date.now()}`,
      title: orderTitle,
      cart,
      parkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cashierName: currentUser.name
    };
    await dbService.saveParkedOrder(newParked);
    setCart([]);
    setSelectedCartIndex(-1);
    setTillStatusMessage(`Ticket parked: ${orderTitle}`);
    await loadData();
  };

  const handleResumeParkedOrder = async (order: ParkedOrder) => {
    if (isGuestMode) {
      posAudio.playErrorTone();
      setGuestNoticeAction('Recall Parked Order');
      setShowGuestNotice(true);
      return;
    }
    setCart(order.cart);
    await dbService.removeParkedOrder(order.id);
    setShowParkedDrawer(false);
    setTillStatusMessage(`Recalled ticket: ${order.title}`);
    setMobileTab('ticket');
    await loadData();
  };

  // Cash drawer solenoid kick
  const triggerCashDrawer = () => {
    if (!canAutoKickDrawer) {
      posAudio.playErrorTone();
      setTillStatusMessage('Cash drawer hardware trigger gated by Hive.');
      return;
    }
    posAudio.playDrawerKick();
    setDrawerOpenVisual(true);
    setTimeout(() => setDrawerOpenVisual(false), 2000);
    setTillStatusMessage('Cash drawer opened (No Sale)');
  };

  // Fast Complete Sale & Print Receipt
  const handleCompleteSaleAndPrint = async (directMethod?: PaymentType, customTendered?: number) => {
    if (cart.length === 0) {
      posAudio.playErrorTone();
      setTillStatusMessage('Cannot tender empty ticket');
      return;
    }

    if (isGuestMode) {
      posAudio.playErrorTone();
      setGuestNoticeAction('Tender Sale & Complete Checkout');
      setShowGuestNotice(true);
      return;
    }

    if (!currentUser) {
      posAudio.playErrorTone();
      alert('Survey Mode: Checkout simulation only. Live sales, transactions, and receipts cannot be written to the database. Sign in with subscription to tender real transactions.');
      return;
    }

    const method = directMethod || tenderMethod;
    const finalTendered = customTendered !== undefined 
      ? customTendered 
      : (parseFloat(tenderAmountInput) || grandTotal);

    if (method === 'cash' && finalTendered < grandTotal) {
      posAudio.playErrorTone();
      alert(`Tendered amount ($${finalTendered.toFixed(2)}) is less than total due ($${grandTotal.toFixed(2)})`);
      return;
    }

    const changeDue = Math.max(0, finalTendered - grandTotal);
    setLastChangeGiven(changeDue);

    posAudio.playScanBeep();
    if (method === 'cash') {
      posAudio.playDrawerKick();
    }

    const payments: PaymentRecord[] = [
      {
        type: method,
        amount: grandTotal,
        reference: method === 'cash' ? `CASH-TENDER-$${finalTendered.toFixed(2)}` : `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }
    ];

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: `BN-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      items: cart,
      subtotal,
      discountTotal,
      taxTotal,
      total: grandTotal,
      payments,
      tenderedAmount: finalTendered,
      changeGiven: changeDue,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      branchId: currentUser.branchId,
      status: 'completed',
      offlineSynced: !isOffline,
      syncTimestamp: !isOffline ? new Date().toISOString() : undefined
    };

    // Save to IndexedDB
    await dbService.saveTransaction(transaction, isOffline);

    // Update stock levels
    for (const item of cart) {
      await dbService.adjustStock(
        item.product.id,
        -item.quantity,
        'received',
        `Sale #${transaction.receiptNumber}`,
        currentUser.name,
        isOffline
      );
    }

    // Open receipt modal for thermal printing
    setActiveReceiptTx(transaction);
    setCart([]);
    setSelectedCartIndex(-1);
    setTenderAmountInput('');
    setTillStatusMessage(`Sale #${transaction.receiptNumber} completed • Change: $${changeDue.toFixed(2)}`);

    await loadData();
    if (onStockChanged) onStockChanged();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      
      {/* 1. PROFESSIONAL TELLER CONTROL HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-2xs">
        {/* Till & Operator Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              TILL #01
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
              Lane 3
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block" />
          
          <div className="text-xs text-slate-600 dark:text-slate-400 hidden xs:flex items-center gap-1.5">
            <span>Operator:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{currentUser?.name || 'Survey Guest (Demo)'}</span>
          </div>
        </div>

        {/* Live Status Readout */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate max-w-xs">{tillStatusMessage}</span>
        </div>

        {/* Quick Functional Utility Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition"
            title="Scan with Camera Lens"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan (F2)</span>
          </button>

          <button
            onClick={triggerCashDrawer}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
              drawerOpenVisual
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
            title="Solenoid Cash Drawer Kick"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Drawer</span>
          </button>

          {canParkedOrders && (
            <button
              onClick={() => setShowParkedDrawer(true)}
              className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold transition"
              title="Held Orders"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Held</span>
              {parkedOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                  {parkedOrders.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Recent Till Sales History"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MOBILE / PORTRAIT DASHBOARD TAB SWITCHER (Visible on screens < lg) */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1 flex gap-1 shrink-0">
        <button
          onClick={() => setMobileTab('items')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            mobileTab === 'items'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Speed Items</span>
        </button>

        <button
          onClick={() => setMobileTab('keypad')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            mobileTab === 'keypad'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Keypad</span>
        </button>

        <button
          onClick={() => setMobileTab('ticket')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition relative ${
            mobileTab === 'ticket'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ticket ({totalItemsCount})</span>
          {cart.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-2" />
          )}
        </button>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: ACTIVE REGISTER TAPE & TENDER TERMINAL
            - Always visible on lg+ screens
            - On mobile, visible when mobileTab === 'ticket'
        */}
        <div className={`w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 ${
          mobileTab !== 'ticket' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Tape Header Strip */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Current Ticket
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleParkSale}
                  className="px-2 py-1 rounded text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition"
                  title="Hold sale ticket"
                >
                  Hold
                </button>
                <button
                  onClick={handleVoidTicket}
                  className="px-2 py-1 rounded text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                  title="Clear all items"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-1 px-4 py-1.5 bg-slate-100/70 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="col-span-6">Item Description</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-3 text-right">Total</div>
          </div>

          {/* Scrollable Journal Lines */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                  <Receipt className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Ticket is Empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Scan a barcode or tap speed keys to begin adding items to this sale.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const isSelected = selectedCartIndex === idx;
                return (
                  <div
                    key={item.product.id}
                    onClick={() => setSelectedCartIndex(idx)}
                    className={`grid grid-cols-12 gap-1 px-4 py-2.5 items-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-3 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Item Details */}
                    <div className="col-span-6 min-w-0 pr-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>${item.unitPrice.toFixed(2)}</span>
                        {item.discountPercent > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            (-{item.discountPercent}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="col-span-3 flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLineQty(idx, -1);
                        }}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                        title="Minus 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold font-mono min-w-5 text-center text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          adjustLineQty(idx, 1);
                        }}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                        title="Plus 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total & Void action */}
                    <div className="col-span-3 text-right flex items-center justify-end gap-1.5">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        ${item.total.toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoidSelectedLine(idx);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded transition"
                        title="Void Line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Running Totals & Amount Due Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Discounts:</span>
                <span className="font-mono font-semibold">-${discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Tax (Est. 8%):</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">${taxTotal.toFixed(2)}</span>
            </div>

            {/* Total Balance Due Block */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Total Due
                </span>
                {lastChangeGiven !== null && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    Change: ${lastChangeGiven.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ${grandTotal.toFixed(2)}
              </div>
            </div>

            {/* Direct Tendering Options */}
            <div className="pt-2 grid grid-cols-4 gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setTenderMethod('cash')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  tenderMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setTenderMethod('card')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  tenderMethod === 'card'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setTenderMethod('mobile_nfc')}
                className={`py-1.5 px-2 rounded-lg border text-center transition ${
                  tenderMethod === 'mobile_nfc'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                NFC Tap
              </button>
              {canSplitPayments && (
                <button
                  onClick={() => setTenderMethod('split')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition ${
                    tenderMethod === 'split'
                      ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Split
                </button>
              )}
            </div>

            {/* Quick Cash Presets */}
            {tenderMethod === 'cash' && cart.length > 0 && canQuickCash && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => handleCompleteSaleAndPrint('cash', grandTotal)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 whitespace-nowrap"
                >
                  Exact Cash
                </button>
                {[10, 20, 50, 100].filter(amt => amt >= grandTotal).map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleCompleteSaleAndPrint('cash', amt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-300 whitespace-nowrap font-mono"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            )}

            {/* Guest Mode Notice Banner */}
            {isGuestMode && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Shop Guest Mode (Read-Only)</span>
                </div>
                {onOpenSubscriptionManager && (
                  <button
                    onClick={onOpenSubscriptionManager}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline hover:text-amber-900 flex items-center gap-1 shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    Activate
                  </button>
                )}
              </div>
            )}

            {/* Complete Sale & Print Action Button */}
            <button
              onClick={() => handleCompleteSaleAndPrint()}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                isGuestMode
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
              }`}
            >
              {isGuestMode ? <Lock className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              <span>{isGuestMode ? 'Tender Locked (Guest Mode)' : 'Complete Sale & Print Receipt (F12)'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SPEED ITEMS & PUNCH STATION
            - Always visible on lg+ screens
            - On mobile, visible when mobileTab === 'items' or 'keypad'
        */}
        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${
          mobileTab === 'ticket' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Barcode & SKU Punch Search Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <form onSubmit={handlePunchSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={punchInputRef}
                  type="text"
                  placeholder={
                    punchMode === 'qty' 
                      ? 'Type quantity (e.g. 5) & press Enter...'
                      : punchMode === 'discount'
                      ? 'Type discount % (e.g. 15) & press Enter...'
                      : 'Punch SKU / Barcode / Item name (e.g. BEAN-001)...'
                  }
                  value={punchInput}
                  onChange={(e) => setPunchInput(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border transition focus:outline-none ${
                    punchMode === 'qty'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200'
                      : punchMode === 'discount'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                {qtyMultiplier > 1 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {qtyMultiplier}x Multiplier
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition shadow-xs whitespace-nowrap"
              >
                Punch ↵
              </button>
            </form>
          </div>

          {/* VIEW A: SPEED ITEMS GRID (Default on mobileTab === 'items' or desktop) */}
          {mobileTab !== 'keypad' && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Category Filter Tabs */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Speed Buttons Grid */}
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 min-h-0">
                {filteredProducts.map(prod => {
                  const isOutOfStock = prod.stock <= 0;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => !isOutOfStock && punchProduct(prod)}
                      disabled={isOutOfStock}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition group shadow-2xs ${
                        isOutOfStock
                          ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md active:scale-98'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1 mb-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold">
                            {prod.sku}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            prod.stock <= prod.reorderPoint ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {prod.stock} left
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                        <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                          ${prod.price.toFixed(2)}
                        </span>
                        <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    {!currentUser ? (
                      <>
                        <Lock className="w-8 h-8 text-amber-500 mb-2" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Roaming Mode (Not Logged In)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                          No database products or transactions displayed for guest visitors. Sign in or register your business to load your real shop records.
                        </p>
                      </>
                    ) : (
                      <>
                        <Search className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">No items found matching your search filter</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW B: FULL TOUCH NUMPAD (Shown on mobileTab === 'keypad') */}
          {mobileTab === 'keypad' && (
            <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 flex flex-col justify-center max-w-sm mx-auto w-full">
              {/* Function row */}
              <div className="grid grid-cols-2 gap-2 mb-2 font-mono font-bold">
                <button
                  onClick={() => handleNumpadKey('QTY')}
                  className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs tracking-wider shadow-sm transition"
                >
                  X / Quantity
                </button>
                <button
                  onClick={() => handleNumpadKey('DISC')}
                  className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs tracking-wider shadow-sm transition"
                >
                  Discount %
                </button>
              </div>

              {/* Numpad digits */}
              <div className="grid grid-cols-3 gap-2 font-mono">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumpadKey(key)}
                    className="py-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-indigo-600 active:text-white text-base font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs transition"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Clear and backspace */}
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono font-bold text-xs">
                <button
                  onClick={() => handleNumpadKey('C')}
                  className="py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-rose-500 transition"
                >
                  Clear (C)
                </button>
                <button
                  onClick={() => handleNumpadKey('BS')}
                  className="py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  Backspace
                </button>
              </div>
            </div>
          )}

          {/* 4. PERSISTENT BOTTOM FLOATING ACTION BAR FOR MOBILE (< lg)
              Ensures total due and checkout button are NEVER clipped or cut off!
          */}
          <div className="lg:hidden p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Due</span>
              <p className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                ${grandTotal.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500">{totalItemsCount} item(s) on ticket</p>
            </div>

            {mobileTab !== 'ticket' ? (
              <button
                onClick={() => setMobileTab('ticket')}
                disabled={cart.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <span>View Ticket & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleCompleteSaleAndPrint()}
                disabled={cart.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CAMERA BARCODE SCANNER */}
      {showScanner && (
        <BarcodeScannerModal
          products={products}
          onScan={(code) => {
            setShowScanner(false);
            setPunchInput(code);
            const found = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
            if (found) {
              punchProduct(found);
            } else {
              posAudio.playErrorTone();
              setTillStatusMessage(`Scanned barcode: ${code} (not found)`);
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* MODAL: THERMAL RECEIPT PREVIEW (AUTO-OPENED ON SALE COMPLETION) */}
      {activeReceiptTx && (
        <ReceiptModal
          transaction={activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
          onNewSale={() => {
            setActiveReceiptTx(null);
            setCart([]);
            if (punchInputRef.current) punchInputRef.current.focus();
          }}
        />
      )}

      {/* DRAWER: HELD / PARKED TRANSACTIONS */}
      {showParkedDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Held Tickets</h3>
              </div>
              <button
                onClick={() => setShowParkedDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {parkedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No parked orders currently on hold.
                </div>
              ) : (
                parkedOrders.map(po => {
                  const poTotal = po.cart.reduce((s, it) => s + it.total, 0);
                  return (
                    <div
                      key={po.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{po.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Parked at {po.parkedAt} • {po.cart.length} item(s)
                        </p>
                        <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                          ${poTotal.toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleResumeParkedOrder(po)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                      >
                        Recall ↵
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: RECENT TILL SALES HISTORY */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Shift Sales Journal</h3>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No completed sales yet this shift.
                </div>
              ) : (
                recentTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{tx.receiptNumber}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.items.length} items
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">${tx.total.toFixed(2)}</p>
                      <button
                        onClick={() => {
                          setActiveReceiptTx(tx);
                          setShowHistoryDrawer(false);
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mt-1 flex items-center gap-1 justify-end"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Reprint</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest Mode Locked Action Notice Modal */}
      {currentTenant && (
        <GuestModeNoticeModal
          isOpen={showGuestNotice}
          onClose={() => setShowGuestNotice(false)}
          actionName={guestNoticeAction}
          currentTenant={currentTenant}
          availableTenants={availableTenants}
          onSwitchToSubscribedShop={(shop) => {
            if (onSwitchTenant) onSwitchTenant(shop);
          }}
          onOpenSubscriptionManager={() => {
            if (onOpenSubscriptionManager) onOpenSubscriptionManager();
          }}
        />
      )}
    </div>
  );
};
