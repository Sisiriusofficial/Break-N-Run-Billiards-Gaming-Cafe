import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Calendar,
  Clock,
  CircleDot,
  Gamepad2,
  Car,
  Tv,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Tag,
  FileText,
  User,
  Phone,
  HelpCircle,
  Trophy,
  Layers,
  Percent,
} from 'lucide-react';
import { CompletedBill, StationCategory } from '../types';
import { useCafe } from '../context/CafeContext';
import {
  formatCurrency,
  formatDateTime,
  formatMinutes,
  formatTimeOnly,
} from '../utils/formatters';

interface ReceiptDetailModalProps {
  bill: CompletedBill | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({ bill, onClose }) => {
  const { settings } = useCafe();
  const [copied, setCopied] = useState(false);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentLabel = (b: CompletedBill) => {
    switch (b.paymentMethod) {
      case 'bkash':
        return `bKash MFS${b.trxId ? ` (TrxID: ${b.trxId})` : ''}`;
      case 'nagad':
        return `Nagad MFS${b.trxId ? ` (TrxID: ${b.trxId})` : ''}`;
      case 'custom':
        return `${b.customPaymentName || 'Card / Custom'}${b.trxId ? ` (Ref: ${b.trxId})` : ''}`;
      case 'cash':
      default:
        return 'Cash';
    }
  };

  const getFullAuditText = (b: CompletedBill) => {
    const lines = [
      `========================================`,
      `   ${settings.cafeName.toUpperCase()}`,
      `   ${settings.cafeTagline}`,
      `   Contact: ${settings.phoneOrContact}`,
      `========================================`,
      `RECEIPT NUMBER: ${b.receiptNumber}`,
      `DATE & TIME:    ${formatDateTime(b.createdAt)}`,
      `STATION:        ${b.stationName}`,
      `CUSTOMER:       ${b.customerName}`,
    ];

    if (b.customerPhone) {
      lines.push(`PHONE:          ${b.customerPhone}`);
    }

    lines.push(`----------------------------------------`);
    lines.push(`SESSION DURATION: ${formatMinutes(b.durationMinutes)}`);
    lines.push(`START TIME:       ${formatTimeOnly(b.startTime)}`);
    lines.push(`END TIME:         ${formatTimeOnly(b.endTime)}`);
    lines.push(`HOURLY RATE:      ${formatCurrency(b.hourlyRate, settings.currencySymbol)}/hour`);
    lines.push(`TIMING CHARGE:    ${formatCurrency(b.gamingTimeCost, settings.currencySymbol)}`);

    if (b.billiardMatch) {
      lines.push(`----------------------------------------`);
      lines.push(`BILLIARDS MATCH SCOREBOARD:`);
      lines.push(`  Match Type:   ${b.billiardMatch.matchType || 'Open Match'}`);
      lines.push(`  Player 1:     ${b.billiardMatch.player1Name || 'P1'} (${b.billiardMatch.player1Score} frames)`);
      lines.push(`  Player 2:     ${b.billiardMatch.player2Name || 'P2'} (${b.billiardMatch.player2Score} frames)`);
      if (b.billiardMatch.winner) {
        const winnerName =
          b.billiardMatch.winner === 'player1'
            ? b.billiardMatch.player1Name || 'Player 1'
            : b.billiardMatch.player2Name || 'Player 2';
        lines.push(`  Winner:       ${winnerName}`);
      }
      lines.push(`  Billed To:    ${b.customerName} ${b.billiardMatch.loserPays ? '(Loser Pays Rule)' : ''}`);
    }

    if (b.rackLosses && b.rackLosses.length > 0) {
      lines.push(`----------------------------------------`);
      lines.push(`BILLIARDS RACK LOSSES / MATCHES LEDGER (${b.rackLosses.length} racks):`);
      b.rackLosses.forEach((r, idx) => {
        lines.push(`  ${idx + 1}. ${r.tableName} • vs ${r.opponentName} • ${r.gameType} : ${formatCurrency(r.fee, settings.currencySymbol)}`);
      });
      lines.push(`  Rack Losses Total: ${formatCurrency(b.rackFeeCost || 0, settings.currencySymbol)}`);
    }

    if (b.orders && b.orders.length > 0) {
      lines.push(`----------------------------------------`);
      lines.push(`CONCESSIONS & SNACKS:`);
      b.orders.forEach((o) => {
        lines.push(`  • ${o.name} x${o.quantity} @ ${formatCurrency(o.price, settings.currencySymbol)} = ${formatCurrency(o.price * o.quantity, settings.currencySymbol)}`);
      });
      lines.push(`  Concessions Subtotal: ${formatCurrency(b.concessionsCost, settings.currencySymbol)}`);
    }

    if (b.discountAmount > 0) {
      lines.push(`----------------------------------------`);
      lines.push(`DISCOUNT APPLIED: -${formatCurrency(b.discountAmount, settings.currencySymbol)}`);
    }

    if (b.taxAmount > 0) {
      lines.push(`TAX (${settings.taxRatePercent}%): ${formatCurrency(b.taxAmount, settings.currencySymbol)}`);
    }

    lines.push(`========================================`);
    lines.push(`GRAND TOTAL DUE:  ${formatCurrency(b.totalAmount, settings.currencySymbol)}`);
    lines.push(`PAYMENT METHOD:   ${getPaymentLabel(b)}`);

    if (b.paymentMethod === 'bkash' || b.paymentMethod === 'nagad' || b.trxId) {
      if (b.trxId) lines.push(`TRANSACTION ID:   ${b.trxId}`);
      if (b.senderNumber) lines.push(`SENDER PHONE:     ${b.senderNumber}`);
    }

    if (b.paymentMethod === 'cash' && b.cashReceived) {
      lines.push(`CASH TENDERED:    ${formatCurrency(b.cashReceived, settings.currencySymbol)}`);
      lines.push(`CHANGE RETURNED:  ${formatCurrency(b.cashChange || 0, settings.currencySymbol)}`);
    }

    if (b.notes) {
      lines.push(`----------------------------------------`);
      lines.push(`NOTES: ${b.notes}`);
    }

    lines.push(`========================================`);
    lines.push(`${settings.receiptFooterMessage}`);
    lines.push(`========================================`);

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = getFullAuditText(bill);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStationCategoryBadge = (category: StationCategory) => {
    switch (category) {
      case 'billiard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CircleDot className="w-3.5 h-3.5" />
            9ft Billiards Table
          </span>
        );
      case 'ps4_racing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Car className="w-3.5 h-3.5" />
            PS4 Racing Sim Rig
          </span>
        );
      case 'pandora_box':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Tv className="w-3.5 h-3.5" />
            Pandora Box Arcade
          </span>
        );
      case 'ps4_standard':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Gamepad2 className="w-3.5 h-3.5" />
            PS4 Console
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 my-4 sm:my-8 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Session Receipt Audit & Breakdown
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {bill.receiptNumber}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Complete transparency breakdown of time, billing formula, player scores & snacks
              </p>
            </div>
          </div>

          <button
            id="receipt-detail-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Quick Status Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-white">{bill.customerName}</span>
                {getStationCategoryBadge(bill.stationCategory)}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formatDateTime(bill.createdAt)}</span>
                {bill.customerPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      {bill.customerPhone}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block tracking-wider">
                Total Paid
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400">
                {formatCurrency(bill.totalAmount, settings.currencySymbol)}
              </span>
              <span className="text-[11px] text-zinc-400 block font-medium">
                Via {bill.paymentMethod.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Section 1: Session Timeline & Hourly Rate Formula */}
          <div className="p-4.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Time Calculation & Station Rate
              </h3>
              <span className="text-xs font-mono font-semibold text-zinc-400">
                {bill.stationName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono block">START TIME</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                  {formatTimeOnly(bill.startTime)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono block">END / CHECKOUT</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                  {formatTimeOnly(bill.endTime)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono block">TOTAL DURATION</span>
                <span className="text-xs font-bold text-cyan-400 font-mono mt-0.5 block">
                  {formatMinutes(bill.durationMinutes)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono block">HOURLY RATE</span>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">
                  {formatCurrency(bill.hourlyRate, settings.currencySymbol)}/hr
                </span>
              </div>
            </div>

            {/* Formula Explanation box */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <div className="text-zinc-300">
                <span className="text-zinc-500 font-sans text-[11px] block">Rate Formula Applied:</span>
                <span>
                  {bill.durationMinutes} mins × ({formatCurrency(bill.hourlyRate, settings.currencySymbol)} ÷ 60)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">TIME CHARGE</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Billiards Match Details (If Billiards match occurred) */}
          {bill.billiardMatch && (
            <div className="p-4.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Billiards Match & Scorecard Details
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {bill.billiardMatch.matchType || 'Match Play'}
                </span>
              </div>

              {/* Match Score comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    bill.billiardMatch.winner === 'player1'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Player 1 {bill.billiardMatch.winner === 'player1' && '🏆 WINNER'}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {bill.billiardMatch.player1Name || 'Player 1'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-amber-400">
                    {bill.billiardMatch.player1Score}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    bill.billiardMatch.winner === 'player2'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Player 2 {bill.billiardMatch.winner === 'player2' && '🏆 WINNER'}
                    </span>
                    <span className="font-bold text-sm text-white">
                      {bill.billiardMatch.player2Name || 'Player 2'}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-amber-400">
                    {bill.billiardMatch.player2Score}
                  </div>
                </div>
              </div>

              {/* Loser pays explanation banner */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-zinc-300 space-y-0.5">
                  <p className="font-semibold text-white">
                    Payer Attribution:{' '}
                    <span className="text-amber-300">{bill.customerName}</span>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {bill.billiardMatch.loserPays
                      ? `The session was played under the standard "Loser Pays" rule. When ${
                          bill.billiardMatch.winner === 'player1'
                            ? bill.billiardMatch.player1Name || 'Player 1'
                            : bill.billiardMatch.player2Name || 'Player 2'
                        } won the race, the full table and snacks tab was assigned to the losing player.`
                      : `The match tab was settled by ${bill.customerName}.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2.5: Billiards Rack Losses Breakdown (if any recorded) */}
          {bill.rackLosses && bill.rackLosses.length > 0 && (
            <div className="p-4.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <CircleDot className="w-4 h-4 text-amber-400" />
                  Racked Match Losses Ledger ({bill.rackLosses.length} racks)
                </h3>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {formatCurrency(bill.rackFeeCost || 0, settings.currencySymbol)}
                </span>
              </div>

              <div className="space-y-2">
                {bill.rackLosses.map((rack, idx) => (
                  <div
                    key={rack.id || idx}
                    className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono text-[11px] font-bold">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{rack.tableName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {rack.gameType}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Opponent: <span className="text-zinc-200">{rack.opponentName}</span>
                          {rack.notes && ` • "${rack.notes}"`} • {formatTimeOnly(rack.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 block text-xs">
                        {formatCurrency(rack.fee, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Concessions & Snack Items (if any) */}
          {bill.orders && bill.orders.length > 0 && (
            <div className="p-4.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  Itemized Concessions & Snack Tab ({bill.orders.length} items)
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatCurrency(bill.concessionsCost, settings.currencySymbol)}
                </span>
              </div>

              <div className="space-y-2">
                {bill.orders.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono text-[11px]">#{idx + 1}</span>
                      <div>
                        <span className="font-bold text-white">{item.name}</span>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Unit Price: {formatCurrency(item.price, settings.currencySymbol)} • Ordered at {formatTimeOnly(item.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-zinc-300 text-xs">
                        × {item.quantity}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 block text-xs">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Comprehensive Cost & Payment Breakdown */}
          <div className="p-4.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-cyan-400" />
              Invoice Calculation & Payment Verification
            </h3>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Gaming / Table Time Charge:</span>
                <span className="text-zinc-200">
                  {formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}
                </span>
              </div>

              {(bill.rackFeeCost || 0) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Billiards Rack Losses Total ({bill.rackLosses?.length || 0} racks):</span>
                  <span className="font-bold">
                    {formatCurrency(bill.rackFeeCost || 0, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {bill.concessionsCost > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Concessions & Snacks Subtotal:</span>
                  <span className="text-zinc-200">
                    {formatCurrency(bill.concessionsCost, settings.currencySymbol)}
                  </span>
                </div>
              )}

              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Savings Applied:</span>
                  <span>-{formatCurrency(bill.discountAmount, settings.currencySymbol)}</span>
                </div>
              )}

              {bill.taxAmount > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Tax / VAT ({settings.taxRatePercent}%):</span>
                  <span className="text-zinc-200">
                    {formatCurrency(bill.taxAmount, settings.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Final Amount Paid:</span>
                <span className="text-base text-emerald-400">
                  {formatCurrency(bill.totalAmount, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Payment Method Details Box */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Payment Gateway / Mode:</span>
                <span className="font-bold text-white uppercase flex items-center gap-1">
                  {bill.paymentMethod === 'bkash' && '📱 bKash MFS'}
                  {bill.paymentMethod === 'nagad' && '⚡ Nagad MFS'}
                  {bill.paymentMethod === 'cash' && '💵 Cash Tendered'}
                  {bill.paymentMethod === 'custom' && `⚙️ ${bill.customPaymentName || 'Custom / Card'}`}
                </span>
              </div>

              {bill.trxId && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-zinc-400">Transaction ID (TrxID):</span>
                  <span className="font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/30">
                    {bill.trxId}
                  </span>
                </div>
              )}

              {bill.senderNumber && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-zinc-400">Sender Phone / Account:</span>
                  <span className="text-zinc-200">{bill.senderNumber}</span>
                </div>
              )}

              {bill.paymentMethod === 'cash' && bill.cashReceived && (
                <>
                  <div className="flex items-center justify-between font-mono text-zinc-400">
                    <span>Cash Tendered:</span>
                    <span className="text-zinc-200">
                      {formatCurrency(bill.cashReceived, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-zinc-400">
                    <span>Change Returned:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatCurrency(bill.cashChange || 0, settings.currencySymbol)}
                    </span>
                  </div>
                </>
              )}

              {bill.notes && (
                <div className="border-t border-zinc-800/80 pt-1.5 mt-1.5">
                  <span className="text-[10px] text-zinc-500 block">SESSION AUDIT NOTE:</span>
                  <p className="text-zinc-300 italic text-[11px]">{bill.notes}</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer / Actions */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/95 flex items-center justify-between gap-3 shrink-0">
          <button
            id="receipt-copy-audit-btn"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Audit Text (SMS / WhatsApp)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              id="receipt-print-btn"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
