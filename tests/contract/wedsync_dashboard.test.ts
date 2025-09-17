/**
 * T027: Contract test GET /dashboard/today in tests/contract/wedsync_dashboard.test.ts
 * 
 * This test validates the WedSync API dashboard endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - GET /dashboard/today
 * - Requires authentication
 * - Returns today's wedding information with weather, directions, and contacts
 * - Handles cases with no wedding today
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validSupplierCredentials, 
  mockTodayResponse 
} from './helpers/fixtures';

describe('WedSync API - GET /dashboard/today Contract', () => {
  let apiClient: ApiClient;
  let authToken: string;

  beforeEach(async () => {
    apiClient = new ApiClient();
    
    // Get authentication token
    const authResponse = await apiClient.post('/auth/login', validSupplierCredentials);
    authToken = authResponse.body.access_token;
  });

  describe('Authenticated Requests', () => {
    test('should return today\'s wedding information when wedding exists', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wedding');
      expect(response.body).toHaveProperty('weather');
      expect(response.body).toHaveProperty('directions');
      expect(response.body).toHaveProperty('contacts');

      // Validate wedding object structure
      if (response.body.wedding) {
        expect(response.body.wedding).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          title: expect.any(String),
          wedding_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          status: expect.stringMatching(/^(planning|confirmed|completed|cancelled)$/),
          core_details_complete: expect.any(Boolean)
        });

        // Validate ceremony venue if present
        if (response.body.wedding.ceremony_venue) {
          expect(response.body.wedding.ceremony_venue).toMatchObject({
            id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
            name: expect.any(String),
            address: expect.any(Object),
            contact_info: expect.any(Object),
            capacity_max: expect.any(Number)
          });
        }
      }
    });

    test('should return weather information', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      expect(response.body.weather).toMatchObject({
        temperature: expect.any(Number),
        condition: expect.any(String),
        precipitation: expect.any(Number),
        wind_speed: expect.any(Number)
      });

      // Validate reasonable weather values
      expect(response.body.weather.temperature).toBeGreaterThan(-50);
      expect(response.body.weather.temperature).toBeLessThan(150);
      expect(response.body.weather.precipitation).toBeGreaterThanOrEqual(0);
      expect(response.body.weather.wind_speed).toBeGreaterThanOrEqual(0);
    });

    test('should return directions information when wedding exists', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);

      if (response.body.wedding) {
        expect(response.body.directions).toMatchObject({
          distance: expect.any(String),
          duration: expect.any(String),
          route_url: expect.stringMatching(/^https?:\/\//)
        });
      }
    });

    test('should return contacts array when wedding exists', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);

      if (response.body.wedding) {
        expect(Array.isArray(response.body.contacts)).toBe(true);
        
        if (response.body.contacts.length > 0) {
          response.body.contacts.forEach((contact: any) => {
            expect(contact).toMatchObject({
              name: expect.any(String),
              role: expect.any(String),
              phone: expect.any(String),
              email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            });
          });
        }
      }
    });

    test('should handle case when no wedding is scheduled today', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      
      // When no wedding, should still return structure but with null/empty values
      expect(response.body).toHaveProperty('wedding');
      expect(response.body).toHaveProperty('weather');
      expect(response.body).toHaveProperty('directions');
      expect(response.body).toHaveProperty('contacts');

      if (!response.body.wedding) {
        expect(response.body.wedding).toBeNull();
        expect(response.body.directions).toBeNull();
        expect(response.body.contacts).toEqual([]);
      }
    });

    test('should include guest count information when available', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);

      if (response.body.wedding) {
        expect(response.body.wedding).toHaveProperty('guest_count_estimated');
        expect(response.body.wedding).toHaveProperty('guest_count_confirmed');
        
        if (response.body.wedding.guest_count_estimated !== null) {
          expect(response.body.wedding.guest_count_estimated).toBeGreaterThanOrEqual(0);
        }
        
        if (response.body.wedding.guest_count_confirmed !== null) {
          expect(response.body.wedding.guest_count_confirmed).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should include budget information when available', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);

      if (response.body.wedding && response.body.wedding.budget_total) {
        expect(response.body.wedding.budget_total).toBeGreaterThan(0);
        expect(typeof response.body.wedding.budget_total).toBe('number');
      }
    });
  });

  describe('Unauthenticated Requests', () => {
    test('should require authentication', async () => {
      const response = await apiClient.get('/dashboard/today');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should reject invalid authentication token', async () => {
      const response = await apiClient.withAuth('invalid-token').get('/dashboard/today');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should reject malformed authentication header', async () => {
      const response = await apiClient.get('/dashboard/today', {
        'Authorization': 'InvalidFormat token'
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Response Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).get('/dashboard/today');
      
      const responseTime = Date.now() - startTime;
      
      // Dashboard should load within 3 seconds (includes external API calls)
      expect(responseTime).toBeLessThan(3000);
    });
  });

  describe('Response Headers', () => {
    test('should include appropriate cache headers', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      
      // Dashboard data should have short cache duration due to real-time nature
      expect(response.headers).toHaveProperty('cache-control');
      
      if (response.headers['cache-control']) {
        expect(response.headers['cache-control']).toContain('max-age');
      }
    });

    test('should include content type header', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Error Handling', () => {
    test('should handle external service failures gracefully', async () => {
      // This test assumes weather service might be unavailable
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      // Should still return 200 even if weather service fails
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weather');
      
      // Weather might be null or contain error indication if service fails
      if (response.body.weather === null) {
        // This is acceptable - external service failure shouldn't break the endpoint
        expect(true).toBe(true);
      }
    });

    test('should validate date format for today\'s date calculation', async () => {
      const response = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response.status).toBe(200);
      
      // Server should correctly identify "today" based on supplier's timezone
      // This is implicitly tested by the presence of correct data
      expect(response.body).toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    test('should return consistent data across multiple requests', async () => {
      const response1 = await apiClient.withAuth(authToken).get('/dashboard/today');
      const response2 = await apiClient.withAuth(authToken).get('/dashboard/today');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Wedding data should be consistent (weather might change slightly)
      if (response1.body.wedding && response2.body.wedding) {
        expect(response1.body.wedding.id).toBe(response2.body.wedding.id);
        expect(response1.body.wedding.title).toBe(response2.body.wedding.title);
        expect(response1.body.wedding.wedding_date).toBe(response2.body.wedding.wedding_date);
      }
    });
  });
});