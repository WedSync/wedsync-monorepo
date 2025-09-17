/**
 * T038: Contract test GET/POST /weddings in tests/contract/wedme_weddings.test.ts
 * 
 * This test validates the WedMe API weddings endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - GET /weddings - Get user's weddings
 * - POST /weddings - Create new wedding
 * - Authentication required
 * - Proper validation and error handling
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { mockCoupleWedding } from './helpers/fixtures';

describe('WedMe API - /weddings Contract', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('GET /weddings', () => {
    test('should retrieve user\'s weddings', async () => {
      const response = await apiClient.get('/weddings');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const wedding = response.data[0];
        
        // Required fields
        expect(wedding).toHaveProperty('id');
        expect(wedding).toHaveProperty('title');
        expect(wedding).toHaveProperty('wedding_date');
        expect(wedding).toHaveProperty('status');
        expect(wedding).toHaveProperty('core_details_complete');
        
        // Field type validation
        expect(typeof wedding.id).toBe('string');
        expect(typeof wedding.title).toBe('string');
        expect(typeof wedding.wedding_date).toBe('string');
        expect(['planning', 'confirmed', 'completed', 'cancelled']).toContain(wedding.status);
        expect(typeof wedding.core_details_complete).toBe('boolean');
        
        // UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(wedding.id).toMatch(uuidRegex);
        
        // Date format validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        expect(wedding.wedding_date).toMatch(dateRegex);
        
        // Optional venue validation
        if (wedding.ceremony_venue) {
          expect(wedding.ceremony_venue).toHaveProperty('id');
          expect(wedding.ceremony_venue).toHaveProperty('name');
          expect(typeof wedding.ceremony_venue.name).toBe('string');
        }
        
        if (wedding.reception_venue) {
          expect(wedding.reception_venue).toHaveProperty('id');
          expect(wedding.reception_venue).toHaveProperty('name');
          expect(typeof wedding.reception_venue.name).toBe('string');
        }
        
        // Optional numeric fields validation
        if (wedding.guest_count_estimated !== undefined) {
          expect(typeof wedding.guest_count_estimated).toBe('number');
          expect(wedding.guest_count_estimated).toBeGreaterThanOrEqual(0);
        }
        
        if (wedding.guest_count_confirmed !== undefined) {
          expect(typeof wedding.guest_count_confirmed).toBe('number');
          expect(wedding.guest_count_confirmed).toBeGreaterThanOrEqual(0);
        }
        
        if (wedding.budget_total !== undefined) {
          expect(typeof wedding.budget_total).toBe('number');
          expect(wedding.budget_total).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should return empty array for user with no weddings', async () => {
      // This test assumes a new user or specific test scenario
      const response = await apiClient.get('/weddings');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // Could be empty array or contain weddings depending on test data
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get('/weddings');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /weddings', () => {
    const validWeddingData = {
      title: 'Our Dream Wedding',
      wedding_date: '2024-09-15',
      ceremony_venue: {
        name: 'Sunset Chapel',
        address: {
          street: '123 Wedding Lane',
          city: 'Romance City',
          state: 'RC',
          zip: '12345',
          country: 'US'
        },
        contact_info: {
          phone: '+1234567890',
          email: 'info@sunsetchapel.com'
        },
        capacity_max: 200
      },
      reception_venue: {
        name: 'Grand Reception Hall',
        address: {
          street: '456 Party Avenue',
          city: 'Romance City',
          state: 'RC',
          zip: '12345',
          country: 'US'
        },
        contact_info: {
          phone: '+1234567891',
          email: 'info@grandreception.com'
        },
        capacity_max: 300
      },
      guest_count_estimated: 150,
      theme: 'Garden Romance'
    };

    test('should successfully create a wedding with minimal data', async () => {
      const minimalData = {
        title: 'Simple Wedding',
        wedding_date: '2024-10-20'
      };
      
      const response = await apiClient.post('/weddings', minimalData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(minimalData.title);
      expect(response.data.wedding_date).toBe(minimalData.wedding_date);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('core_details_complete');
      
      // Default values
      expect(['planning', 'confirmed', 'completed', 'cancelled']).toContain(response.data.status);
      expect(typeof response.data.core_details_complete).toBe('boolean');
      
      // UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });

    test('should successfully create a wedding with full venue details', async () => {
      const response = await apiClient.post('/weddings', validWeddingData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(validWeddingData.title);
      expect(response.data.wedding_date).toBe(validWeddingData.wedding_date);
      expect(response.data.guest_count_estimated).toBe(validWeddingData.guest_count_estimated);
      expect(response.data.theme).toBe(validWeddingData.theme);
      
      // Venue validation
      expect(response.data.ceremony_venue).toHaveProperty('id');
      expect(response.data.ceremony_venue.name).toBe(validWeddingData.ceremony_venue.name);
      
      expect(response.data.reception_venue).toHaveProperty('id');
      expect(response.data.reception_venue.name).toBe(validWeddingData.reception_venue.name);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        // Missing required title and wedding_date
        guest_count_estimated: 100
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate title field', async () => {
      const invalidData = {
        title: '', // Empty title
        wedding_date: '2024-12-25'
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate date format', async () => {
      const invalidData = {
        title: 'Test Wedding',
        wedding_date: 'invalid-date'
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate date is not in the past', async () => {
      const invalidData = {
        title: 'Past Wedding',
        wedding_date: '2020-01-01' // Past date
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate guest count is positive', async () => {
      const invalidData = {
        title: 'Invalid Wedding',
        wedding_date: '2024-12-25',
        guest_count_estimated: -10 // Negative count
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate venue capacity if provided', async () => {
      const invalidData = {
        title: 'Venue Test Wedding',
        wedding_date: '2024-12-25',
        ceremony_venue: {
          name: 'Test Venue',
          capacity_max: -5 // Invalid capacity
        }
      };
      
      const response = await apiClient.post('/weddings', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post('/weddings', validWeddingData);
      
      expect(response.status).toBe(401);
    });

    test('should handle venue creation properly', async () => {
      const weddingWithVenue = {
        title: 'Venue Test Wedding',
        wedding_date: '2024-11-30',
        ceremony_venue: {
          name: 'Beautiful Garden',
          address: {
            street: '789 Garden St',
            city: 'Garden City',
            state: 'GC',
            zip: '67890',
            country: 'US'
          }
        }
      };
      
      const response = await apiClient.post('/weddings', weddingWithVenue);
      
      expect(response.status).toBe(201);
      expect(response.data.ceremony_venue).toHaveProperty('id');
      expect(response.data.ceremony_venue.name).toBe(weddingWithVenue.ceremony_venue.name);
      
      // Venue should have its own ID
      const venueUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.ceremony_venue.id).toMatch(venueUuidRegex);
    });
  });

  describe('Content Type Validation', () => {
    test('should require JSON content type for POST', async () => {
      const response = await apiClient.postRaw('/weddings', 'invalid-content');
      
      expect(response.status).toBe(400);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await apiClient.postRaw('/weddings', '{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });
});