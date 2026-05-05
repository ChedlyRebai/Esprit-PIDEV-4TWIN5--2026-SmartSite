import { describe, it, expect, vi, beforeEach } from 'vitest';
import weatherService, { type WeatherData } from './weatherService';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// ─── Helper ───────────────────────────────────────────────────────────────────

const makeWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
  temperature: 20,
  humidity: 60,
  windSpeed: 10,
  condition: 'clear',
  description: 'Ensoleillé',
  icon: '☀️',
  location: 'Tunis',
  ...overrides,
});

// ─── analyzeWeatherImpact ─────────────────────────────────────────────────────

describe('analyzeWeatherImpact', () => {
  it('returns LOW impact for normal conditions', () => {
    const result = weatherService.analyzeWeatherImpact(makeWeather(), 'acier');
    expect(result.impactLevel).toBe('LOW');
    expect(result.consumptionMultiplier).toBe(1.0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('returns HIGH impact for rain + béton', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ condition: 'rain' }),
      'béton'
    );
    expect(result.impactLevel).toBe('HIGH');
    expect(result.consumptionMultiplier).toBe(0.7);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.message).toContain('béton');
  });

  it('returns HIGH impact for pluie + ciment', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ condition: 'pluie' }),
      'ciment'
    );
    expect(result.impactLevel).toBe('HIGH');
    expect(result.consumptionMultiplier).toBe(0.7);
  });

  it('returns MEDIUM impact for rain + bois', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ condition: 'rain' }),
      'bois'
    );
    expect(result.impactLevel).toBe('MEDIUM');
    expect(result.consumptionMultiplier).toBe(0.9);
  });

  it('returns MEDIUM impact for rain + isolation', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ condition: 'rain' }),
      'isolation'
    );
    expect(result.impactLevel).toBe('MEDIUM');
    expect(result.consumptionMultiplier).toBe(0.9);
  });

  it('returns MEDIUM impact for high wind speed > 20', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ windSpeed: 25 }),
      'acier'
    );
    expect(result.impactLevel).toBe('MEDIUM');
    expect(result.consumptionMultiplier).toBe(0.8);
    expect(result.recommendations).toContain('Sécuriser les matériaux');
  });

  it('returns LOW impact for wind speed exactly 20 (not > 20)', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ windSpeed: 20 }),
      'acier'
    );
    expect(result.impactLevel).toBe('LOW');
  });

  it('returns MEDIUM impact for high temperature > 30 + béton', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ temperature: 35 }),
      'béton'
    );
    expect(result.impactLevel).toBe('MEDIUM');
    expect(result.consumptionMultiplier).toBe(1.1);
    expect(result.message).toContain('chaleur');
  });

  it('returns LOW impact for high temperature + non-béton material', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ temperature: 35 }),
      'acier'
    );
    expect(result.impactLevel).toBe('LOW');
    expect(result.consumptionMultiplier).toBe(1.0);
  });

  it('returns MEDIUM impact for cold temperature < 5', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ temperature: 2 }),
      'acier'
    );
    expect(result.impactLevel).toBe('MEDIUM');
    expect(result.consumptionMultiplier).toBe(1.2);
    expect(result.message).toContain('gel');
  });

  it('returns LOW impact for temperature exactly 5 (not < 5)', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ temperature: 5 }),
      'acier'
    );
    expect(result.impactLevel).toBe('LOW');
  });

  it('rain takes priority over wind speed', () => {
    const result = weatherService.analyzeWeatherImpact(
      makeWeather({ condition: 'rain', windSpeed: 30 }),
      'béton'
    );
    // rain + béton = HIGH (not wind MEDIUM)
    expect(result.impactLevel).toBe('HIGH');
  });
});

// ─── getWeatherByCoordinates (mocked axios) ───────────────────────────────────

describe('getWeatherByCoordinates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed weather when backend responds with success', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        weather: {
          temperature: 25,
          humidity: 55,
          windSpeed: 12,
          condition: 'clear',
          description: 'Sunny',
          icon: '☀️',
          cityName: 'Tunis',
        },
      },
    });

    const result = await weatherService.getWeatherByCoordinates(36.8, 10.1);
    expect(result.temperature).toBe(25);
    expect(result.location).toBe('Tunis');
    expect(result.condition).toBe('clear');
  });

  it('falls back to simulated data when backend returns no weather', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { success: false },
    });

    const result = await weatherService.getWeatherByCoordinates(36.8, 10.1);
    expect(result).toBeDefined();
    expect(result.temperature).toBeDefined();
    expect(result.condition).toBeDefined();
  });

  it('falls back to simulated data on network error', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await weatherService.getWeatherByCoordinates(36.8, 10.1);
    expect(result).toBeDefined();
    expect(result.location).toContain('36.80');
  });
});

// ─── getWeatherByCity (mocked axios) ─────────────────────────────────────────

describe('getWeatherByCity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed weather when backend responds with success', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        success: true,
        weather: {
          temperature: 18,
          humidity: 70,
          windSpeed: 8,
          condition: 'clouds',
          description: 'Nuageux',
          icon: '☁️',
          cityName: 'Sfax',
        },
      },
    });

    const result = await weatherService.getWeatherByCity('Sfax');
    expect(result.location).toBe('Sfax');
    expect(result.temperature).toBe(18);
  });

  it('falls back to simulated data on error', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('timeout'));

    const result = await weatherService.getWeatherByCity('Sousse');
    expect(result).toBeDefined();
    expect(result.location).toBe('Sousse');
  });
});

// ─── getWeatherForSite ────────────────────────────────────────────────────────

describe('getWeatherForSite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses coordinates when available', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { success: false },
    });

    const result = await weatherService.getWeatherForSite({
      coordinates: { lat: 36.8, lng: 10.1 },
      nom: 'Site A',
    });
    expect(result).toBeDefined();
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/weather'),
      expect.objectContaining({ params: { lat: 36.8, lng: 10.1 } })
    );
  });

  it('uses adresse when no coordinates', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { success: false },
    });

    const result = await weatherService.getWeatherForSite({
      adresse: 'Tunis Centre',
    });
    expect(result).toBeDefined();
  });

  it('uses nom when no coordinates and no adresse', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { success: false },
    });

    const result = await weatherService.getWeatherForSite({ nom: 'Chantier Nord' });
    expect(result).toBeDefined();
  });

  it('falls back to Paris when site has no location info', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { success: false },
    });

    const result = await weatherService.getWeatherForSite({});
    expect(result).toBeDefined();
  });
});
