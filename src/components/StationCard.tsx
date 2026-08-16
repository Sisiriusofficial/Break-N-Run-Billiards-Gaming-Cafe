import React from 'react';
import {
  Gamepad2,
  Car,
  Tv,
  CircleDot,
  Play,
  Pause,
  Plus,
  Clock,
  Coffee,
  ArrowRightLeft,
  Receipt,
  AlertTriangle,
  Flame,
  Info,
  Trophy,
  Swords,
} from 'lucide-react';
import { Station } from '../types';
import { useCafe } from '../context/CafeContext';
import {
  computeSessionState,
  formatCurrency,
  formatSecondsToTimer,
  formatTimeOnly,
} from '../utils/formatters';

interface StationCardProps {
  station: Station;
  onOpenStartModal: (station: Station) => void;
  onOpenDetailModal: (station: Station) => void;
  onOpenCheckoutModal: (station: Station) => void;
  onOpenTransferModal: (station: Station) => void;
  onOpenSnackPOSForStation: (station: Station) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onOpenStartModal,
  onOpenDetailModal,
  onOpenCheckoutModal,
  onOpenTransferModal,
  onOpenSnackPOSForStation,
}) => {
  const {
    settings,
    currentTime,
    togglePauseSession,
    addMinutesToSession,
    updateBilliardScore,
  } = useCafe();

  const session = station.currentSession;
  const isOccupied = !!session;

  const sessionState = session
    ? computeSessionState(session, station.hourlyRate, settings, currentTime)
    : null;

  // Icon mapping
  const renderIcon = () => {
    switch (station.iconType) {
      case 'racing':
        return <Car className="w-5 h-5 text-cyan-400" />;
      case 'arcade':
        return <Tv className="w-5 h-5 text-amber-400" />;
      case 'billiard':
        return <CircleDot className="w-5 h-5 text-emerald-400" />;
      case 'gamepad':
      default:
        return <Gamepad2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getCategoryBadge = () => {
    switch (station.category) {
      case 'ps4_racing':
        return { label: 'Steering Wheel Rig', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'pandora_box':
        return { label: '3000+ Arcade DX', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'billiard':
        return { label: '9ft Pro Pool', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'ps4_standard':
      default:
        return { label: 'PS4 Console', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    }
  };

  const catBadge = getCategoryBadge();

  // Status badge logic
  let statusBadge = (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_6px_rgba(52,211,153,1)]"></span>
      AVAILABLE
    </span>
  );

  if (isOccupied && sessionState) {
    if (sessionState.isPaused) {
      statusBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.2)] animate-pulse">
          <Pause className="w-3 h-3 mr-1" />
          PAUSED
        </span>
      );
    } else if (sessionState.isExpired) {
      statusBadge = (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce">
          <AlertTriangle className="w-3 h-3 mr-1" />
          TIME EXPIRED
        </span>
      );
    } else if (sessionState.isWarning) {
      statusBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          &lt;5 MINS LEFT
        </span>
      );
    } else {
      statusBadge = (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
          <Flame className="w-3 h-3 mr-1 text-cyan-400" />
          IN SESSION
        </span>
      );
    }
  }

  // Border glow styling based on state
  let cardBorder = 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/80 backdrop-blur-md shadow-lg shadow-black/30';
  if (isOccupied && sessionState) {
    if (sessionState.isExpired) {
      cardBorder = 'border-red-500 ring-2 ring-red-500/40 bg-zinc-900 shadow-[0_0_25px_rgba(239,68,68,0.25)]';
    } else if (sessionState.isWarning) {
      cardBorder = 'border-amber-500 ring-1 ring-amber-500/40 bg-zinc-900 shadow-[0_0_20px_rgba(251,191,36,0.2)]';
    } else if (sessionState.isPaused) {
      cardBorder = 'border-amber-700/60 bg-zinc-900/90';
    } else {
      cardBorder = 'border-cyan-500/50 ring-1 ring-cyan-500/20 bg-zinc-900/90 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
    }
  }

  return (
    <div
      id={`station-card-${station.id}`}
      className={`rounded-2xl border ${cardBorder} p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-zinc-800/90 border border-zinc-700/60 shrink-0">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                {station.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${catBadge.color}`}>
                  {catBadge.label}
                </span>
                <span className="text-[11px] font-mono font-semibold text-zinc-400">
                  {formatCurrency(station.hourlyRate, settings.currencySymbol)}/hr
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">{statusBadge}</div>
        </div>

        {/* Available State Content */}
        {!isOccupied && (
          <div className="my-3 py-2 border-y border-zinc-800/80">
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {station.description}
            </p>
          </div>
        )}

        {/* Active Session Content */}
        {isOccupied && session && sessionState && (
          <div className="my-3 py-2 border-y border-zinc-800/80 space-y-3">
            {/* Customer & Start info */}
            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className="text-zinc-400 text-[11px]">Customer: </span>
                <span className="font-bold text-white truncate">{session.customerName}</span>
                {session.customerPhone && (
                  <span className="text-zinc-500 font-mono text-[10px] block truncate">
                    {session.customerPhone}
                  </span>
                )}
              </div>
              <div className="text-right text-[11px] text-zinc-400 font-mono">
                <span>Start: {formatTimeOnly(session.startTime)}</span>
                <span className="block text-[10px] uppercase font-semibold text-zinc-400">
                  {session.billingMode === 'prepaid' ? 'Prepaid' : 'Postpaid'}
                </span>
              </div>
            </div>

            {/* Live Timer Display & Bill Amount */}
            <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {session.billingMode === 'prepaid' ? 'Remaining Time' : 'Elapsed Time'}
                </div>
                <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight mt-0.5">
                  {session.billingMode === 'prepaid'
                    ? sessionState.isExpired
                      ? `+${formatSecondsToTimer(sessionState.elapsedSeconds - (session.allocatedMinutes || 0) * 60)}`
                      : formatSecondsToTimer(sessionState.remainingSeconds)
                    : formatSecondsToTimer(sessionState.elapsedSeconds)}
                </div>
                {session.billingMode === 'prepaid' && (
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    Elapsed: {formatSecondsToTimer(sessionState.elapsedSeconds)} / {session.allocatedMinutes}m
                  </div>
                )}
              </div>

              {/* Accrued Live Total */}
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Accrued Bill
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 font-mono">
                  {formatCurrency(sessionState.grandTotal, settings.currencySymbol)}
                </div>
                {session.orders.length > 0 && (
                  <span className="inline-block text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 font-mono">
                    +{session.orders.reduce((sum, o) => sum + o.quantity, 0)} snacks
                  </span>
                )}
              </div>
            </div>

            {/* Billiard Match Live Scoreboard Card */}
            {session.billiardMatch && (
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <Swords className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{session.billiardMatch.raceTo ? `Race to ${session.billiardMatch.raceTo}` : 'Billiards Match'}</span>
                  </div>
                  {session.billiardMatch.loserPays && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      Loser Pays Tab
                    </span>
                  )}
                </div>

                {/* Scoreboard Players */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                  {/* Player 1 */}
                  <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                    session.billiardMatch.winner === 'player1'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  }`}>
                    <div className="min-w-0 pr-1">
                      <div className="text-[11px] font-bold truncate flex items-center gap-1">
                        {session.billiardMatch.winner === 'player1' && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="truncate">{session.billiardMatch.player1Name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">Racks: {session.billiardMatch.player1Score}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateBilliardScore(station.id, 'player1', 1)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-cyan-400 text-xs font-bold transition-colors font-mono"
                      title="Add Rack Win"
                    >
                      +1
                    </button>
                  </div>

                  {/* Player 2 */}
                  <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                    session.billiardMatch.winner === 'player2'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                  }`}>
                    <div className="min-w-0 pr-1">
                      <div className="text-[11px] font-bold truncate flex items-center gap-1">
                        {session.billiardMatch.winner === 'player2' && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="truncate">{session.billiardMatch.player2Name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">Racks: {session.billiardMatch.player2Score}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateBilliardScore(station.id, 'player2', 1)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-cyan-400 text-xs font-bold transition-colors font-mono"
                      title="Add Rack Win"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Match Status / Winner / Loser indicator */}
                <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5">
                  {session.billiardMatch.winner ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      🎉 Won by {session.billiardMatch.winner === 'player1' ? session.billiardMatch.player1Name : session.billiardMatch.player2Name} ({session.billiardMatch.player1Score}-{session.billiardMatch.player2Score})
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      Score: {session.billiardMatch.player1Score} - {session.billiardMatch.player2Score}
                      {session.billiardMatch.raceTo && ` (First to ${session.billiardMatch.raceTo})`}
                    </span>
                  )}

                  {session.billiardMatch.loserPays && session.billiardMatch.winner && (
                    <span className="text-amber-400 font-bold font-mono">
                      Payer: {session.billiardMatch.winner === 'player1' ? session.billiardMatch.player2Name : session.billiardMatch.player1Name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Prepaid Progress Bar */}
            {session.billingMode === 'prepaid' && (
              <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    sessionState.isExpired
                      ? 'bg-red-500 w-full shadow-[0_0_8px_rgba(239,68,68,1)]'
                      : sessionState.isWarning
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]'
                      : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                  }`}
                  style={{ width: `${sessionState.percentElapsed}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Action Buttons Area */}
      <div>
        {!isOccupied ? (
          /* Available State Button */
          <button
            id={`start-session-btn-${station.id}`}
            onClick={() => onOpenStartModal(station)}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Session</span>
          </button>
        ) : (
          /* Active State Action Controls */
          <div className="space-y-2">
            {/* Quick Extension Pills for Prepaid */}
            {session && session.billingMode === 'prepaid' && (
              <div className="grid grid-cols-3 gap-1.5 text-zinc-300 font-mono">
                <button
                  id={`add-15m-btn-${station.id}`}
                  onClick={() => addMinutesToSession(station.id, 15)}
                  className="py-1 px-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-cyan-500/40 transition-colors text-center"
                  title="Add 15 Minutes"
                >
                  +15m
                </button>
                <button
                  id={`add-30m-btn-${station.id}`}
                  onClick={() => addMinutesToSession(station.id, 30)}
                  className="py-1 px-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-cyan-500/40 transition-colors text-center"
                  title="Add 30 Minutes"
                >
                  +30m
                </button>
                <button
                  id={`add-60m-btn-${station.id}`}
                  onClick={() => addMinutesToSession(station.id, 60)}
                  className="py-1 px-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-cyan-500/40 transition-colors text-center"
                  title="Add 1 Hour"
                >
                  +1 hr
                </button>
              </div>
            )}

            {/* Middle Quick Actions: Add Snack, Pause, Transfer, Manage */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                id={`add-snack-btn-${station.id}`}
                onClick={() => onOpenSnackPOSForStation(station)}
                className="p-2 rounded-xl text-xs bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 border border-zinc-700/80 flex flex-col items-center justify-center transition-colors shadow-sm"
                title="Add Drinks / Snacks to Tab"
              >
                <Coffee className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Snacks</span>
              </button>

              <button
                id={`pause-resume-btn-${station.id}`}
                onClick={() => togglePauseSession(station.id)}
                className={`p-2 rounded-xl text-xs border flex flex-col items-center justify-center transition-colors shadow-sm ${
                  sessionState?.isPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/80'
                }`}
                title={sessionState?.isPaused ? 'Resume Timer' : 'Pause Timer'}
              >
                {sessionState?.isPaused ? (
                  <Play className="w-3.5 h-3.5 mb-0.5 fill-current" />
                ) : (
                  <Pause className="w-3.5 h-3.5 mb-0.5" />
                )}
                <span className="text-[10px]">{sessionState?.isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                id={`transfer-station-btn-${station.id}`}
                onClick={() => onOpenTransferModal(station)}
                className="p-2 rounded-xl text-xs bg-zinc-800/80 hover:bg-zinc-700 text-cyan-400 border border-zinc-700/80 flex flex-col items-center justify-center transition-colors shadow-sm"
                title="Move Customer to Another Table/Console"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Move</span>
              </button>

              <button
                id={`manage-tab-btn-${station.id}`}
                onClick={() => onOpenDetailModal(station)}
                className="p-2 rounded-xl text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 flex flex-col items-center justify-center transition-colors shadow-sm"
                title="View & Edit Tab Details"
              >
                <Info className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[10px]">Tab</span>
              </button>
            </div>

            {/* Primary Checkout Button */}
            <button
              id={`checkout-btn-${station.id}`}
              onClick={() => onOpenCheckoutModal(station)}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-zinc-950 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
            >
              <Receipt className="w-4 h-4" />
              <span>Checkout & Bill ({formatCurrency(sessionState?.grandTotal || 0, settings.currencySymbol)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
