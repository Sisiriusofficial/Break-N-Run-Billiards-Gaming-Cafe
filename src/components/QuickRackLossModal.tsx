import React, { useState } from 'react';
import {
  X,
  CircleDot,
  User,
  Users,
  Trophy,
  CheckCircle2,
  DollarSign,
  Flame,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { formatCurrency } from '../utils/formatters';

interface QuickRackLossModalProps {
  onClose: () => void;
  preselectedTableId?: string;
  preselectedPlayerName?: string;
}

export const QuickRackLossModal: React.FC<QuickRackLossModalProps> = ({
  onClose,
  preselectedTableId,
  preselectedPlayerName,
}) => {
  const { stations, settings, playerTabs, addRackLossToPlayer } = useCafe();

  const billiardStations = stations.filter((s) => s.category === 'billiard');
  const otherStations = stations.filter((s) => s.category !== 'billiard');

  // Form State
  const [selectedTableId, setSelectedTableId] = useState<string>(
    preselectedTableId || (billiardStations[0]?.id || stations[0]?.id || '')
  );
  const [customTableName, setCustomTableName] = useState<string>('');
  
  const [player1Name, setPlayer1Name] = useState<string>(preselectedPlayerName || '');
  const [player2Name, setPlayer2Name] = useState<string>('');
  
  const [loserSelection, setLoserSelection] = useState<'player1' | 'player2' | null>(null);
  
  const defaultFee = settings.defaultRackFee ?? 50;
  const [rackFee, setRackFee] = useState<number>(defaultFee);
  const [gameType, setGameType] = useState<string>('8-Ball Rack');
  const [notes, setNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Selected table name
  const currentStation = stations.find((s) => s.id === selectedTableId);
  const effectiveTableName =
    selectedTableId === 'custom'
      ? customTableName.trim() || 'Custom Board'
      : currentStation?.name || 'Billiards Table';

  // Quick fee presets
  const feePresets = [30, 40, 50, 60, 80, 100];
  const gameTypes = ['8-Ball Rack', '9-Ball Rack', '10-Ball Rack', 'Snooker Frame', 'Race Match'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loserSelection) {
      alert('Please select which player lost the rack / match.');
      return;
    }

    const loserName = loserSelection === 'player1' ? player1Name.trim() : player2Name.trim();
    const opponentName = loserSelection === 'player1' ? player2Name.trim() : player1Name.trim();

    if (!loserName) {
      alert('Please enter the name of the losing player.');
      return;
    }

    addRackLossToPlayer(loserName, {
      tableId: selectedTableId !== 'custom' ? selectedTableId : undefined,
      tableName: effectiveTableName,
      opponentName: opponentName || 'Walk-in Opponent',
      gameType,
      fee: rackFee,
      notes: notes.trim() || undefined,
    });

    setToastMessage(`Logged ${formatCurrency(rackFee, settings.currencySymbol)} rack loss to ${loserName}'s tab!`);
    setShowSuccessToast(true);

    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/90 my-4 flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Log Rack / Match Loss
              </h2>
              <p className="text-xs text-zinc-400">
                Record loser's rack fee directly to their running customer tab
              </p>
            </div>
          </div>

          <button
            id="quick-rack-loss-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {showSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
          )}

          {/* Table / Board Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Select Billiards Board / Station</span>
              <span className="text-[10px] text-zinc-500 font-mono">Location</span>
            </label>
            <select
              id="rack-board-select"
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <optgroup label="Billiards Tables">
                {billiardStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({formatCurrency(st.hourlyRate, settings.currencySymbol)}/hr)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Stations / Custom">
                {otherStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
                <option value="custom">Other / Custom Table Name</option>
              </optgroup>
            </select>

            {selectedTableId === 'custom' && (
              <input
                type="text"
                value={customTableName}
                onChange={(e) => setCustomTableName(e.target.value)}
                placeholder="Enter board or table name..."
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* Players Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Player 1 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Player 1 Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="rack-p1-name-input"
                  type="text"
                  required
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="e.g. Shakib, Tanvir..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick autofill from active tabs */}
              {playerTabs.length > 0 && !player1Name && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {playerTabs.slice(0, 3).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPlayer1Name(tab.playerName)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      {tab.playerName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Player 2 (Opponent) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="rack-p2-name-input"
                  type="text"
                  required
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="e.g. Rahim, Arman..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick autofill from active tabs */}
              {playerTabs.length > 0 && !player2Name && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {playerTabs.slice(0, 3).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPlayer2Name(tab.playerName)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      {tab.playerName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* WHO LOST THE RACK / MATCH? (Prominent Selector) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                Who Lost This Rack / Match?
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Loser will be billed</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                id="rack-p1-lost-btn"
                onClick={() => setLoserSelection('player1')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  loserSelection === 'player1'
                    ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)] text-white'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                  {loserSelection === 'player1' ? '🔴 LOSER (PAYER)' : 'Player 1'}
                </span>
                <span className="text-xs font-bold truncate block mt-0.5">
                  {player1Name.trim() || 'Player 1'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Charge {formatCurrency(rackFee, settings.currencySymbol)} to tab
                </span>
              </button>

              <button
                type="button"
                id="rack-p2-lost-btn"
                onClick={() => setLoserSelection('player2')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  loserSelection === 'player2'
                    ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)] text-white'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                  {loserSelection === 'player2' ? '🔴 LOSER (PAYER)' : 'Player 2'}
                </span>
                <span className="text-xs font-bold truncate block mt-0.5">
                  {player2Name.trim() || 'Player 2'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Charge {formatCurrency(rackFee, settings.currencySymbol)} to tab
                </span>
              </button>
            </div>
          </div>

          {/* Fee & Game Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rack Fee */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Rack / Match Fee ({settings.currencySymbol})
              </label>
              <input
                id="rack-fee-input"
                type="number"
                min="0"
                step="5"
                value={rackFee}
                onChange={(e) => setRackFee(Math.max(0, Number(e.target.value)))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {feePresets.map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setRackFee(fee)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                      rackFee === fee
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {formatCurrency(fee, settings.currencySymbol)}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Type */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Game / Discipline
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {gameTypes.map((gt) => (
                  <option key={gt} value={gt}>
                    {gt}
                  </option>
                ))}
                <option value="Custom Frame">Custom Frame</option>
              </select>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Match Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scratch on 8-ball, Golden break, Frame 3..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="submit-rack-loss-btn"
              disabled={!loserSelection}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CircleDot className="w-4 h-4" />
              <span>
                Save & Bill{' '}
                {loserSelection
                  ? loserSelection === 'player1'
                    ? player1Name.trim() || 'Player 1'
                    : player2Name.trim() || 'Player 2'
                  : 'Loser'}
                {' '}({formatCurrency(rackFee, settings.currencySymbol)})
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
