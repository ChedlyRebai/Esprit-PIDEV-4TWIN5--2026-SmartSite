import { describe, it, expect } from 'vitest';
import messageAnalysisService from './messageAnalysisService';

// ─── getEmotionIcon ───────────────────────────────────────────────────────────

describe('getEmotionIcon', () => {
  it('returns 😌 for calm', () => {
    expect(messageAnalysisService.getEmotionIcon('calm')).toBe('😌');
  });
  it('returns 😰 for stressed', () => {
    expect(messageAnalysisService.getEmotionIcon('stressed')).toBe('😰');
  });
  it('returns 😤 for frustrated', () => {
    expect(messageAnalysisService.getEmotionIcon('frustrated')).toBe('😤');
  });
  it('returns 😡 for angry', () => {
    expect(messageAnalysisService.getEmotionIcon('angry')).toBe('😡');
  });
  it('returns 😐 for unknown emotion', () => {
    expect(messageAnalysisService.getEmotionIcon('unknown')).toBe('😐');
    expect(messageAnalysisService.getEmotionIcon('')).toBe('😐');
  });
});

// ─── getEmotionColor ──────────────────────────────────────────────────────────

describe('getEmotionColor', () => {
  it('returns green for calm', () => {
    expect(messageAnalysisService.getEmotionColor('calm')).toBe('text-green-600');
  });
  it('returns yellow for stressed', () => {
    expect(messageAnalysisService.getEmotionColor('stressed')).toBe('text-yellow-600');
  });
  it('returns orange for frustrated', () => {
    expect(messageAnalysisService.getEmotionColor('frustrated')).toBe('text-orange-600');
  });
  it('returns red for angry', () => {
    expect(messageAnalysisService.getEmotionColor('angry')).toBe('text-red-600');
  });
  it('returns gray for unknown', () => {
    expect(messageAnalysisService.getEmotionColor('unknown')).toBe('text-gray-600');
    expect(messageAnalysisService.getEmotionColor('')).toBe('text-gray-600');
  });
});

// ─── getSentimentIcon ─────────────────────────────────────────────────────────

describe('getSentimentIcon', () => {
  it('returns 👍 for positive', () => {
    expect(messageAnalysisService.getSentimentIcon('positive')).toBe('👍');
  });
  it('returns 👎 for negative', () => {
    expect(messageAnalysisService.getSentimentIcon('negative')).toBe('👎');
  });
  it('returns 👌 for neutral', () => {
    expect(messageAnalysisService.getSentimentIcon('neutral')).toBe('👌');
  });
  it('returns 🤷 for unknown', () => {
    expect(messageAnalysisService.getSentimentIcon('unknown')).toBe('🤷');
    expect(messageAnalysisService.getSentimentIcon('')).toBe('🤷');
  });
});

// ─── getStatusColor ───────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns green for NORMAL', () => {
    expect(messageAnalysisService.getStatusColor('NORMAL')).toBe('bg-green-100 text-green-800');
  });
  it('returns yellow for WARNING', () => {
    expect(messageAnalysisService.getStatusColor('WARNING')).toBe('bg-yellow-100 text-yellow-800');
  });
  it('returns red for CONFLICT', () => {
    expect(messageAnalysisService.getStatusColor('CONFLICT')).toBe('bg-red-100 text-red-800');
  });
  it('returns gray for unknown status', () => {
    expect(messageAnalysisService.getStatusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
    expect(messageAnalysisService.getStatusColor('')).toBe('bg-gray-100 text-gray-800');
  });
});
