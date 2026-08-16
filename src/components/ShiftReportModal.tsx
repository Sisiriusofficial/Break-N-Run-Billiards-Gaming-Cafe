import React, { useState } from 'react';
import {
  X,
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingBag,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  Percent,
  Search,
  CircleDot,
  Gamepad2,
  Car,
  Tv,
  Eye,
  Trophy,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { CompletedBill, StationCategory } from '../types';
import { useCafe } from '../context/CafeContext';
import {
  formatCurrency,
  formatDateTime,
  formatMinutes,
  formatTimeOnly,
} from '../utils/formatters';
import { ReceiptDetailModal } from './ReceiptDetailModal';

interface ShiftReportModalProps {
  onClose: () => void;
}

export const ShiftReportModal: React.FC<ShiftReportModalProps> = ({ onClose }) => {
  const { completedBills, stations, settings } = useCafe();

  const [receiptSearch, setReceiptSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'receipts'>('overview');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'billiard' | 'ps4_racing' | 'ps4_standard' | 'pandora_box' | 'pos' | 'bkash' | 'nagad' | 'cash'>('all');
  const [selectedReceiptForDetail, setSelectedReceiptForDetail] = useState<CompletedBill | null>(null);

  // Compute shift metrics
  const totalGamingRevenue = completedBills.reduce((sum, b) => sum + b.gamingTimeCost, 0);
  const totalConcessionsRevenue = completedBills.reduce((sum, b) => sum + b.concessionsCost, 0);
  const totalExtraControllers = completedBills.reduce((sum, b) => sum + (b.extraControllersCost || 0), 0);
  const totalDiscounts = completedBills.reduce((sum, b) => sum + b.discountAmount, 0);
  const totalTax = completedBills.reduce((sum, b) => sum + b.taxAmount, 0);
  const totalCollected = completedBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalMinutesPlayed = completedBills.reduce((sum, b) => sum + b.durationMinutes, 0);

  // Payment Breakdown
  const cashCollected = completedBills
    .filter((b) => b.paymentMethod === 'cash')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const bkashCollected = completedBills
    .filter((b) => b.paymentMethod === 'bkash')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const nagadCollected = completedBills
    .filter((b) => b.paymentMethod === 'nagad')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const customCollected = completedBills
    .filter((b) => b.paymentMethod === 'custom' || b.paymentMethod === 'card' || b.paymentMethod === 'digital_wallet' || b.paymentMethod === 'split')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Station-wise metrics
  const stationStats = stations.map((st) => {
    const stationBills = completedBills.filter((b) => b.stationId === st.id);
    const rev = stationBills.reduce((sum, b) => sum + b.gamingTimeCost + (b.extraControllersCost || 0), 0);
    const mins = stationBills.reduce((sum, b) => sum + b.durationMinutes, 0);
    return {
      station: st,
      sessionCount: stationBills.length,
      revenue: rev,
      totalMinutes: mins,
    };
  });

  // Filtered receipts
  const filteredReceipts = completedBills.filter((b) => {
    // Text search query
    const q = receiptSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.receiptNumber.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      (b.customerPhone && b.customerPhone.toLowerCase().includes(q)) ||
      b.stationName.toLowerCase().includes(q) ||
      (b.trxId && b.trxId.toLowerCase().includes(q)) ||
      (b.senderNumber && b.senderNumber.toLowerCase().includes(q)) ||
      (b.customPaymentName && b.customPaymentName.toLowerCase().includes(q)) ||
      (b.billiardMatch &&
        (b.billiardMatch.player1Name.toLowerCase().includes(q) ||
          b.billiardMatch.player2Name.toLowerCase().includes(q)));

    // Category / Payment Filter
    let matchFilter = true;
    if (receiptFilter === 'billiard') {
      matchFilter = b.stationCategory === 'billiard';
    } else if (receiptFilter === 'ps4_racing') {
      matchFilter = b.stationCategory === 'ps4_racing';
    } else if (receiptFilter === 'ps4_standard') {
      matchFilter = b.stationCategory === 'ps4_standard' && b.stationId !== 'pos-direct';
    } else if (receiptFilter === 'pandora_box') {
      matchFilter = b.stationCategory === 'pandora_box';
    } else if (receiptFilter === 'pos') {
      matchFilter = b.stationId === 'pos-direct' || (b.durationMinutes === 0 && b.concessionsCost > 0);
    } else if (receiptFilter === 'bkash') {
      matchFilter = b.paymentMethod === 'bkash';
    } else if (receiptFilter === 'nagad') {
      matchFilter = b.paymentMethod === 'nagad';
    } else if (receiptFilter === 'cash') {
      matchFilter = b.paymentMethod === 'cash';
    }

    return matchSearch && matchFilter;
  });

  // Export CSV
  const exportCSV = () => {
    if (completedBills.length === 0) return;
    const headers = [
      'Receipt #',
      'Date Time',
      'Station',
      'Customer / Payer',
      'Duration (Mins)',
      'Hourly Rate',
      'Gaming Cost',
      'Billiard Match Details',
      'Concessions Cost',
      'Items Ordered',
      'Discount',
      'Tax',
      'Total Amount',
      'Payment Method',
      'TrxID / Reference',
      'Sender Phone',
      'Cash Tendered',
      'Change Returned',
      'Notes',
    ];

    const rows = completedBills.map((b) => {
      const billiardStr = b.billiardMatch
        ? `"${b.billiardMatch.player1Name} (${b.billiardMatch.player1Score}) vs ${b.billiardMatch.player2Name} (${b.billiardMatch.player2Score}) - ${b.billiardMatch.matchType || 'Match'}"`
        : '""';
      const itemsStr = b.orders && b.orders.length > 0
        ? `"${b.orders.map((o) => `${o.name} x${o.quantity}`).join('; ')}"`
        : '""';

      return [
        b.receiptNumber,
        formatDateTime(b.createdAt),
        `"${b.stationName}"`,
        `"${b.customerName}"`,
        b.durationMinutes,
        b.hourlyRate,
        b.gamingTimeCost.toFixed(2),
        billiardStr,
        b.concessionsCost.toFixed(2),
        itemsStr,
        b.discountAmount.toFixed(2),
        b.taxAmount.toFixed(2),
        b.totalAmount.toFixed(2),
        b.paymentMethod === 'custom' ? `"${b.customPaymentName || 'Custom'}"` : b.paymentMethod.toUpperCase(),
        `"${b.trxId || ''}"`,
        `"${b.senderNumber || ''}"`,
        b.cashReceived ? b.cashReceived.toFixed(2) : '',
        b.cashChange ? b.cashChange.toFixed(2) : '',
        `"${b.notes || ''}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Apex_Shift_Receipts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStationIcon = (cat: StationCategory, isDirectPOS?: boolean) => {
    if (isDirectPOS) return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
    switch (cat) {
      case 'billiard':
        return <CircleDot className="w-4 h-4 text-amber-400" />;
      case 'ps4_racing':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'pandora_box':
        return <Tv className="w-4 h-4 text-emerald-400" />;
      case 'ps4_standard':
      default:
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-black/80 my-4 sm:my-8 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Shift Summary & Sales Analytics
                </h2>
                <p className="text-xs text-zinc-400">
                  Live shift register totals, detailed session receipt audits, and payment logs
                </p>
              </div>
            </div>
            <button
              id="close-shift-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation & Export */}
          <div className="px-6 py-3 border-b border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/60 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'overview', label: '📊 Financial Overview' },
                { id: 'stations', label: '🎮 Station Performance' },
                { id: 'receipts', label: `🧾 Receipts History (${completedBills.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`shift-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              id="shift-export-csv-btn"
              onClick={exportCSV}
              disabled={completedBills.length === 0}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 ${
                completedBills.length === 0
                  ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border-zinc-700 shadow-sm active:scale-[0.98]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Audit</span>
            </button>
          </div>

          {/* Tab 1: Financial Overview */}
          {activeTab === 'overview' && (
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Top Revenue Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Total Shift Revenue
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-1">
                    {formatCurrency(totalCollected, settings.currencySymbol)}
                  </div>
                  <span className="text-[10px] text-zinc-500">{completedBills.length} completed transactions</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Hourly Rentals
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-cyan-400 mt-1">
                    {formatCurrency(totalGamingRevenue + totalExtraControllers, settings.currencySymbol)}
                  </div>
                  <span className="text-[10px] text-zinc-500">{formatMinutes(totalMinutesPlayed)} played</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Snacks & Concessions
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-amber-400 mt-1">
                    {formatCurrency(totalConcessionsRevenue, settings.currencySymbol)}
                  </div>
                  <span className="text-[10px] text-zinc-500">Retail drinks & snacks</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Discounts Given
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-zinc-300 mt-1">
                    {formatCurrency(totalDiscounts, settings.currencySymbol)}
                  </div>
                  <span className="text-[10px] text-zinc-500">Promos & customer savings</span>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-white">Payment Method Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-xs text-emerald-400 font-semibold block">💵 Cash</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5 block">
                      {formatCurrency(cashCollected, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {totalCollected > 0 ? `${Math.round((cashCollected / totalCollected) * 100)}%` : '0%'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-xs text-pink-400 font-semibold block">📱 bKash</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5 block">
                      {formatCurrency(bkashCollected, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {totalCollected > 0 ? `${Math.round((bkashCollected / totalCollected) * 100)}%` : '0%'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-xs text-orange-400 font-semibold block">⚡ Nagad</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5 block">
                      {formatCurrency(nagadCollected, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {totalCollected > 0 ? `${Math.round((nagadCollected / totalCollected) * 100)}%` : '0%'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-xs text-cyan-400 font-semibold block">⚙️ Custom / Card</span>
                    <span className="text-base font-mono font-bold text-white mt-0.5 block">
                      {formatCurrency(customCollected, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {totalCollected > 0 ? `${Math.round((customCollected / totalCollected) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Station Performance */}
          {activeTab === 'stations' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-zinc-400">
                Breakdown of occupancy, total minutes played, and revenue earned per table / console:
              </p>

              <div className="space-y-2.5">
                {stationStats.map(({ station, sessionCount, revenue, totalMinutes }) => (
                  <div
                    key={station.id}
                    className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 flex items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{station.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                        <span>Rate: {formatCurrency(station.hourlyRate, settings.currencySymbol)}/hr</span>
                        <span>•</span>
                        <span>{sessionCount} sessions</span>
                        <span>•</span>
                        <span>Total Time: {formatMinutes(totalMinutes)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-zinc-400 block">Total Revenue</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                        {formatCurrency(revenue, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Receipts History (Enhanced with full Session Audit & Filters) */}
          {activeTab === 'receipts' && (
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Search bar & quick filter pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={receiptSearch}
                    onChange={(e) => setReceiptSearch(e.target.value)}
                    placeholder="Search by Receipt #, Customer/Player name, Station, TrxID, Phone number..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  {receiptSearch && (
                    <button
                      onClick={() => setReceiptSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sub-Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {[
                    { id: 'all', label: 'All Receipts' },
                    { id: 'billiard', label: '🎱 Billiards Matches' },
                    { id: 'ps4_racing', label: '🏎️ PS4 Racing' },
                    { id: 'ps4_standard', label: '🎮 PS4 Consoles' },
                    { id: 'pandora_box', label: '🕹️ Pandora Arcade' },
                    { id: 'pos', label: '🍿 Walk-in Snacks' },
                    { id: 'bkash', label: '📱 bKash MFS' },
                    { id: 'nagad', label: '⚡ Nagad MFS' },
                    { id: 'cash', label: '💵 Cash' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setReceiptFilter(f.id as typeof receiptFilter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                        receiptFilter === f.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary of matching results */}
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
                <span>
                  Showing {filteredReceipts.length} of {completedBills.length} completed receipts
                </span>
                {filteredReceipts.length > 0 && (
                  <span>
                    Subtotal:{' '}
                    <strong className="text-emerald-400">
                      {formatCurrency(
                        filteredReceipts.reduce((sum, b) => sum + b.totalAmount, 0),
                        settings.currencySymbol
                      )}
                    </strong>
                  </span>
                )}
              </div>

              {/* Receipt Cards List */}
              {filteredReceipts.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 space-y-2">
                  <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">No matching completed receipts found.</p>
                  <button
                    onClick={() => {
                      setReceiptSearch('');
                      setReceiptFilter('all');
                    }}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredReceipts.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700/90 transition-all space-y-2.5 shadow-sm group"
                    >
                      {/* Top Row: Receipt number, Station badge, Time & Total */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-cyan-400">
                            {bill.receiptNumber}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-semibold">
                            {getStationIcon(bill.stationCategory, bill.stationId === 'pos-direct')}
                            <span>{bill.stationName}</span>
                          </span>

                          {/* Payment method badge */}
                          {bill.paymentMethod === 'bkash' && (
                            <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/30 text-[10px] font-mono font-semibold">
                              bKash {bill.trxId ? `• ${bill.trxId}` : ''}
                            </span>
                          )}
                          {bill.paymentMethod === 'nagad' && (
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-mono font-semibold">
                              Nagad {bill.trxId ? `• ${bill.trxId}` : ''}
                            </span>
                          )}
                          {bill.paymentMethod === 'cash' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
                              Cash
                            </span>
                          )}
                          {bill.paymentMethod === 'custom' && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-semibold">
                              {bill.customPaymentName || 'Custom'} {bill.trxId ? `• ${bill.trxId}` : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="text-lg font-mono font-black text-emerald-400">
                            {formatCurrency(bill.totalAmount, settings.currencySymbol)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Session Detail Breakdown */}
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-xs space-y-1.5">
                        
                        {/* Customer & Time metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300">
                          <div>
                            <span className="font-semibold text-white">Customer / Payer: </span>
                            <span className="text-cyan-300 font-bold">{bill.customerName}</span>
                            {bill.customerPhone && (
                              <span className="text-zinc-500 font-mono text-[11px] ml-1.5">
                                ({bill.customerPhone})
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-zinc-400 font-mono">
                            {formatDateTime(bill.createdAt)}
                          </div>
                        </div>

                        {/* Gaming calculation formula */}
                        {bill.durationMinutes > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 font-mono">
                            <span className="text-zinc-200">
                              Duration: <strong className="text-cyan-400">{formatMinutes(bill.durationMinutes)}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Rate: {formatCurrency(bill.hourlyRate, settings.currencySymbol)}/hr
                            </span>
                            <span>•</span>
                            <span>
                              Time Cost: {formatCurrency(bill.gamingTimeCost, settings.currencySymbol)}
                            </span>
                            {bill.orders && bill.orders.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400">
                                  {bill.orders.length} snack item(s) ({formatCurrency(bill.concessionsCost, settings.currencySymbol)})
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-400 font-mono">
                            Direct POS Sale • {bill.orders?.length || 0} items ({formatCurrency(bill.concessionsCost, settings.currencySymbol)})
                          </div>
                        )}

                        {/* Billiard Match Banner if exists */}
                        {bill.billiardMatch && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-1.5 text-amber-200">
                              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                <strong>{bill.billiardMatch.player1Name}</strong> ({bill.billiardMatch.player1Score}) vs{' '}
                                <strong>{bill.billiardMatch.player2Name}</strong> ({bill.billiardMatch.player2Score})
                              </span>
                              <span className="text-amber-400/70 font-mono">• {bill.billiardMatch.matchType || 'Match'}</span>
                            </div>
                            {bill.billiardMatch.winner && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-zinc-950">
                                Winner:{' '}
                                {bill.billiardMatch.winner === 'player1'
                                  ? bill.billiardMatch.player1Name
                                  : bill.billiardMatch.player2Name}
                              </span>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-zinc-500 font-mono truncate">
                          {bill.senderNumber ? `Sender: ${bill.senderNumber}` : ''}
                          {bill.notes ? ` • Note: ${bill.notes}` : ''}
                        </div>

                        <button
                          id={`inspect-receipt-${bill.id}`}
                          onClick={() => setSelectedReceiptForDetail(bill)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all group-hover:border-cyan-400 active:scale-95 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Session Audit</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Full Detailed Session Receipt Inspector Modal */}
      {selectedReceiptForDetail && (
        <ReceiptDetailModal
          bill={selectedReceiptForDetail}
          onClose={() => setSelectedReceiptForDetail(null)}
        />
      )}
    </>
  );
};
