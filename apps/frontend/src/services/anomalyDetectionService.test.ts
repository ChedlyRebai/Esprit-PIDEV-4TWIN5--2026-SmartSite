import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import anomalyDetectionService from './anomalyDetectionService';

// ─── simulateAnomalyDetection ─────────────────────────────────────────────────

describe('simulateAnomalyDetection', () => {
  it('returns NORMAL for consumption <= 60', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(50, 'Béton');
    expect(result.isAnomaly).toBe(false);
    expect(result.anomalyType).toBe('NORMAL');
    expect(result.riskLevel).toBe('LOW');
    expect(result.shouldSendAlert).toBe(false);
    expect(result.deviationPercentage).toBe(0);
  });

  it('returns NORMAL for consumption exactly 60', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(60, 'Acier');
    expect(result.isAnomaly).toBe(false);
    expect(result.anomalyType).toBe('NORMAL');
  });

  it('returns SUSPICIOUS_PATTERN LOW for consumption between 60 and 75', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(65, 'Bois');
    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyType).toBe('SUSPICIOUS_PATTERN');
    expect(result.riskLevel).toBe('LOW');
    expect(result.shouldSendAlert).toBe(false);
    expect(result.deviationPercentage).toBeGreaterThan(0);
  });

  it('returns SUSPICIOUS_PATTERN MEDIUM for consumption between 75 and 100', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(80, 'Ciment');
    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyType).toBe('SUSPICIOUS_PATTERN');
    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.shouldSendAlert).toBe(true);
  });

  it('returns EXCESSIVE_OUT HIGH for consumption > 100', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(150, 'Sable');
    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyType).toBe('EXCESSIVE_OUT');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.shouldSendAlert).toBe(true);
    expect(result.recommendedAction).toContain('vol');
  });

  it('calculates deviationPercentage correctly for consumption 100', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(100, 'Gravier');
    // (100 - 50) / 50 * 100 = 100%
    expect(result.deviationPercentage).toBe(100);
  });

  it('calculates deviationPercentage correctly for consumption 75', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(75, 'Gravier');
    // (75 - 50) / 50 * 100 = 50%
    expect(result.deviationPercentage).toBe(50);
  });

  it('returns message containing deviation percentage', () => {
    const result = anomalyDetectionService.simulateAnomalyDetection(100, 'Béton');
    expect(result.message).toContain('100');
  });
});

// ─── emitAnomalyAlert ─────────────────────────────────────────────────────────

describe('emitAnomalyAlert', () => {
  it('dispatches anomalyDetected event on window', () => {
    const listener = vi.fn();
    window.addEventListener('anomalyDetected', listener);

    const anomalyResult = anomalyDetectionService.simulateAnomalyDetection(150, 'Béton');
    anomalyDetectionService.emitAnomalyAlert('mat-1', 'Béton', anomalyResult);

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.materialId).toBe('mat-1');
    expect(event.detail.materialName).toBe('Béton');
    expect(event.detail.anomalyResult).toEqual(anomalyResult);
    expect(event.detail.timestamp).toBeInstanceOf(Date);

    window.removeEventListener('anomalyDetected', listener);
  });
});

// ─── sendAnomalyEmail ─────────────────────────────────────────────────────────

describe('sendAnomalyEmail', () => {
  it('returns true on success', async () => {
    const anomalyResult = anomalyDetectionService.simulateAnomalyDetection(150, 'Béton');
    const result = await anomalyDetectionService.sendAnomalyEmail('mat-1', 'Béton', anomalyResult);
    expect(result).toBe(true);
  }, 5000);
});

// ─── processAnomalyDetection ──────────────────────────────────────────────────

describe('processAnomalyDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses simulation when useRealAPI is false', async () => {
    const spy = vi.spyOn(anomalyDetectionService, 'simulateAnomalyDetection');
    vi.runAllTimersAsync();

    const result = await anomalyDetectionService.processAnomalyDetection(
      'mat-1', 'Béton', 50, false
    );

    expect(spy).toHaveBeenCalledWith(50, 'Béton');
    expect(result.anomalyType).toBe('NORMAL');
  });

  it('uses simulation for new-material id', async () => {
    const spy = vi.spyOn(anomalyDetectionService, 'simulateAnomalyDetection');
    vi.runAllTimersAsync();

    await anomalyDetectionService.processAnomalyDetection(
      'new-material', 'Acier', 50, true
    );

    expect(spy).toHaveBeenCalled();
  });

  it('emits alert when anomaly is detected', async () => {
    const listener = vi.fn();
    window.addEventListener('anomalyDetected', listener);
    vi.runAllTimersAsync();

    await anomalyDetectionService.processAnomalyDetection(
      'mat-1', 'Béton', 150, false
    );

    expect(listener).toHaveBeenCalled();
    window.removeEventListener('anomalyDetected', listener);
  });

  it('does not emit alert for normal consumption', async () => {
    const listener = vi.fn();
    window.addEventListener('anomalyDetected', listener);

    await anomalyDetectionService.processAnomalyDetection(
      'mat-1', 'Béton', 30, false
    );

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('anomalyDetected', listener);
  });
});
