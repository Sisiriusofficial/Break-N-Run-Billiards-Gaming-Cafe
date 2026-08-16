import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
  User,
  Phone,
  FileText,
  Users,
  Trophy,
  Swords,
  CheckCircle2,
} from 'lucide-react';
import { BilliardMatch, Station } from '../types';
import { useCafe } from '../context/CafeContext';
import { formatCurrency } from '../utils/formatters';

interface StationStartModalProps {
  station: Station | null;
  onClose: () => void;
}

export const StationStartModal: React.FC<StationStartModalProps> = ({ station, onClose }) => {
  const { startSession, waitlist, updateWaitlistStatus, settings } = useCafe();

  const isBilliard = station?.category === 'billiard';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingMode, setBillingMode] = useState<'prepaid' | 'open_ended'>(
    isBilliard ? 'open_ended' : 'prepaid'
  );
  const [allocatedMinutes, setAllocatedMinutes] = useState<number>(60);
  const [customMinutes, setCustomMinutes] = useState<string>('60');
  const [notes, setNotes] = useState('');

  // Billiard Match State
  const [isBilliardMatch, setIsBilliardMatch] = useState(isBilliard);
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [raceTo, setRaceTo] = useState<number>(5); // default Race to 5
  const [loserPays, setLoserPays] = useState<boolean>(true);

  if (!station) return null;

  // Check matching waitlist
  const matchingWaitlist = waitlist.filter(
    (w) =>
      w.status === 'waiting' &&
      (w.preferredCategory === 'any' || w.preferredCategory === station.category)
  );

  const handleSelectWaitlistGuest = (guest: typeof waitlist[0]) => {
    if (isBilliardMatch) {
      if (!p1Name) setP1Name(guest.customerName);
      else if (!p2Name) setP2Name(guest.customerName);
    } else {
      setCustomerName(guest.customerName);
    }
    setCustomerPhone(guest.phone);
    if (guest.notes) {
      setNotes((prev) => (prev ? `${prev} • ${guest.notes}` : guest.notes || ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMinutes =
      billingMode === 'prepaid'
        ? parseInt(customMinutes, 10) || allocatedMinutes || 60
        : undefined;

    let matchData: BilliardMatch | undefined = undefined;
    let finalCustomerName = customerName.trim();

    if (isBilliard && isBilliardMatch) {
      const player1 = p1Name.trim() || 'Player 1';
      const player2 = p2Name.trim() || 'Player 2';
      finalCustomerName = `${player1} vs ${player2}`;
      matchData = {
        player1Name: player1,
        player2Name: player2,
        raceTo: raceTo > 0 ? raceTo : undefined,
        player1Score: 0,
        player2Score: 0,
        matchType: raceTo > 0 ? `Race to ${raceTo}` : 'Open Match',
        loserPays,
        payer: loserPays ? 'loser' : 'split',
        payerName: loserPays ? `Loser of (${player1} vs ${player2})` : `${player1} & ${player2} (Split 50/50)`,
      };
    }

    startSession(station.id, {
      customerName: finalCustomerName || 'Guest Customer',
      customerPhone: customerPhone.trim() || undefined,
      billingMode,
      allocatedMinutes: finalMinutes,
      notes: notes.trim() || undefined,
      billiardMatch: matchData,
    });

    // Mark seated in waitlist if matching phone or name
    const foundInWaitlist = waitlist.find(
      (w) =>
        w.status === 'waiting' &&
        ((w.phone && w.phone === customerPhone) ||
          w.customerName.toLowerCase() === finalCustomerName.toLowerCase() ||
          (p1Name && w.customerName.toLowerCase() === p1Name.toLowerCase()) ||
          (p2Name && w.customerName.toLowerCase() === p2Name.toLowerCase()))
    );
    if (foundInWaitlist) {
      updateWaitlistStatus(foundInWaitlist.id, 'seated');
    }

    onClose();
  };

  const presetDurations = [
    { label: '30 Min', mins: 30 },
    { label: '1 Hour', mins: 60 },
    { label: '1.5 Hours', mins: 90 },
    { label: '2 Hours', mins: 120 },
    { label: '3 Hours', mins: 180 },
  ];

  const racePresets = [
    { label: 'Race to 3', val: 3 },
    { label: 'Race to 5 (Standard)', val: 5 },
    { label: 'Race to 7', val: 7 },
    { label: 'Race to 9', val: 9 },
    { label: 'Open Match', val: 0 },
  ];

  const estimatedGamingCost =
    billingMode === 'prepaid'
      ? (allocatedMinutes / 60) * station.hourlyRate
      : station.hourlyRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/80 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
              <h2 className="text-base font-bold text-white tracking-tight font-sans">
                Start Session: {station.name}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Rate: <span className="text-emerald-400 font-bold">{formatCurrency(station.hourlyRate, settings.currencySymbol)}/hr</span> • Billed by exact minutes
            </p>
          </div>
          <button
            id="close-start-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Waitlist Quick-Fill Banner */}
        {matchingWaitlist.length > 0 && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{matchingWaitlist.length} customer(s) waiting for this station category</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {matchingWaitlist.slice(0, 2).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelectWaitlistGuest(w)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold whitespace-nowrap transition-colors border border-amber-500/30"
                >
                  Fill: {w.customerName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Billiards Mode Selector */}
          {isBilliard && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">Billiards Match Setup</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBilliardMatch}
                    onChange={(e) => setIsBilliardMatch(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-xs text-zinc-300 font-semibold">Enable Race / Match Mode</span>
                </label>
              </div>

              {isBilliardMatch && (
                <div className="space-y-3 pt-1 border-t border-cyan-500/20">
                  {/* Players */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Player 1 (Solid / Break)
                      </label>
                      <input
                        type="text"
                        required
                        value={p1Name}
                        onChange={(e) => setP1Name(e.target.value)}
                        placeholder="e.g. Rahim"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Player 2 (Stripes)
                      </label>
                      <input
                        type="text"
                        required
                        value={p2Name}
                        onChange={(e) => setP2Name(e.target.value)}
                        placeholder="e.g. Karim"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Race Format Presets */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>Match Target / Race</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {raceTo > 0 ? `Race to ${raceTo} Racks` : 'Open Frame Play'}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 font-mono">
                      {racePresets.map((r) => (
                        <button
                          key={r.val}
                          type="button"
                          onClick={() => setRaceTo(r.val)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                            raceTo === r.val
                              ? 'bg-cyan-500 text-zinc-950 font-bold shadow-xs'
                              : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loser Pays Rule */}
                  <div
                    onClick={() => setLoserPays(!loserPays)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      loserPays
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className={`w-4 h-4 ${loserPays ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <div>
                        <div className="text-xs font-bold">
                          {loserPays ? '🏆 Loser Pays Table Tab (Enabled)' : 'Split or Regular Pay'}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {loserPays
                            ? 'The player who loses the race is automatically billed for the table time'
                            : 'Standard checkout without automatic loser attribution'}
                        </div>
                      </div>
                    </div>
                    <div className={`p-1 rounded-full ${loserPays ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-600'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard Customer Info (If not billiard match) */}
          {(!isBilliard || !isBilliardMatch) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  Customer Name
                </label>
                <input
                  id="start-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex (Guest)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  Phone Number (Optional)
                </label>
                <input
                  id="start-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +880 1711-000000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            </div>
          )}

          {/* Billing Mode Tabs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Billing Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                id="mode-open-btn"
                onClick={() => setBillingMode('open_ended')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  billingMode === 'open_ended'
                    ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Open / Postpaid (Count Up)</span>
              </button>

              <button
                type="button"
                id="mode-prepaid-btn"
                onClick={() => setBillingMode('prepaid')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  billingMode === 'prepaid'
                    ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Prepaid (Set Time Limit)</span>
              </button>
            </div>
          </div>

          {/* Prepaid Duration Selection */}
          {billingMode === 'prepaid' && (
            <div className="space-y-2.5 p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Select Duration</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {allocatedMinutes} mins ({allocatedMinutes / 60} hrs)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 font-mono">
                {presetDurations.map((p) => (
                  <button
                    key={p.mins}
                    type="button"
                    id={`preset-${p.mins}m`}
                    onClick={() => {
                      setAllocatedMinutes(p.mins);
                      setCustomMinutes(p.mins.toString());
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      allocatedMinutes === p.mins
                        ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Minutes Input */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-400">Or custom minutes:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => {
                      setCustomMinutes(e.target.value);
                      const num = parseInt(e.target.value, 10);
                      if (!isNaN(num) && num > 0) setAllocatedMinutes(num);
                    }}
                    className="w-20 px-2.5 py-1 text-xs text-center rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-zinc-400">minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Session Notes / Game (Optional)
            </label>
            <input
              id="start-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 8-Ball Pro tournament match or specific cue requested"
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Estimated Total Bar */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <div className="text-xs text-emerald-300 font-medium">
              {billingMode === 'prepaid' ? 'Estimated Prepaid Total' : 'Hourly Rate (Per-minute accrued)'}
            </div>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatCurrency(estimatedGamingCost, settings.currencySymbol)}
              {billingMode === 'open_ended' && '/hr'}
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-start-session-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Session</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
