import React, { useState } from 'react';
import {
  X,
  CircleDot,
  User,
  Users,
  Trophy,
  ShoppingBag,
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  FileText,
  Tag,
  Flame,
  AlertCircle,
  Copy,
  Check,
  Percent,
} from 'lucide-react';
import { CompletedBill, PaymentMethod, PlayerTab, Product, Station } from '../types';
import { useCafe } from '../context/CafeContext';
import { computeSessionState, formatCurrency, formatMinutes, formatTimeOnly } from '../utils/formatters';
import { ReceiptDetailModal } from './ReceiptDetailModal';

interface PlayerLedgerModalProps {
  tab: PlayerTab;
  onClose: () => void;
  onOpenQuickRackModal?: (playerName: string) => void;
}

export const PlayerLedgerModal: React.FC<PlayerLedgerModalProps> = ({
  tab,
  onClose,
  onOpenQuickRackModal,
}) => {
  const {
    stations,
    products,
    settings,
    currentTime,
    removeRackLoss,
    addOrderToPlayerTab,
    removeOrderFromPlayerTab,
    updatePlayerTabDiscount,
    checkoutPlayerTab,
    deletePlayerTab,
  } = useCafe();

  // Find associated active station (by activeStationId or by customerName matching currentSession)
  let associatedStation: Station | undefined;
  if (tab.activeStationId) {
    associatedStation = stations.find((s) => s.id === tab.activeStationId);
  }
  if (!associatedStation) {
    associatedStation = stations.find(
      (s) =>
        s.currentSession &&
        s.currentSession.customerName.trim().toLowerCase() === tab.playerName.trim().toLowerCase()
    );
  }

  // Calculate live hourly charges if seated
  let gamingTimeCost = 0;
  let elapsedMinutes = 0;
  if (associatedStation && associatedStation.currentSession) {
    const sessionState = computeSessionState(
      associatedStation.currentSession,
      associatedStation.hourlyRate,
      currentTime,
      settings.gracePeriodMinutes,
      settings.billingIntervalMinutes,
      settings.taxRatePercent
    );
    gamingTimeCost = sessionState.gamingTimeCost;
    elapsedMinutes = sessionState.elapsedMinutes;
  }

  // Cost components
  const rackLossesCost = tab.rackLosses.reduce((sum, r) => sum + r.fee, 0);
  const tabConcessionsCost = tab.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const sessionConcessionsCost = associatedStation?.currentSession?.orders.reduce(
    (sum, o) => sum + o.price * o.quantity,
    0
  ) || 0;
  const totalConcessionsCost = tabConcessionsCost + sessionConcessionsCost;

  const subtotalBeforeDiscount = gamingTimeCost + rackLossesCost + totalConcessionsCost;

  // Discount
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(tab.discountType || 'fixed');
  const [discountValue, setDiscountValue] = useState<number>(tab.discountAmount || 0);

  let calculatedDiscount = 0;
  if (discountType === 'percentage') {
    calculatedDiscount = (subtotalBeforeDiscount * discountValue) / 100;
  } else {
    calculatedDiscount = discountValue;
  }
  calculatedDiscount = Math.min(calculatedDiscount, subtotalBeforeDiscount);

  const taxableAmount = Math.max(0, subtotalBeforeDiscount - calculatedDiscount);
  const taxAmount = settings.taxRatePercent > 0 ? (taxableAmount * settings.taxRatePercent) / 100 : 0;
  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  const [trxId, setTrxId] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>(tab.phone || '');
  const [customPaymentName, setCustomPaymentName] = useState<string>('Card / POS Terminal');
  const [checkoutNotes, setCheckoutNotes] = useState<string>(tab.notes || '');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Completed Receipt state
  const [completedBill, setCompletedBill] = useState<CompletedBill | null>(null);

  // Quick snack add selector state
  const [isAddingSnack, setIsAddingSnack] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [snackQty, setSnackQty] = useState<number>(1);

  // Cash presets
  const cashPresets = [
    grandTotal,
    Math.ceil(grandTotal / 50) * 50,
    Math.ceil(grandTotal / 100) * 100,
    500,
    1000,
  ].filter((val, idx, arr) => val >= grandTotal && arr.indexOf(val) === idx);

  const cashChange = Math.max(0, cashReceived - grandTotal);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNumber(label);
      setTimeout(() => setCopiedNumber(null), 2000);
    });
  };

  const handleAddSnackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (product && snackQty > 0) {
      addOrderToPlayerTab(tab.id, product, snackQty);
      setIsAddingSnack(false);
      setSnackQty(1);
    }
  };

  const handleDiscountChange = (val: number, type: 'fixed' | 'percentage') => {
    setDiscountValue(val);
    setDiscountType(type);
    updatePlayerTabDiscount(tab.id, val, type);
  };

  const handleFinalCheckout = () => {
    if (paymentMethod === 'cash' && cashReceived < grandTotal) {
      alert(`Cash received (${formatCurrency(cashReceived, settings.currencySymbol)}) cannot be less than Grand Total (${formatCurrency(grandTotal, settings.currencySymbol)}).`);
      return;
    }

    const bill = checkoutPlayerTab(tab.id, paymentMethod, cashReceived, checkoutNotes, {
      customPaymentName,
      trxId: trxId.trim() || undefined,
      senderNumber: senderNumber.trim() || undefined,
    });

    if (bill) {
      setCompletedBill(bill);
    }
  };

  // If receipt is open
  if (completedBill) {
    return (
      <ReceiptDetailModal
        bill={completedBill}
        onClose={() => {
          setCompletedBill(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/90 my-4 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {tab.playerName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Active Player Tab
                </span>
                {tab.phone && (
                  <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                    • {tab.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Started {formatTimeOnly(tab.createdAt)} • All matches, hourly tables & snacks in one tab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete tab for ${tab.playerName}? Unsaved charges will be cleared.`)) {
                  deletePlayerTab(tab.id);
                  onClose();
                }
              }}
              title="Delete Tab"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="player-ledger-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Metric Cards: Summary of What Is Owed */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Grand Total Due */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block tracking-wider">
                Total Amount Due
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-emerald-300 mt-0.5">
                {formatCurrency(grandTotal, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Ready for checkout
              </span>
            </div>

            {/* Racks Lost Count */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block tracking-wider">
                Racks / Matches Lost
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5">
                {tab.rackLosses.length}{' '}
                <span className="text-xs text-zinc-500 font-normal">racks</span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono block mt-0.5">
                {formatCurrency(rackLossesCost, settings.currencySymbol)} rack fees
              </span>
            </div>

            {/* Hourly Table Time */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block tracking-wider">
                Hourly Session
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5">
                {associatedStation ? Math.round(elapsedMinutes) : 0}{' '}
                <span className="text-xs text-zinc-500 font-normal">min</span>
              </div>
              <span className="text-[10px] text-cyan-400/90 font-mono block mt-0.5 truncate">
                {associatedStation ? `${formatCurrency(gamingTimeCost, settings.currencySymbol)} on ${associatedStation.name}` : 'Not on hourly table'}
              </span>
            </div>

            {/* Concessions / Snacks */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[10px] font-mono uppercase font-bold text-purple-400 block tracking-wider">
                Snacks & Drinks
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5">
                {tab.orders.length + (associatedStation?.currentSession?.orders.length || 0)}{' '}
                <span className="text-xs text-zinc-500 font-normal">items</span>
              </div>
              <span className="text-[10px] text-purple-400/90 font-mono block mt-0.5">
                {formatCurrency(totalConcessionsCost, settings.currencySymbol)} total
              </span>
            </div>
          </div>

          {/* Section 1: Racked Matches & Frame Losses */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Racked Match Losses & Debt Ledger ({tab.rackLosses.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickRackModal) {
                    onOpenQuickRackModal(tab.playerName);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Rack Loss</span>
              </button>
            </div>

            {tab.rackLosses.length === 0 ? (
              <div className="py-5 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No rack losses recorded for this player yet.
              </div>
            ) : (
              <div className="space-y-2">
                {tab.rackLosses.map((rack, idx) => (
                  <div
                    key={rack.id}
                    className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-amber-400 font-bold text-[11px]">#{idx + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{rack.tableName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                            {rack.gameType}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Opponent: <span className="text-zinc-200 font-medium">{rack.opponentName}</span>
                          {rack.notes && ` • "${rack.notes}"`}
                          <span className="text-zinc-500 font-mono text-[10px] ml-2">
                            {formatTimeOnly(rack.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {formatCurrency(rack.fee, settings.currencySymbol)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRackLoss(tab.id, rack.id)}
                        title="Remove rack entry"
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active Hourly Table / Console Session (if seated) */}
          {associatedStation && associatedStation.currentSession && (
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Live Hourly Table / Console Session
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {associatedStation.name}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-400 font-sans block">
                    Duration: <span className="text-white font-bold">{formatMinutes(elapsedMinutes)}</span> ({formatTimeOnly(associatedStation.currentSession.startTime)} - Live)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Rate: {formatCurrency(associatedStation.hourlyRate, settings.currencySymbol)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">CURRENT TIME CHARGE</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatCurrency(gamingTimeCost, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Concessions & Snack Items Tab */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Concessions & Snack Orders ({tab.orders.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingSnack(!isAddingSnack)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Snack / Drink</span>
              </button>
            </div>

            {/* Snack Quick Selector Form */}
            {isAddingSnack && (
              <form
                onSubmit={handleAddSnackSubmit}
                className="p-3 rounded-xl bg-zinc-900 border border-purple-500/30 flex flex-wrap items-center gap-2 animate-in fade-in"
              >
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 min-w-[160px] bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.imageEmoji} {prod.name} ({formatCurrency(prod.price, settings.currencySymbol)})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-400">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={snackQty}
                    onChange={(e) => setSnackQty(Math.max(1, Number(e.target.value)))}
                    className="w-14 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500 text-white hover:bg-purple-400 transition-colors shadow-sm"
                >
                  Add to Tab
                </button>
              </form>
            )}

            {tab.orders.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                No snacks or drinks ordered on this tab yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {tab.orders.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[11px] text-zinc-400 ml-2">
                        {formatCurrency(item.price, settings.currencySymbol)} × {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-purple-400">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOrderFromPlayerTab(tab.id, item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Direct Checkout & Payment Section (Requested: "the checkout system will moves there") */}
          <div className="p-4.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Direct Checkout & Settlement
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Payable: {formatCurrency(grandTotal, settings.currencySymbol)}
              </span>
            </div>

            {/* Bill Line Items Breakdown */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-1.5">
              {gamingTimeCost > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Hourly Table / Console Time:</span>
                  <span className="text-white">{formatCurrency(gamingTimeCost, settings.currencySymbol)}</span>
                </div>
              )}
              {rackLossesCost > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Racked Match Losses ({tab.rackLosses.length} racks):</span>
                  <span>{formatCurrency(rackLossesCost, settings.currencySymbol)}</span>
                </div>
              )}
              {totalConcessionsCost > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>Snacks & Concessions:</span>
                  <span>{formatCurrency(totalConcessionsCost, settings.currencySymbol)}</span>
                </div>
              )}

              {/* Discount Selector */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Discount:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDiscountChange(discountValue, 'fixed')}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${discountType === 'fixed' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {settings.currencySymbol}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscountChange(discountValue, 'percentage')}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${discountType === 'percentage' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      %
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => handleDiscountChange(Math.max(0, Number(e.target.value)), discountType)}
                      className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-white text-center font-mono"
                    />
                  </div>
                </div>
                {calculatedDiscount > 0 && (
                  <span className="text-emerald-400 font-bold">
                    -{formatCurrency(calculatedDiscount, settings.currencySymbol)}
                  </span>
                )}
              </div>

              {settings.taxRatePercent > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>VAT / Tax ({settings.taxRatePercent}%):</span>
                  <span>{formatCurrency(taxAmount, settings.currencySymbol)}</span>
                </div>
              )}

              <div className="border-t border-zinc-700/80 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="text-base text-emerald-400">
                  {formatCurrency(grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Select Payment Method
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  id="tab-pay-cash-btn"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold">Cash</span>
                </button>

                {/* bKash */}
                <button
                  type="button"
                  id="tab-pay-bkash-btn"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'bkash'
                      ? 'bg-pink-500/20 border-pink-500/60 shadow-[0_0_15px_rgba(236,72,153,0.2)] text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-pink-400" />
                  <span className="text-xs font-bold">bKash</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  id="tab-pay-nagad-btn"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'nagad'
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold">Nagad</span>
                </button>

                {/* Card / Custom */}
                <button
                  type="button"
                  id="tab-pay-custom-btn"
                  onClick={() => setPaymentMethod('custom')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === 'custom'
                      ? 'bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-bold">Card / Custom</span>
                </button>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === 'cash' && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cash Tendered Amount ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={grandTotal}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {cashPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCashReceived(preset)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-lg transition-colors ${
                          cashReceived === preset
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {formatCurrency(preset, settings.currencySymbol)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                  <span className="text-zinc-400">Change to return:</span>
                  <span className="text-base font-mono font-bold text-amber-400">
                    {formatCurrency(cashChange, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            )}

            {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Merchant / Lounge Account:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.phoneOrContact, 'phone')}
                    className="flex items-center gap-1 font-mono text-zinc-200 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700"
                  >
                    <span>{settings.phoneOrContact}</span>
                    {copiedNumber === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      placeholder="e.g. 9HJ72KL89"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Sender Phone Number
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g. 01712-345678"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'custom' && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Card Network / Gateway Reference
                </label>
                <input
                  type="text"
                  value={customPaymentName}
                  onChange={(e) => setCustomPaymentName(e.target.value)}
                  placeholder="e.g. POS Card Terminal #2, Bank Transfer..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Checkout Action */}
            <div className="pt-2">
              <button
                type="button"
                id="tab-complete-checkout-btn"
                onClick={handleFinalCheckout}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Settle & Checkout Tab ({formatCurrency(grandTotal, settings.currencySymbol)})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
