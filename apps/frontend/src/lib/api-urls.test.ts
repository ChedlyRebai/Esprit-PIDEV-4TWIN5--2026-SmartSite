import { describe, it, expect } from 'vitest';
import { API_GATEWAY_URL } from './api-gateway-url';
import { AUTH_API_URL } from './auth-api-url';
import { GESTION_PROJECTS_API_URL } from './gestion-projects-api-url';
import { GESTION_SITE_API_URL } from './gestion-site-api-url';
import { INCIDENT_API_URL } from './incident-api-url';
import { PAYMENT_API_URL } from './payment-api-url';
import { PLANNING_API_URL } from './planning-api-url';

describe('API URL constants', () => {
  it('API_GATEWAY_URL has a default value', () => {
    expect(API_GATEWAY_URL).toBeDefined();
    expect(typeof API_GATEWAY_URL).toBe('string');
    expect(API_GATEWAY_URL.length).toBeGreaterThan(0);
  });

  it('AUTH_API_URL has a default value', () => {
    expect(AUTH_API_URL).toBeDefined();
    expect(typeof AUTH_API_URL).toBe('string');
    expect(AUTH_API_URL.length).toBeGreaterThan(0);
  });

  it('GESTION_PROJECTS_API_URL has a default value', () => {
    expect(GESTION_PROJECTS_API_URL).toBeDefined();
    expect(typeof GESTION_PROJECTS_API_URL).toBe('string');
  });

  it('GESTION_SITE_API_URL has a default value', () => {
    expect(GESTION_SITE_API_URL).toBeDefined();
    expect(typeof GESTION_SITE_API_URL).toBe('string');
  });

  it('INCIDENT_API_URL has a default value', () => {
    expect(INCIDENT_API_URL).toBeDefined();
    expect(typeof INCIDENT_API_URL).toBe('string');
  });

  it('PAYMENT_API_URL has a default value', () => {
    expect(PAYMENT_API_URL).toBeDefined();
    expect(typeof PAYMENT_API_URL).toBe('string');
  });

  it('PLANNING_API_URL has a default value', () => {
    expect(PLANNING_API_URL).toBeDefined();
    expect(typeof PLANNING_API_URL).toBe('string');
  });

  it('all URLs are non-empty strings', () => {
    [API_GATEWAY_URL, AUTH_API_URL, GESTION_PROJECTS_API_URL,
     GESTION_SITE_API_URL, INCIDENT_API_URL, PAYMENT_API_URL, PLANNING_API_URL
    ].forEach(url => {
      expect(url).toBeTruthy();
      expect(url.trim()).not.toBe('');
    });
  });
});
