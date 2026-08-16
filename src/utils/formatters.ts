import { AppSettings, BilliardMatch, StationSession } from '../types';

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  const rounded = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${rounded.toFixed(2)}`;
}

export function formatMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

export function formatSecondsToTimer(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remSecs = secs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(mins)}:${pad(remSecs)}`;
  }
  return `${pad(mins)}:${pad(remSecs)}`;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface SessionCalculatedState {
  elapsedSeconds: number;
  elapsedMinutes: number;
  effectiveBillableMinutes: number;
  remainingSeconds: number; // for prepaid
  remainingMinutes: number;
  percentElapsed: number; // 0 to 100 for prepaid
  isWarning: boolean; // within warning threshold
  isExpired: boolean; // prepaid time exceeded
  isPaused: boolean;
  gamingTimeCost: number;
  extraControllersCost: number;
  concessionsCost: number;
  subtotal: number;
  discountValue: number;
  taxValue: number;
  grandTotal: number;
}

export function computeSessionState(
  session: StationSession,
  hourlyRate: number,
  settings: AppSettings,
  currentTimestamp: number = Date.now()
): SessionCalculatedState {
  const isPaused = typeof session.pausedAt === 'number' && session.pausedAt > 0;

  // Active elapsed time in milliseconds
  let activeElapsedMs = 0;
  if (isPaused) {
    activeElapsedMs = Math.max(0, (session.pausedAt! - session.startTime) - session.totalPausedDurationMs);
  } else {
    activeElapsedMs = Math.max(0, (currentTimestamp - session.startTime) - session.totalPausedDurationMs);
  }

  const elapsedSeconds = Math.floor(activeElapsedMs / 1000);
  const elapsedMinutes = elapsedSeconds / 60;

  // Billable minutes logic (supports grace period and rounding interval)
  let effectiveMinutes = elapsedMinutes;

  if (settings.gracePeriodMinutes > 0 && elapsedMinutes <= settings.gracePeriodMinutes) {
    effectiveMinutes = 0;
  } else if (settings.billingIntervalMinutes > 1) {
    // Round up to nearest interval (e.g. 15 or 30 mins)
    effectiveMinutes = Math.ceil(elapsedMinutes / settings.billingIntervalMinutes) * settings.billingIntervalMinutes;
  }

  // Gaming time cost
  const gamingTimeCost = (effectiveMinutes / 60) * hourlyRate;

  // Extra controllers cost (0 since controllers are free)
  const extraControllersCost = 0;

  // Concessions cost
  const concessionsCost = (session.orders || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Subtotal
  const subtotal = Math.max(0, gamingTimeCost + extraControllersCost + concessionsCost);

  // Discount
  let discountValue = 0;
  if (session.discountAmount > 0) {
    if (session.discountType === 'percentage') {
      discountValue = (subtotal * session.discountAmount) / 100;
    } else {
      discountValue = session.discountAmount;
    }
  }
  discountValue = Math.min(discountValue, subtotal);

  // Tax
  const taxableAmount = Math.max(0, subtotal - discountValue);
  const taxValue = settings.taxRatePercent > 0 ? (taxableAmount * settings.taxRatePercent) / 100 : 0;

  const grandTotal = Math.max(0, taxableAmount + taxValue);

  // Prepaid specifics
  let remainingSeconds = 0;
  let remainingMinutes = 0;
  let percentElapsed = 0;
  let isWarning = false;
  let isExpired = false;

  if (session.billingMode === 'prepaid' && session.allocatedMinutes && session.allocatedMinutes > 0) {
    const totalAllocatedSecs = session.allocatedMinutes * 60;
    remainingSeconds = Math.max(0, totalAllocatedSecs - elapsedSeconds);
    remainingMinutes = Math.max(0, session.allocatedMinutes - elapsedMinutes);
    percentElapsed = Math.min(100, (elapsedSeconds / totalAllocatedSecs) * 100);

    const warningThresholdSecs = (settings.warningAlertThresholdMinutes || 5) * 60;
    if (elapsedSeconds >= totalAllocatedSecs) {
      isExpired = true;
    } else if (remainingSeconds <= warningThresholdSecs) {
      isWarning = true;
    }
  }

  return {
    elapsedSeconds,
    elapsedMinutes,
    effectiveBillableMinutes: effectiveMinutes,
    remainingSeconds,
    remainingMinutes,
    percentElapsed,
    isWarning,
    isExpired,
    isPaused,
    gamingTimeCost,
    extraControllersCost,
    concessionsCost,
    subtotal,
    discountValue,
    taxValue,
    grandTotal,
  };
}

export function formatBilliardMatchSummary(match: BilliardMatch): string {
  const p1 = match.player1Name || 'Player 1';
  const p2 = match.player2Name || 'Player 2';
  const format = match.raceTo ? `Race to ${match.raceTo}` : match.matchType || 'Match';
  const score = `${match.player1Score} - ${match.player2Score}`;
  
  let status = `${format} (${score})`;
  if (match.winner === 'player1') {
    status = `${p1} won ${score} (${format}) • Loser: ${p2}`;
  } else if (match.winner === 'player2') {
    status = `${p2} won ${score} (${format}) • Loser: ${p1}`;
  } else {
    status = `${p1} (${match.player1Score}) vs ${p2} (${match.player2Score}) • ${format}`;
  }
  return status;
}
