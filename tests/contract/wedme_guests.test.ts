/**
 * T041: Contract test GET/POST/PUT /weddings/{id}/guests in tests/contract/wedme_guests.test.ts
 * 
 * This test validates the WedMe API guest management endpoints contract.
 * It MUST FAIL until the actual API endpoints are implemented.
 * 
 * Contracts being tested:
 * - GET /weddings/{weddingId}/guests
 * - POST /weddings/{weddingId}/guests 
 * - PUT /weddings/{weddingId}/guests (bulk import)
 * - PUT /weddings/{weddingId}/guests/{guestId}
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials,
  mockCoupleWedding,
  mockGuest,
  validGuestData,
  validBulkGuestData,
  mockGuestUpdate
} from './helpers/fixtures';

describe('WedMe API - Guest Management Contract', () => {
  let apiClient: ApiClient;
  const weddingId = mockCoupleWedding.id;

  beforeEach(async () => {
    apiClient = new ApiClient();
    // Authenticate as couple
    await apiClient.authenticate(validCoupleCredentials);
  });

  describe('GET /weddings/{weddingId}/guests', () => {
    test('should get wedding guest list', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/guests`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const guest = response.data[0];
        
        // Required guest fields
        expect(guest).toHaveProperty('id');
        expect(guest).toHaveProperty('first_name');
        expect(guest).toHaveProperty('last_name');
        expect(guest).toHaveProperty('rsvp_status');
        
        // Validate guest properties
        expect(typeof guest.id).toBe('string');
        expect(typeof guest.first_name).toBe('string');
        expect(typeof guest.last_name).toBe('string');
        expect(['pending', 'attending', 'not_attending', 'maybe']).toContain(guest.rsvp_status);
        
        // Validate UUID format for guest ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(guest.id).toMatch(uuidRegex);
        
        // Optional fields validation
        if (guest.email) {
          expect(typeof guest.email).toBe('string');
          expect(guest.email).toContain('@');
        }
        
        if (guest.phone) {
          expect(typeof guest.phone).toBe('string');
        }
        
        if (guest.relationship) {
          expect(typeof guest.relationship).toBe('string');
        }
        
        if (guest.plus_one_allowed !== undefined) {
          expect(typeof guest.plus_one_allowed).toBe('boolean');
        }
        
        if (guest.dietary_requirements) {
          expect(typeof guest.dietary_requirements).toBe('object');
        }
        
        if (guest.is_helper !== undefined) {
          expect(typeof guest.is_helper).toBe('boolean');
        }
        
        if (guest.helper_role) {
          expect(typeof guest.helper_role).toBe('string');
        }
        
        if (guest.rsvp_responded_at) {
          expect(typeof guest.rsvp_responded_at).toBe('string');
          expect(() => new Date(guest.rsvp_responded_at)).not.toThrow();
        }
      }
    });

    test('should filter guests by RSVP status', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/guests?rsvp_status=attending`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned guests should have attending status
      response.data.forEach((guest: any) => {
        expect(guest.rsvp_status).toBe('attending');
      });
    });

    test('should handle invalid RSVP status filter', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/guests?rsvp_status=invalid`);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get(`/weddings/${weddingId}/guests`);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.get(`/weddings/${nonExistentWeddingId}/guests`);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('POST /weddings/{weddingId}/guests', () => {
    test('should add guest to wedding', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests`, validGuestData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('first_name');
      expect(response.data).toHaveProperty('last_name');
      expect(response.data).toHaveProperty('rsvp_status');
      
      // Validate returned guest data
      expect(response.data.first_name).toBe(validGuestData.first_name);
      expect(response.data.last_name).toBe(validGuestData.last_name);
      expect(response.data.rsvp_status).toBe('pending'); // Default status
      
      if (validGuestData.email) {
        expect(response.data.email).toBe(validGuestData.email);
      }
      
      if (validGuestData.relationship) {
        expect(response.data.relationship).toBe(validGuestData.relationship);
      }
      
      if (validGuestData.plus_one_allowed !== undefined) {
        expect(response.data.plus_one_allowed).toBe(validGuestData.plus_one_allowed);
      }
      
      // Validate UUID format for guest ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });

    test('should require first_name and last_name', async () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing required fields
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate email format if provided', async () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should handle dietary requirements as object', async () => {
      const guestWithDietaryReqs = {
        ...validGuestData,
        dietary_requirements: {
          vegetarian: true,
          allergies: ['nuts', 'shellfish'],
          special_notes: 'Gluten-free preferred'
        }
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests`, guestWithDietaryReqs);
      
      expect(response.status).toBe(201);
      expect(response.data.dietary_requirements).toEqual(guestWithDietaryReqs.dietary_requirements);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post(`/weddings/${weddingId}/guests`, validGuestData);
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /weddings/{weddingId}/guests (bulk import)', () => {
    test('should bulk import guests', async () => {
      const response = await apiClient.put(`/weddings/${weddingId}/guests`, validBulkGuestData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('imported_count');
      expect(response.data).toHaveProperty('failed_count');
      expect(response.data).toHaveProperty('errors');
      
      expect(typeof response.data.imported_count).toBe('number');
      expect(typeof response.data.failed_count).toBe('number');
      expect(Array.isArray(response.data.errors)).toBe(true);
      
      expect(response.data.imported_count).toBeGreaterThanOrEqual(0);
      expect(response.data.failed_count).toBeGreaterThanOrEqual(0);
    });

    test('should validate bulk guest data format', async () => {
      const invalidBulkData = {
        guests: [
          {
            first_name: 'John'
            // Missing last_name
          }
        ]
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/guests`, invalidBulkData);
      
      expect(response.status).toBe(400);
    });

    test('should handle empty guest array', async () => {
      const emptyBulkData = {
        guests: []
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/guests`, emptyBulkData);
      
      expect(response.status).toBe(200);
      expect(response.data.imported_count).toBe(0);
      expect(response.data.failed_count).toBe(0);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${weddingId}/guests`, validBulkGuestData);
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /weddings/{weddingId}/guests/{guestId}', () => {
    const guestId = mockGuest.id;

    test('should update guest details', async () => {
      const response = await apiClient.put(`/weddings/${weddingId}/guests/${guestId}`, mockGuestUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(guestId);
      
      // Check updated fields
      if (mockGuestUpdate.first_name) {
        expect(response.data.first_name).toBe(mockGuestUpdate.first_name);
      }
      
      if (mockGuestUpdate.last_name) {
        expect(response.data.last_name).toBe(mockGuestUpdate.last_name);
      }
      
      if (mockGuestUpdate.email) {
        expect(response.data.email).toBe(mockGuestUpdate.email);
      }
      
      if (mockGuestUpdate.relationship) {
        expect(response.data.relationship).toBe(mockGuestUpdate.relationship);
      }
      
      if (mockGuestUpdate.plus_one_allowed !== undefined) {
        expect(response.data.plus_one_allowed).toBe(mockGuestUpdate.plus_one_allowed);
      }
    });

    test('should validate email format if provided', async () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/guests/${guestId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should handle photo groups array', async () => {
      const updateWithPhotoGroups = {
        photo_groups: ['family', 'bridal_party', 'college_friends']
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/guests/${guestId}`, updateWithPhotoGroups);
      
      expect(response.status).toBe(200);
      expect(response.data.photo_groups).toEqual(updateWithPhotoGroups.photo_groups);
    });

    test('should validate guest exists', async () => {
      const nonExistentGuestId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.put(`/weddings/${weddingId}/guests/${nonExistentGuestId}`, mockGuestUpdate);
      
      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${weddingId}/guests/${guestId}`, mockGuestUpdate);
      
      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle malformed UUID in path', async () => {
      const response = await apiClient.get('/weddings/invalid-uuid/guests');
      
      expect(response.status).toBe(400);
    });

    test('should prevent cross-tenant data access', async () => {
      // This would require a different couple's wedding ID
      // For now, test with non-existent wedding
      const otherWeddingId = '777e4567-e89b-12d3-a456-426614174777';
      const response = await apiClient.get(`/weddings/${otherWeddingId}/guests`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should validate request body size limits', async () => {
      // Test with very large guest list
      const largeGuestList = {
        guests: Array(1000).fill(validGuestData.guests[0])
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/guests`, largeGuestList);
      
      // Should either succeed or fail gracefully with proper error
      expect([200, 413, 422]).toContain(response.status);
    });
  });
});