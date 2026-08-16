import { describe, expect, it } from 'vitest';
import { computeSessionState } from './formatters';
import type { AppSettings, StationSession } from '../types';

const settings: AppSettings = {
  cafeName: 'Break-N-Run',
  cafeTagline: '',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  taxRatePercent: 0,
  gracePeriodMinutes: 0,
  billingIntervalMinutes: 1,
  extraControllerHourlyFee: 0,
  defaultRackFee: 50,
  warningAlertThresholdMinutes: 5,
  soundAlertsEnabled: false,
  phoneOrContact: '',
  receiptFooterMessage: '',
};

const session = (overrides: Partial<StationSession> = {}): StationSession => ({
  id: 'test-session',
  stationId: 'ps4-1',
  customerName: 'Test Customer',
  billingMode: 'open_ended',
  startTime: 0,
  totalPausedDurationMs: 0,
  orders: [],
  discountAmount: 0,
  discountType: 'fixed',
  ...overrides,
});

describe('computeSessionState', () => {
  it('calculates exact minute-based gaming cost', () => {
    const state = computeSessionState(session(), 300, settings, 30 * 60 * 1000);
    expect(state.elapsedMinutes).toBe(30);
    expect(state.gamingTimeCost).toBe(150);
    expect(state.grandTotal).toBe(150);
  });

  it('does not charge paused time', () => {
    const state = computeSessionState(
      session({ pausedAt: 20 * 60 * 1000, totalPausedDurationMs: 0 }),
      300,
      settings,
      60 * 60 * 1000,
    );
    expect(state.elapsedMinutes).toBe(20);
    expect(state.gamingTimeCost).toBe(100);
  });

  it('calculates percentage discounts correctly', () => {
    const state = computeSessionState(
      session({ discountAmount: 50, discountType: 'percentage' }),
      300,
      settings,
      30 * 60 * 1000,
    );
    expect(state.discountValue).toBe(75);
    expect(state.grandTotal).toBe(75);
  });

  it('caps discounts at the subtotal', () => {
    const state = computeSessionState(
      session({ discountAmount: 150, discountType: 'percentage' }),
      300,
      settings,
      30 * 60 * 1000,
    );
    expect(state.discountValue).toBe(150);
    expect(state.grandTotal).toBe(0);
  });

  it('handles prepaid expiry and warning thresholds', () => {
    const prepaid = session({ billingMode: 'prepaid', allocatedMinutes: 60 });
    const warning = computeSessionState(prepaid, 300, settings, 56 * 60 * 1000);
    const expired = computeSessionState(prepaid, 300, settings, 61 * 60 * 1000);

    expect(warning.isWarning).toBe(true);
    expect(warning.isExpired).toBe(false);
    expect(expired.isExpired).toBe(true);
  });
});
