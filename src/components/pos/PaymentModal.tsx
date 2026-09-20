import React, { useState } from 'react';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Percent, 
  Split, 
  X, 
  Check, 
  Receipt,
  Sparkles
} from 'lucide-react';
import { CartItem, PaymentRecord, PaymentType, Transaction, User } from '../../types';
import { posAudio } from '../../services/hardware';

interface PaymentModalProps {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currentUser: User;
  isOffline: boolean;
  onComplete: (tx: Transaction) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  items,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  currentUser,
  isOffline,
  onComplete,
  onClose
}) => {
  const [method, setMethod] = useState<PaymentType>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>(total.toFixed(2));
  const [splitCash, setSplitCash] = useState<string>((total / 2).toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);

  const tenderedAmount = parseFloat(tenderedInput) || 0;
  const changeDue = Math.max(0, tenderedAmount - total);

  const quickCashPresets = [
    { label: 'Exact', amount: total },
    { label: '$10', amount: 10 },
    { label: '$20', amount: 20 },
    { label: '$50', amount: 50 },
    { label: '$100', amount: 100 }
  ].filter(p => p.amount >= total || p.label === 'Exact');

  const handleProcessPayment = () => {
    setIsProcessing(true);
    posAudio.playScanBeep();

    setTimeout(() => {
      let payments: PaymentRecord[] = [];

      if (method === 'cash') {
        payments = [{ type: 'cash', amount: total }];
        posAudio.playDrawerKick();
      } else if (method === 'split') {
        const cashPart = parseFloat(splitCash) || 0;
        const cardPart = Math.max(0, total - cashPart);
        payments = [
          { type: 'cash', amount: cashPart },
          { type: 'card', amount: cardPart, reference: 'SPLIT-EMV-AUTH' }
        ];
        posAudio.playDrawerKick();
      } else {
        payments = [{ type: method, amount: total, reference: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` }];
      }

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        receiptNumber: `BN-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        items,
        subtotal,
        discountTotal,
        taxTotal,
        total,
        payments,
        tenderedAmount: method === 'cash' ? tenderedAmount : total,
        changeGiven: method === 'cash' ? changeDue : 0,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        branchId: currentUser.branchId,
        status: 'completed',
        offlineSynced: !isOffline,
        syncTimestamp: !isOffline ? new Date().toISOString() : undefined
      };

      setIsProcessing(false);
      onComplete(tx);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Complete Transaction</h3>
            <p className="text-xs text-slate-500">Select payment tender & finalize receipt</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="my-4 p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount Due</p>
            <p className="text-2xl font-extrabold font-mono">${total.toFixed(2)}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>{items.length} items</p>
            <p>Tax: ${taxTotal.toFixed(2)}</p>
            {isOffline && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                Offline Mode (Local Queue)
              </span>
            )}
          </div>
        </div>

        {/* Tender Method Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => { setMethod('cash'); setTenderedInput(total.toFixed(2)); }}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
              method === 'cash'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setMethod('card')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
              method === 'card'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Card EMV</span>
          </button>

          <button
            onClick={() => setMethod('mobile_nfc')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
              method === 'mobile_nfc'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>NFC Tap</span>
          </button>

          <button
            onClick={() => setMethod('split')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
              method === 'split'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Split className="w-5 h-5" />
            <span>Split Tender</span>
          </button>
        </div>

        {/* Method Specific Options */}
        {method === 'cash' && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tendered Cash Amount ($):</label>
              <input
                type="number"
                step="0.01"
                value={tenderedInput}
                onChange={(e) => setTenderedInput(e.target.value)}
                className="w-32 text-right py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex gap-2">
              {quickCashPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setTenderedInput(preset.amount.toFixed(2))}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Change Due Display */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Change Due to Customer:</span>
              <span className={`text-base font-extrabold font-mono ${changeDue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                ${changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 mb-4 text-center space-y-2">
            <CreditCard className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Terminal Ready: Insert, Swipe, or Tap Card</p>
            <p className="text-[11px] text-slate-500">Supports Visa, MasterCard, Amex, Interac with PIN verification</p>
          </div>
        )}

        {method === 'mobile_nfc' && (
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 mb-4 text-center space-y-2">
            <Smartphone className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Hold Device Near Reader</p>
            <p className="text-[11px] text-slate-500">Apple Pay, Google Wallet, and Wearable NFC supported</p>
          </div>
        )}

        {method === 'split' && (
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Part 1: Cash Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="w-28 text-right py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold">Part 2: Balance on Card ($)</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                ${Math.max(0, total - (parseFloat(splitCash) || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Back
          </button>
          <button
            onClick={handleProcessPayment}
            disabled={isProcessing || (method === 'cash' && tenderedAmount < total)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authorizing Tender...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Charge ${total.toFixed(2)} & Issue Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
