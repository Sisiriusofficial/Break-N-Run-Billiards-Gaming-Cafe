import React, { useState } from 'react';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Car,
  Gamepad2,
  Tv,
  CircleDot,
} from 'lucide-react';
import { Station } from '../types';
import { useCafe } from '../context/CafeContext';
import { formatCurrency } from '../utils/formatters';

interface QuickTransferModalProps {
  sourceStation: Station | null;
  onClose: () => void;
}

export const QuickTransferModal: React.FC<QuickTransferModalProps> = ({
  sourceStation,
  onClose,
}) => {
  const { stations, settings, transferSession } = useCafe();

  const [targetStationId, setTargetStationId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!sourceStation || !sourceStation.currentSession) return null;

  const availableStations = stations.filter(
    (s) => s.id !== sourceStation.id && !s.currentSession
  );

  const handleConfirmTransfer = () => {
    if (!targetStationId) {
      setErrorMsg('Please choose an available station to move this customer.');
      return;
    }

    const success = transferSession(sourceStation.id, targetStationId);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Failed to transfer. Target station might be busy.');
    }
  };

  const getStationIcon = (type: Station['iconType']) => {
    switch (type) {
      case 'racing':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'arcade':
        return <Tv className="w-4 h-4 text-amber-400" />;
      case 'billiard':
        return <CircleDot className="w-4 h-4 text-emerald-400" />;
      case 'gamepad':
      default:
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Move / Switch Station
              </h2>
              <p className="text-xs text-zinc-400">
                Transfer active customer tab & elapsed timer seamlessly
              </p>
            </div>
          </div>
          <button
            id="close-transfer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Current Source Info */}
          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Current Origin Station
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">{sourceStation.name}</span>
              <span className="text-xs text-emerald-400 font-medium font-mono">
                {sourceStation.currentSession.customerName}
              </span>
            </div>
          </div>

          {/* Target Station Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Select New Destination Station
            </label>

            {availableStations.length === 0 ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>All other tables and consoles are currently busy!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableStations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setTargetStationId(st.id);
                      setErrorMsg('');
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between active:scale-[0.99] ${
                      targetStationId === st.id
                        ? 'bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-zinc-950/90 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        {getStationIcon(st.iconType)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs block truncate">{st.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {formatCurrency(st.hourlyRate, settings.currencySymbol)}/hr
                        </span>
                      </div>
                    </div>
                    {targetStationId === st.id && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-transfer-btn"
              disabled={availableStations.length === 0 || !targetStationId}
              onClick={handleConfirmTransfer}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                availableStations.length === 0 || !targetStationId
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-[0.98]'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Confirm Station Transfer</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
