import React, { useState } from 'react';
import {
  X,
  Receipt,
  Banknote,
  Smartphone,
  Flame,
  Sliders,
  Printer,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { CompletedBill, PaymentMethod, Station } from '../types';
import { useCafe } from '../context/CafeContext';
import {
  computeSessionState,
  formatCurrency,
  formatDateTime,
  formatMinutes,
  formatTimeOnly,
} from '../utils/formatters';

interface CheckoutModalProps {
  station: Station | null;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ station, onClose }) => {
  const { settings, currentTime, completeAndCheckoutSession } = useCafe();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [customMethodName, setCustomMethodName] = useState<string>('Card / POS');
  const [trxId, setTrxId] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [completedReceipt, setCompletedReceipt] = useState<CompletedBill | null>(null);
  const [copied, setCopied] = useState(false);

  if (!station || (!station.currentSession && !completedReceipt)) return null;

  const session = station.currentSession;
  const state = session
    ? computeSessionState(session, station.hourlyRate, settings, currentTime)
    : null;

  const grandTotal = completedReceipt ? completedReceipt.totalAmount : state?.grandTotal || 0;
  const cashNum = parseFloat(cashReceived) || 0;
  const cashChange = Math.max(0, cashNum - grandTotal);

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const handleFinishCheckout = () => {
    const bill = completeAndCheckoutSession(
      station.id,
      paymentMethod,
      paymentMethod === 'cash' ? cashNum || grandTotal : undefined,
      checkoutNotes,
      {
        customPaymentName: paymentMethod === 'custom' ? customMethodName.trim() || 'Custom' : undefined,
        trxId: trxId.trim() || undefined,
        senderNumber: senderNumber.trim() || undefined,
      }
    );
    if (bill) {
      setCompletedReceipt(bill);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPaymentLabel = (bill: CompletedBill) => {
    switch (bill.paymentMethod) {
      case 'bkash':
        return `bKash${bill.trxId ? ` (TrxID: ${bill.trxId})` : ''}${bill.senderNumber ? ` [${bill.senderNumber}]` : ''}`;
      case 'nagad':
        return `Nagad${bill.trxId ? ` (TrxID: ${bill.trxId})` : ''}${bill.senderNumber ? ` [${bill.senderNumber}]` : ''}`;
      case 'custom':
        return `${bill.customPaymentName || 'Custom'}${bill.trxId ? ` (Ref: ${bill.trxId})` : ''}`;
      case 'cash':
      default:
        return 'Cash';
    }
  };

  const getReceiptText = (bill: CompletedBill) => {
    const lines = [
      `==============================`,
      `   ${settings.cafeName.toUpperCase()}`,
      `   ${settings.cafeTagline}`,
      `   Tel: ${settings.phoneOrContact}`,
      `==============================`,
      `Receipt: ${bill.receiptNumber}`,
      `Date: ${formatDateTime(bill.createdAt)}`,
      `Station: ${bill.stationName}`,
      `Customer: ${bill.customerName}`,
      `------------------------------`,
      `Gaming Time: ${formatMinutes(bill.durationMinutes)} @ ${formatCurrency(bill.hourlyRate, settings.currencySymbol)}/hr`,
      `  = ${formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}`,
    ];

    if (bill.extraControllersCost > 0) {
      lines.push(`Extra Controllers: ${formatCurrency(bill.extraControllersCost, settings.currencySymbol)}`);
    }

    if (bill.orders.length > 0) {
      lines.push(`------------------------------`);
      lines.push(`CONCESSIONS & SNACKS:`);
      bill.orders.forEach((o) => {
        lines.push(`  ${o.name} x${o.quantity}  ${formatCurrency(o.price * o.quantity, settings.currencySymbol)}`);
      });
    }

    if (bill.discountAmount > 0) {
      lines.push(`------------------------------`);
      lines.push(`Discount Applied: -${formatCurrency(bill.discountAmount, settings.currencySymbol)}`);
    }

    if (bill.taxAmount > 0) {
      lines.push(`Tax (${settings.taxRatePercent}%): ${formatCurrency(bill.taxAmount, settings.currencySymbol)}`);
    }

    lines.push(`==============================`);
    lines.push(`TOTAL DUE: ${formatCurrency(bill.totalAmount, settings.currencySymbol)}`);
    lines.push(`Payment Method: ${formatPaymentLabel(bill)}`);

    if (bill.paymentMethod === 'cash' && bill.cashReceived) {
      lines.push(`Cash Tendered: ${formatCurrency(bill.cashReceived, settings.currencySymbol)}`);
      lines.push(`Change Returned: ${formatCurrency(bill.cashChange || 0, settings.currencySymbol)}`);
    }

    lines.push(`==============================`);
    lines.push(`${settings.receiptFooterMessage}`);
    lines.push(`==============================`);

    return lines.join('\n');
  };

  const handleCopyReceipt = () => {
    if (!completedReceipt) return;
    const text = getReceiptText(completedReceipt);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black/80 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {completedReceipt ? 'Receipt Generated' : `Checkout: ${station.name}`}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {completedReceipt
                  ? `Receipt #${completedReceipt.receiptNumber} • Paid in full`
                  : `Customer: ${session?.customerName || 'Guest'}`}
              </p>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Normal Checkout Flow */}
        {!completedReceipt && session && state && (
          <div className="p-6 space-y-5">
            
            {/* Itemized Breakdown Card */}
            <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Station & Customer</span>
                <span className="font-bold text-white">
                  {station.name} ({session.customerName})
                </span>
              </div>

              {/* Time Item */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-zinc-200 block">Gaming Rental Time</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {formatTimeOnly(session.startTime)} - {formatTimeOnly(currentTime)} ({formatMinutes(state.elapsedMinutes)}) @ {formatCurrency(station.hourlyRate, settings.currencySymbol)}/hr
                  </span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(state.gamingTimeCost, settings.currencySymbol)}
                </span>
              </div>

              {/* Extra Controllers if any */}
              {state.extraControllersCost > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">
                    +{session.extraControllersCount} Extra Controller(s) Rental
                  </span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(state.extraControllersCost, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {/* Concessions List */}
              {session.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">
                    {o.name} x{o.quantity}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(o.price * o.quantity, settings.currencySymbol)}
                  </span>
                </div>
              ))}

              {/* Discounts */}
              {state.discountValue > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Discount Applied</span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(state.discountValue, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {/* Tax */}
              {state.taxValue > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Tax ({settings.taxRatePercent}%)</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(state.taxValue, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {/* Total Due Big Row */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Total Balance Due
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(state.grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector (Cash - Bkash - Nagad - Custom) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Select Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    id: 'cash',
                    label: 'Cash',
                    icon: Banknote,
                    activeClass: 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
                  },
                  {
                    id: 'bkash',
                    label: 'bKash',
                    icon: Smartphone,
                    activeClass: 'bg-[#E2136E] text-white border-pink-400 shadow-[0_0_12px_rgba(226,19,110,0.35)]',
                  },
                  {
                    id: 'nagad',
                    label: 'Nagad',
                    icon: Flame,
                    activeClass: 'bg-[#F7941D] text-zinc-950 border-orange-400 shadow-[0_0_12px_rgba(247,148,29,0.35)]',
                  },
                  {
                    id: 'custom',
                    label: 'Custom',
                    icon: Sliders,
                    activeClass: 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      id={`pay-method-${m.id}`}
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                        isSelected
                          ? `${m.activeClass} font-bold`
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Calculator Box */}
            {paymentMethod === 'cash' && (
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Cash Received Tender</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(Math.ceil(state.grandTotal))}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors"
                    >
                      Exact
                    </button>
                    {[50, 100, 500, 1000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => handleQuickCash(note)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-[10px] font-mono font-bold transition-colors"
                      >
                        {formatCurrency(note, settings.currencySymbol)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <input
                      id="cash-received-input"
                      type="number"
                      min="0"
                      step="0.5"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Amount received..."
                      className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Change Due:</span>
                    <span className={`text-base font-mono font-bold ${cashChange > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {formatCurrency(cashChange, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* bKash Payment Box */}
            {paymentMethod === 'bkash' && (
              <div className="p-4 rounded-xl bg-[#E2136E]/10 border border-[#E2136E]/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#E2136E]" />
                    <span className="text-xs font-bold text-pink-300">bKash Mobile Payment</span>
                  </div>
                  <span className="text-[11px] font-mono text-pink-400">Merchant / Personal</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-pink-200 mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. 9J8A7K3X"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-pink-500/30 text-white font-mono uppercase focus:outline-none focus:border-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-pink-200 mb-1">
                      Customer / Sender Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-pink-500/30 text-white font-mono focus:outline-none focus:border-pink-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nagad Payment Box */}
            {paymentMethod === 'nagad' && (
              <div className="p-4 rounded-xl bg-[#F7941D]/10 border border-[#F7941D]/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#F7941D]" />
                    <span className="text-xs font-bold text-orange-300">Nagad Mobile Payment</span>
                  </div>
                  <span className="text-[11px] font-mono text-orange-400">Post Office Digital</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-orange-200 mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. NAG98213"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-orange-500/30 text-white font-mono uppercase focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-orange-200 mb-1">
                      Customer / Sender Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g. 018XXXXXXXX"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-orange-500/30 text-white font-mono focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Payment Box */}
            {paymentMethod === 'custom' && (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300">Custom Payment Method</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {['Card / POS', 'Bank', 'Voucher', 'Due / Credit'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomMethodName(preset)}
                        className="px-2 py-0.5 text-[10px] rounded bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/20 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-cyan-200 mb-1">
                      Payment Method Name
                    </label>
                    <input
                      type="text"
                      value={customMethodName}
                      onChange={(e) => setCustomMethodName(e.target.value)}
                      placeholder="e.g. Credit Card, Voucher, Bank Transfer"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-cyan-200 mb-1">
                      Auth / Voucher / Reference Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="e.g. AUTH-4819"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-cyan-500/30 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <div className="pt-2">
              <button
                id="complete-checkout-btn"
                onClick={handleFinishCheckout}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-zinc-950 shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Payment & Print Receipt</span>
              </button>
            </div>

          </div>
        )}

        {/* Completed Receipt View */}
        {completedReceipt && (
          <div className="p-6 space-y-5">
            {/* Printable Thermal Receipt Card */}
            <div
              id="printable-receipt"
              className="p-5 rounded-xl bg-white text-zinc-900 font-mono text-xs shadow-inner space-y-3"
            >
              <div className="text-center border-b border-dashed border-zinc-300 pb-3">
                <h3 className="text-base font-black tracking-tight uppercase">
                  {settings.cafeName}
                </h3>
                <p className="text-[10px] text-zinc-600">{settings.cafeTagline}</p>
                <p className="text-[10px] text-zinc-600">Tel: {settings.phoneOrContact}</p>
                <div className="mt-2 text-[10px] text-zinc-500">
                  <span>Rec: {completedReceipt.receiptNumber}</span> •{' '}
                  <span>{formatDateTime(completedReceipt.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 pb-2">
                <div className="flex justify-between">
                  <span>Station:</span>
                  <span className="font-bold">{completedReceipt.stationName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer / Payer:</span>
                  <span className="font-bold">{completedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{formatMinutes(completedReceipt.durationMinutes)} (@ {formatCurrency(completedReceipt.hourlyRate, settings.currencySymbol)}/hr)</span>
                </div>
                {completedReceipt.billiardMatch && (
                  <div className="pt-1 text-[10px] text-zinc-700">
                    <span className="font-bold block text-zinc-900">Billiards Match:</span>
                    <span>
                      {completedReceipt.billiardMatch.player1Name} ({completedReceipt.billiardMatch.player1Score}) vs{' '}
                      {completedReceipt.billiardMatch.player2Name} ({completedReceipt.billiardMatch.player2Score})
                      {completedReceipt.billiardMatch.winner &&
                        ` • Winner: ${
                          completedReceipt.billiardMatch.winner === 'player1'
                            ? completedReceipt.billiardMatch.player1Name
                            : completedReceipt.billiardMatch.player2Name
                        }`}
                    </span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 pb-3">
                <div className="flex justify-between font-bold">
                  <span>Gaming Rental</span>
                  <span>{formatCurrency(completedReceipt.gamingTimeCost, settings.currencySymbol)}</span>
                </div>

                {completedReceipt.extraControllersCost > 0 && (
                  <div className="flex justify-between text-zinc-700">
                    <span>Extra Controllers</span>
                    <span>{formatCurrency(completedReceipt.extraControllersCost, settings.currencySymbol)}</span>
                  </div>
                )}

                {completedReceipt.orders.map((o) => (
                  <div key={o.id} className="flex justify-between text-zinc-700">
                    <span>{o.name} x{o.quantity}</span>
                    <span>{formatCurrency(o.price * o.quantity, settings.currencySymbol)}</span>
                  </div>
                ))}

                {completedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(completedReceipt.discountAmount, settings.currencySymbol)}</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-base font-black">
                  <span>TOTAL PAID</span>
                  <span>{formatCurrency(completedReceipt.totalAmount, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Payment Method:</span>
                  <span className="font-bold uppercase">{formatPaymentLabel(completedReceipt)}</span>
                </div>
                {completedReceipt.paymentMethod === 'cash' && completedReceipt.cashReceived && (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Cash Tendered:</span>
                      <span>{formatCurrency(completedReceipt.cashReceived, settings.currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Change:</span>
                      <span>{formatCurrency(completedReceipt.cashChange || 0, settings.currencySymbol)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-zinc-300 text-[10px] text-zinc-500 italic">
                {settings.receiptFooterMessage}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                id="copy-receipt-btn"
                onClick={handleCopyReceipt}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Receipt!' : 'Copy Receipt Text'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="print-receipt-btn"
                  onClick={handlePrint}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  id="done-checkout-btn"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

