import React, { useState } from 'react';
import {
  X,
  Clock,
  Coffee,
  Trash2,
  Plus,
  Minus,
  Percent,
  Receipt,
  Pause,
  Play,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  User,
  Swords,
  Trophy,
} from 'lucide-react';
import { Station } from '../types';
import { useCafe } from '../context/CafeContext';
import {
  computeSessionState,
  formatCurrency,
  formatSecondsToTimer,
  formatTimeOnly,
} from '../utils/formatters';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  onOpenCheckout: (station: Station) => void;
  onOpenTransfer: (station: Station) => void;
  onOpenSnackPOS: (station: Station) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onOpenCheckout,
  onOpenTransfer,
  onOpenSnackPOS,
}) => {
  const {
    settings,
    currentTime,
    addMinutesToSession,
    togglePauseSession,
    removeOrderFromSession,
    updateSessionDiscount,
    cancelSession,
    updateBilliardScore,
    setBilliardPayer,
  } = useCafe();

  const [discountVal, setDiscountVal] = useState<string>('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!station || !station.currentSession) return null;

  const session = station.currentSession;
  const state = computeSessionState(session, station.hourlyRate, settings, currentTime);

  const handleApplyDiscount = () => {
    const num = parseFloat(discountVal);
    if (!isNaN(num) && num >= 0) {
      updateSessionDiscount(station.id, num, discountType);
    }
  };

  const handleClearDiscount = () => {
    setDiscountVal('');
    updateSessionDiscount(station.id, 0, 'fixed');
  };

  const handleConfirmCancel = () => {
    cancelSession(station.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black/80 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${state.isPaused ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse'}`}></span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Tab: {station.name}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Customer: <span className="text-white font-medium">{session.customerName}</span> {session.customerPhone && `(${session.customerPhone})`} • Start {formatTimeOnly(session.startTime)}
            </p>
          </div>
          <button
            id="close-tab-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Duration</span>
              <div className="text-base font-mono font-bold text-white mt-0.5">
                {formatSecondsToTimer(state.elapsedSeconds)}
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {session.billingMode === 'prepaid' ? `${session.allocatedMinutes}m limit` : 'Open Count-Up'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Table Rate</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                {formatCurrency(state.gamingTimeCost, settings.currencySymbol)}
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                @{formatCurrency(station.hourlyRate, settings.currencySymbol)}/hr
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Snacks & Concessions</span>
              <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                {formatCurrency(state.concessionsCost, settings.currencySymbol)}
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {session.orders.length} items
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="text-[10px] uppercase font-bold text-emerald-300">Total Accrued</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                {formatCurrency(state.grandTotal, settings.currencySymbol)}
              </div>
              <span className="text-[10px] font-mono text-emerald-300/80">
                {session.discountAmount > 0 ? `-${formatCurrency(state.discountValue, settings.currencySymbol)} disc` : 'Current Tab'}
              </span>
            </div>
          </div>

          {/* Billiard Match Panel if present */}
          {session.billiardMatch && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">
                    Billiards Match Management {session.billiardMatch.raceTo ? `(Race to ${session.billiardMatch.raceTo})` : ''}
                  </span>
                </div>
                {session.billiardMatch.loserPays && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    🏆 Loser Pays Mode
                  </span>
                )}
              </div>

              {/* Player Score Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Player 1 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  session.billiardMatch.winner === 'player1'
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {session.billiardMatch.winner === 'player1' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{session.billiardMatch.player1Name}</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {session.billiardMatch.player1Score} racks won
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      onClick={() => updateBilliardScore(station.id, 'player1', -1)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Minus 1 rack"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateBilliardScore(station.id, 'player1', 1)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors shadow-xs"
                      title="Add 1 rack"
                    >
                      +1 Win
                    </button>
                  </div>
                </div>

                {/* Player 2 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  session.billiardMatch.winner === 'player2'
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {session.billiardMatch.winner === 'player2' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{session.billiardMatch.player2Name}</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {session.billiardMatch.player2Score} racks won
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      onClick={() => updateBilliardScore(station.id, 'player2', -1)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Minus 1 rack"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateBilliardScore(station.id, 'player2', 1)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors shadow-xs"
                      title="Add 1 rack"
                    >
                      +1 Win
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Controls */}
          <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Session Time Controls
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="tab-pause-toggle-btn"
                  onClick={() => togglePauseSession(station.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    state.isPaused
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  {state.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{state.isPaused ? 'Resume Timer' : 'Pause Timer'}</span>
                </button>
              </div>
            </div>

            {/* Add time buttons */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] text-zinc-400 font-sans">Add Time:</span>
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => addMinutesToSession(station.id, mins)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 hover:border-cyan-500/40 transition-colors"
                >
                  +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Concessions & Orders Tab */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-400" />
                Snacks, Drinks & Extras Tab
              </span>
              <button
                id="tab-add-snack-btn"
                onClick={() => {
                  onClose();
                  onOpenSnackPOS(station);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Snack to Tab</span>
              </button>
            </div>

            {session.orders.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No concessions added to this session yet. Click "Add Snack to Tab" above.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {session.orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-white truncate block">{order.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {formatCurrency(order.price, settings.currencySymbol)} x {order.quantity} = {formatCurrency(order.price * order.quantity, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(order.price * order.quantity, settings.currencySymbol)}
                      </span>
                      <button
                        onClick={() => removeOrderFromSession(station.id, order.id)}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount Section */}
          <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              Apply Discount / Promo
            </span>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-2.5 py-1 text-xs font-bold ${
                    discountType === 'fixed' ? 'bg-emerald-500 text-zinc-950 shadow-xs' : 'text-zinc-400'
                  }`}
                >
                  {settings.currencySymbol} Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2.5 py-1 text-xs font-bold ${
                    discountType === 'percentage' ? 'bg-emerald-500 text-zinc-950 shadow-xs' : 'text-zinc-400'
                  }`}
                >
                  % Off
                </button>
              </div>

              <input
                type="number"
                min="0"
                step="0.5"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder={discountType === 'fixed' ? 'e.g. 50' : 'e.g. 10'}
                className="w-24 px-3 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-cyan-500"
              />

              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
              >
                Apply
              </button>

              {session.discountAmount > 0 && (
                <button
                  type="button"
                  onClick={handleClearDiscount}
                  className="text-xs text-red-400 hover:underline font-mono"
                >
                  Remove Discount
                </button>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            <div>
              {!showCancelConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Void / Cancel Session</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-semibold">Confirm void?</span>
                  <button
                    onClick={handleConfirmCancel}
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                  >
                    Yes, Void
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTransfer(station);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Move Station</span>
              </button>

              <button
                type="button"
                id="tab-proceed-checkout-btn"
                onClick={() => {
                  onClose();
                  onOpenCheckout(station);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-zinc-950 shadow-[0_0_15px_rgba(20,184,166,0.3)] flex items-center gap-2 active:scale-[0.98] transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>Proceed to Checkout</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
