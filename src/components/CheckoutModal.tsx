import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Check, CheckCircle2, Copy, Flame, Percent, Printer, Receipt, Smartphone, Sliders, X } from 'lucide-react';
import { CompletedBill, PaymentMethod, Station } from '../types';
import { useCafe } from '../context/CafeContext';
import { computeSessionState, formatCurrency, formatDateTime, formatMinutes, formatTimeOnly } from '../utils/formatters';

interface CheckoutModalProps {
  station: Station | null;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ station, onClose }) => {
  const { settings, currentTime, completeAndCheckoutSession, updateSessionDiscount } = useCafe();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customMethodName, setCustomMethodName] = useState('Card / POS');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountInput, setDiscountInput] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<CompletedBill | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!station?.currentSession) return;
    setDiscountType(station.currentSession.discountType || 'fixed');
    setDiscountInput(station.currentSession.discountAmount ? String(station.currentSession.discountAmount) : '');
  }, [station?.id, station?.currentSession?.id]);

  if (!station || (!station.currentSession && !completedReceipt)) return null;

  const session = station.currentSession;
  const state = session ? computeSessionState(session, station.hourlyRate, settings, currentTime) : null;
  const grandTotal = completedReceipt?.totalAmount ?? state?.grandTotal ?? 0;
  const cashNum = Number.parseFloat(cashReceived) || 0;
  const cashChange = Math.max(0, cashNum - grandTotal);

  const paymentLabel = useMemo(() => {
    if (!completedReceipt) return paymentMethod === 'custom' ? customMethodName : paymentMethod;
    switch (completedReceipt.paymentMethod) {
      case 'bkash': return `bKash${completedReceipt.trxId ? ` • ${completedReceipt.trxId}` : ''}`;
      case 'nagad': return `Nagad${completedReceipt.trxId ? ` • ${completedReceipt.trxId}` : ''}`;
      case 'custom': return completedReceipt.customPaymentName || 'Custom';
      default: return 'Cash';
    }
  }, [completedReceipt, paymentMethod, customMethodName]);

  const applyDiscount = (value: string, type: 'fixed' | 'percentage' = discountType) => {
    const parsed = Number.parseFloat(value);
    const safe = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    const clamped = type === 'percentage' ? Math.min(100, safe) : Math.min(state?.subtotal ?? safe, safe);
    setDiscountInput(clamped ? String(clamped) : '');
    if (session) updateSessionDiscount(station.id, clamped, type);
  };

  const handleDiscountType = (type: 'fixed' | 'percentage') => {
    setDiscountType(type);
    applyDiscount(discountInput, type);
  };

  const getReceiptText = (bill: CompletedBill) => {
    const lines = [
      '================================',
      settings.cafeName.toUpperCase(),
      settings.cafeTagline,
      `Tel: ${settings.phoneOrContact}`,
      '================================',
      `Receipt: ${bill.receiptNumber}`,
      `Date: ${formatDateTime(bill.createdAt)}`,
      `Station: ${bill.stationName}`,
      `Customer: ${bill.customerName}`,
      '--------------------------------',
      `Gaming ${formatMinutes(bill.durationMinutes)} @ ${formatCurrency(bill.hourlyRate, settings.currencySymbol)}/hr` ,
      `Gaming charge              ${formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}`,
    ];
    if (bill.extraControllersCost) lines.push(`Extra controllers           ${formatCurrency(bill.extraControllersCost, settings.currencySymbol)}`);
    bill.orders.forEach((item) => lines.push(`${item.name} x${item.quantity}             ${formatCurrency(item.price * item.quantity, settings.currencySymbol)}`));
    lines.push('--------------------------------');
    if (bill.discountAmount > 0) lines.push(`Discount                   -${formatCurrency(bill.discountAmount, settings.currencySymbol)}`);
    if (bill.taxAmount > 0) lines.push(`Tax                         ${formatCurrency(bill.taxAmount, settings.currencySymbol)}`);
    lines.push(`TOTAL                       ${formatCurrency(bill.totalAmount, settings.currencySymbol)}`);
    lines.push(`Payment: ${paymentLabel}`);
    if (bill.paymentMethod === 'cash' && bill.cashReceived !== undefined) {
      lines.push(`Cash received              ${formatCurrency(bill.cashReceived, settings.currencySymbol)}`);
      lines.push(`Change                     ${formatCurrency(bill.cashChange || 0, settings.currencySymbol)}`);
    }
    lines.push('================================', settings.receiptFooterMessage, '================================');
    return lines.join('\n');
  };

  const printReceipt = (bill: CompletedBill) => {
    const popup = window.open('', '_blank', 'width=420,height=760');
    if (!popup) return;
    const rows = bill.orders.map((item) => `<div class="row"><span>${item.name} ×${item.quantity}</span><span>${formatCurrency(item.price * item.quantity, settings.currencySymbol)}</span></div>`).join('');
    popup.document.write(`<!doctype html><html><head><title>${bill.receiptNumber}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#fff;color:#111;font-family:Arial,sans-serif}.receipt{width:72mm;margin:0 auto;padding:8mm 4mm;box-sizing:border-box;font-size:12px}.center{text-align:center}.brand{font-size:18px;font-weight:800}.muted{color:#555}.line{border-top:1px dashed #888;margin:10px 0}.row{display:flex;justify-content:space-between;gap:10px;margin:5px 0}.total{font-size:17px;font-weight:800}.discount{color:#16803c}@media print{body{width:80mm}.receipt{width:80mm;margin:0;padding:4mm}.no-print{display:none}}</style></head><body><div class="receipt"><div class="center brand">${settings.cafeName}</div><div class="center muted">${settings.cafeTagline}</div><div class="center muted">${settings.phoneOrContact}</div><div class="line"></div><div>Receipt: <b>${bill.receiptNumber}</b></div><div>Date: ${formatDateTime(bill.createdAt)}</div><div>Station: ${bill.stationName}</div><div>Customer: ${bill.customerName}</div><div class="line"></div><div class="row"><span>Gaming ${formatMinutes(bill.durationMinutes)}</span><span>${formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}</span></div>${rows}<div class="line"></div>${bill.discountAmount > 0 ? `<div class="row discount"><span>Discount</span><span>-${formatCurrency(bill.discountAmount, settings.currencySymbol)}</span></div>` : ''}${bill.taxAmount > 0 ? `<div class="row"><span>Tax</span><span>${formatCurrency(bill.taxAmount, settings.currencySymbol)}</span></div>` : ''}<div class="row total"><span>TOTAL</span><span>${formatCurrency(bill.totalAmount, settings.currencySymbol)}</span></div><div class="row"><span>Payment</span><span>${paymentLabel}</span></div>${bill.paymentMethod === 'cash' && bill.cashReceived !== undefined ? `<div class="row"><span>Received</span><span>${formatCurrency(bill.cashReceived, settings.currencySymbol)}</span></div><div class="row"><span>Change</span><span>${formatCurrency(bill.cashChange || 0, settings.currencySymbol)}</span></div>` : ''}<div class="line"></div><div class="center muted">${settings.receiptFooterMessage}</div></div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    popup.document.close();
  };

  const handleFinishCheckout = () => {
    if (!session || !state) return;
    if (paymentMethod === 'cash' && cashNum < grandTotal) return;
    const bill = completeAndCheckoutSession(
      station.id,
      paymentMethod,
      paymentMethod === 'cash' ? cashNum : undefined,
      checkoutNotes,
      {
        customPaymentName: paymentMethod === 'custom' ? customMethodName.trim() || 'Custom' : undefined,
        trxId: trxId.trim() || undefined,
        senderNumber: senderNumber.trim() || undefined,
      }
    );
    if (bill) setCompletedReceipt(bill);
  };

  const copyReceipt = () => {
    if (!completedReceipt) return;
    navigator.clipboard.writeText(getReceiptText(completedReceipt)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl shadow-black/80 my-4">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Receipt className="w-5 h-5" /></div><div><h2 className="text-lg font-bold text-white">{completedReceipt ? 'Payment Complete' : 'Checkout'}</h2><p className="text-xs text-zinc-500 font-mono">{completedReceipt ? `Receipt #${completedReceipt.receiptNumber}` : `${station.name} • ${session?.customerName || 'Guest'}`}</p></div></div>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>

        {!completedReceipt && session && state && (
          <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-0">
            <div className="p-5 sm:p-6 space-y-5 lg:border-r border-zinc-800">
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-zinc-500">SESSION</p><h3 className="text-base font-bold text-white mt-1">{station.name}</h3><p className="text-xs text-zinc-400 mt-1">{session.customerName} • Started {formatTimeOnly(session.startTime)}</p></div><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">ACTIVE</span></div>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex justify-between"><span className="text-xs font-bold text-zinc-300">ORDER SUMMARY</span><span className="text-xs text-zinc-500">{formatMinutes(state.elapsedMinutes)}</span></div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-300">Gaming session</span><span className="font-mono">{formatCurrency(state.gamingTimeCost, settings.currencySymbol)}</span></div>
                  {state.extraControllersCost > 0 && <div className="flex justify-between"><span className="text-zinc-400">Extra controllers</span><span className="font-mono">{formatCurrency(state.extraControllersCost, settings.currencySymbol)}</span></div>}
                  {session.orders.map((item) => <div key={item.id} className="flex justify-between"><span className="text-zinc-400">{item.name} ×{item.quantity}</span><span className="font-mono">{formatCurrency(item.price * item.quantity, settings.currencySymbol)}</span></div>)}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between text-xs text-zinc-500"><span>Subtotal</span><span className="font-mono">{formatCurrency(state.subtotal, settings.currencySymbol)}</span></div>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-zinc-200">DISCOUNT</p><p className="text-[11px] text-zinc-500">Apply a fixed amount or percentage.</p></div><Percent className="w-4 h-4 text-emerald-400" /></div>
                <div className="grid grid-cols-2 gap-2"><button onClick={() => handleDiscountType('fixed')} className={`py-2 rounded-xl text-xs font-semibold border ${discountType === 'fixed' ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>Amount ({settings.currencySymbol})</button><button onClick={() => handleDiscountType('percentage')} className={`py-2 rounded-xl text-xs font-semibold border ${discountType === 'percentage' ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>Percentage (%)</button></div>
                <div className="flex gap-2"><input value={discountInput} onChange={(e) => applyDiscount(e.target.value)} type="number" min="0" max={discountType === 'percentage' ? 100 : state.subtotal} step="0.01" placeholder={discountType === 'percentage' ? '10' : '50'} className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-emerald-500" /><button onClick={() => applyDiscount('0')} className="px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700">Clear</button></div>
                {state.discountValue > 0 && <div className="flex justify-between text-xs text-emerald-400"><span>Discount applied</span><span className="font-mono">-{formatCurrency(state.discountValue, settings.currencySymbol)}</span></div>}
              </div>

              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                <p className="text-xs font-bold text-zinc-200">PAYMENT METHOD</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    ['cash', 'Cash', Banknote], ['bkash', 'bKash', Smartphone], ['nagad', 'Nagad', Flame], ['custom', 'Custom', Sliders],
                  ] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setPaymentMethod(id)} className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 ${paymentMethod === id ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}><Icon className="w-4 h-4" /><span>{label}</span></button>)}
                </div>

                {paymentMethod === 'cash' && <div className="space-y-2 pt-1"><div className="flex gap-1.5 flex-wrap">{[Math.ceil(grandTotal), 50, 100, 500, 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((note) => <button key={note} onClick={() => setCashReceived(String(note))} className="px-2.5 py-1 rounded-lg bg-zinc-800 text-emerald-300 text-[10px] font-mono">{formatCurrency(note, settings.currencySymbol)}</button>)}</div><div className="grid grid-cols-2 gap-2"><input value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} type="number" min="0" placeholder="Cash received" className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-emerald-500" /><div className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800"><p className="text-[10px] text-zinc-500">CHANGE</p><p className={`font-mono font-bold ${cashChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(cashChange, settings.currencySymbol)}</p></div></div>{cashNum < grandTotal && cashReceived && <p className="text-[11px] text-red-400">Cash received is less than the total.</p>}</div>}
                {paymentMethod === 'bkash' && <div className="grid sm:grid-cols-2 gap-2"><input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="bKash TrxID" className="px-3 py-2 rounded-xl bg-zinc-900 border border-pink-500/30 text-white text-xs" /><input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Sender phone (optional)" className="px-3 py-2 rounded-xl bg-zinc-900 border border-pink-500/30 text-white text-xs" /></div>}
                {paymentMethod === 'nagad' && <div className="grid sm:grid-cols-2 gap-2"><input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="Nagad TrxID" className="px-3 py-2 rounded-xl bg-zinc-900 border border-orange-500/30 text-white text-xs" /><input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Sender phone (optional)" className="px-3 py-2 rounded-xl bg-zinc-900 border border-orange-500/30 text-white text-xs" /></div>}
                {paymentMethod === 'custom' && <div className="grid sm:grid-cols-2 gap-2"><input value={customMethodName} onChange={(e) => setCustomMethodName(e.target.value)} placeholder="Payment method" className="px-3 py-2 rounded-xl bg-zinc-900 border border-cyan-500/30 text-white text-xs" /><input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="Reference (optional)" className="px-3 py-2 rounded-xl bg-zinc-900 border border-cyan-500/30 text-white text-xs" /></div>}
              </div>

              <textarea value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} placeholder="Checkout note (optional)" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs resize-none focus:outline-none focus:border-zinc-600" />
            </div>

            <aside className="p-5 sm:p-6 bg-zinc-950/40 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-bold text-white">Payment Summary</h3><span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">Receipt preview</span></div>
              <div className="rounded-xl bg-white text-zinc-900 p-5 font-mono text-xs shadow-xl" id="receipt-preview">
                <div className="text-center pb-3 border-b border-dashed border-zinc-300"><p className="text-lg font-black uppercase">{settings.cafeName}</p><p className="text-[10px] text-zinc-500">{settings.cafeTagline}</p><p className="text-[10px] text-zinc-500">{settings.phoneOrContact}</p></div>
                <div className="py-3 space-y-1 text-[10px]"><div className="flex justify-between"><span>Station</span><b>{station.name}</b></div><div className="flex justify-between"><span>Customer</span><b>{session.customerName}</b></div><div className="flex justify-between"><span>Receipt</span><b>Generated after payment</b></div></div>
                <div className="border-t border-dashed border-zinc-300 py-3 space-y-1.5"><div className="flex justify-between"><span>Gaming</span><span>{formatCurrency(state.gamingTimeCost, settings.currencySymbol)}</span></div>{session.orders.map((item) => <div key={item.id} className="flex justify-between"><span>{item.name} ×{item.quantity}</span><span>{formatCurrency(item.price * item.quantity, settings.currencySymbol)}</span></div>)}{state.discountValue > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatCurrency(state.discountValue, settings.currencySymbol)}</span></div>}{state.taxValue > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(state.taxValue, settings.currencySymbol)}</span></div>}</div>
                <div className="border-t border-zinc-900 mt-2 pt-3 flex justify-between text-base font-black"><span>TOTAL</span><span>{formatCurrency(grandTotal, settings.currencySymbol)}</span></div>
                <div className="mt-3 pt-3 border-t border-dashed border-zinc-300 text-center text-[10px] text-zinc-500">{settings.receiptFooterMessage}</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><div className="flex justify-between text-sm text-zinc-400"><span>Subtotal</span><span className="font-mono">{formatCurrency(state.subtotal, settings.currencySymbol)}</span></div><div className="flex justify-between text-sm text-emerald-400 mt-2"><span>Discount</span><span className="font-mono">-{formatCurrency(state.discountValue, settings.currencySymbol)}</span></div><div className="flex justify-between text-2xl font-black text-white mt-4 pt-4 border-t border-zinc-800"><span>Total</span><span className="text-emerald-400 font-mono">{formatCurrency(grandTotal, settings.currencySymbol)}</span></div></div>
              <button onClick={handleFinishCheckout} disabled={paymentMethod === 'cash' && cashNum < grandTotal} className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"><CheckCircle2 className="w-5 h-5" /> Complete Payment</button>
              <p className="text-[10px] text-zinc-600 text-center">Completing payment ends the session and frees the station.</p>
            </aside>
          </div>
        )}

        {completedReceipt && (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-0">
            <div className="p-5 sm:p-6 border-r border-zinc-800 space-y-4"><div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4"><div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="w-5 h-5" /><span className="font-bold">Payment recorded successfully</span></div><p className="text-xs text-zinc-400 mt-2">Receipt #{completedReceipt.receiptNumber} • {paymentLabel}</p></div><div className="grid grid-cols-2 gap-3"><button onClick={() => printReceipt(completedReceipt)} className="py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print Receipt</button><button onClick={copyReceipt} className="py-3 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy Text'}</button></div><button onClick={onClose} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold">Done</button></div>
            <div className="p-5 sm:p-6 bg-zinc-950/40"><div className="bg-white text-zinc-900 rounded-xl p-5 font-mono text-xs shadow-xl"><div className="text-center pb-3 border-b border-dashed border-zinc-300"><p className="text-lg font-black uppercase">{settings.cafeName}</p><p>{settings.cafeTagline}</p><p>{settings.phoneOrContact}</p></div><div className="py-3 space-y-1"><p>Receipt: <b>{completedReceipt.receiptNumber}</b></p><p>Date: {formatDateTime(completedReceipt.createdAt)}</p><p>Station: {completedReceipt.stationName}</p><p>Customer: {completedReceipt.customerName}</p></div><div className="border-t border-dashed border-zinc-300 py-3 space-y-1.5"><div className="flex justify-between"><span>Gaming</span><span>{formatCurrency(completedReceipt.gamingTimeCost, settings.currencySymbol)}</span></div>{completedReceipt.orders.map((item) => <div key={item.id} className="flex justify-between"><span>{item.name} ×{item.quantity}</span><span>{formatCurrency(item.price * item.quantity, settings.currencySymbol)}</span></div>)}{completedReceipt.discountAmount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatCurrency(completedReceipt.discountAmount, settings.currencySymbol)}</span></div>}{completedReceipt.taxAmount > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(completedReceipt.taxAmount, settings.currencySymbol)}</span></div>}</div><div className="border-t border-zinc-900 mt-2 pt-3 flex justify-between text-base font-black"><span>TOTAL PAID</span><span>{formatCurrency(completedReceipt.totalAmount, settings.currencySymbol)}</span></div><p className="mt-3 pt-3 border-t border-dashed border-zinc-300 text-center text-[10px] text-zinc-500">{settings.receiptFooterMessage}</p></div></div>
          </div>
        )}
      </div>
    </div>
  );
};
