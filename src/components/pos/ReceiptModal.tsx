import React, { useRef } from 'react';
import { Printer, Download, Check, X, ShieldCheck, CreditCard } from 'lucide-react';
import { Transaction } from '../../types';
import { posAudio } from '../../services/hardware';

interface ReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  onNewSale
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    posAudio.playDrawerKick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transaction Approved</h3>
              <p className="text-[11px] text-slate-500 font-mono">{transaction.receiptNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm ESC/POS Thermal Paper Mockup */}
        <div 
          ref={receiptRef}
          className="bg-white text-slate-900 p-5 rounded-xl border border-slate-200 shadow-inner font-mono text-xs leading-tight space-y-3 print:border-none print:shadow-none print:m-0 print:p-0"
        >
          {/* Receipt Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-base font-extrabold tracking-wider">BLUENILLA POS</h2>
            <p className="text-[10px] text-slate-500">Flagship Downtown Retail #01</p>
            <p className="text-[10px] text-slate-500">742 Evergreen Blvd • Tel: (555) 019-2831</p>
            <p className="text-[10px] text-slate-400 mt-1">Tax Reg / VAT: US-901824719-B</p>
          </div>

          {/* Metadata */}
          <div className="text-[11px] flex justify-between text-slate-600 border-b border-dashed border-slate-300 pb-2">
            <div>
              <p>Receipt: <span className="font-bold">{transaction.receiptNumber}</span></p>
              <p>Cashier: {transaction.cashierName}</p>
            </div>
            <div className="text-right">
              <p>{new Date(transaction.timestamp).toLocaleDateString()}</p>
              <p>{new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <p className="font-semibold text-slate-800">{item.product.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.quantity} x ${item.unitPrice.toFixed(2)}
                    {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                  </p>
                </div>
                <div className="font-bold text-slate-900">
                  ${item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 text-[11px] text-slate-700 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${transaction.subtotal.toFixed(2)}</span>
            </div>
            {transaction.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discounts</span>
                <span>-${transaction.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Sales Tax (8%)</span>
              <span>${transaction.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL DUE</span>
              <span>${transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
            {transaction.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="capitalize">{p.type.replace('_', ' ')} Tendered</span>
                <span className="font-semibold">${p.amount.toFixed(2)}</span>
              </div>
            ))}
            {transaction.changeGiven > 0 && (
              <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                <span>CHANGE DUE</span>
                <span>${transaction.changeGiven.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Barcode & Footer */}
          <div className="text-center pt-1 space-y-1">
            {/* SVG barcode visualization */}
            <div className="flex justify-center items-center gap-1 h-8 opacity-80">
              {Array.from({ length: 38 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-transparent'}`} 
                />
              ))}
            </div>
            <p className="text-[9px] text-slate-500 tracking-widest">{transaction.receiptNumber}</p>
            <p className="text-[10px] text-slate-600 font-medium">Thank you for shopping with BLUENILLA!</p>
            <p className="text-[8px] text-slate-400">Scan QR on mobile for e-receipt & loyalty points</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <span>Next Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
