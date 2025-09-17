/**
 * T042: Contract test POST /weddings/{id}/guests/{id}/rsvp in tests/contract/wedme_rsvp.test.ts
 * 
 * This test validates the WedMe API guest RSVP endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - POST /weddings/{weddingId}/guests/{guestId}/rsvp
 * - Records guest RSVP responses
 * - Handles RSVP status, plus-one details, dietary requirements
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials,
  mockCoupleWedding,
  mockGuest,
  validRsvpData,
  mockRsvpWithPlusOne,
  mockRsvpDecline
} from './helpers/fixtures';

describe('WedMe API - POST /weddings/{weddingId}/guests/{guestId}/rsvp Contract', () => {
  let apiClient: ApiClient;
  const weddingId = mockCoupleWedding.id;
  const guestId = mockGuest.id;

  beforeEach(async () => {
    apiClient = new ApiClient();
    // Authenticate as couple
    await apiClient.authenticate(validCoupleCredentials);
  });

  describe('Valid RSVP Responses', () => {
    test('should record attending RSVP', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('rsvp_status');
      expect(response.data).toHaveProperty('rsvp_responded_at');
      
      // Validate RSVP response
      expect(response.data.rsvp_status).toBe(validRsvpData.rsvp_status);
      expect(typeof response.data.rsvp_responded_at).toBe('string');
      
      // Validate timestamp format
      expect(() => new Date(response.data.rsvp_responded_at)).not.toThrow();
      
      // Check that response includes guest data
      expect(response.data).toHaveProperty('first_name');
      expect(response.data).toHaveProperty('last_name');
      
      // Validate UUID format for guest ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });

    test('should record RSVP with plus-one details', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, mockRsvpWithPlusOne);
      
      expect(response.status).toBe(200);
      expect(response.data.rsvp_status).toBe('attending');
      expect(response.data.plus_one_name).toBe(mockRsvpWithPlusOne.plus_one_name);
      
      // Validate plus-one name
      expect(typeof response.data.plus_one_name).toBe('string');
      expect(response.data.plus_one_name.length).toBeGreaterThan(0);
    });

    test('should record RSVP with dietary requirements', async () => {
      const rsvpWithDietary = {
        rsvp_status: 'attending' as const,
        dietary_requirements: {
          vegetarian: true,
          allergies: ['nuts', 'shellfish'],
          special_notes: 'Gluten-free preferred'
        }
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, rsvpWithDietary);
      
      expect(response.status).toBe(200);
      expect(response.data.dietary_requirements).toEqual(rsvpWithDietary.dietary_requirements);
      
      // Validate dietary requirements structure
      expect(typeof response.data.dietary_requirements).toBe('object');
      expect(response.data.dietary_requirements.vegetarian).toBe(true);
      expect(Array.isArray(response.data.dietary_requirements.allergies)).toBe(true);
      expect(typeof response.data.dietary_requirements.special_notes).toBe('string');
    });

    test('should record declining RSVP', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, mockRsvpDecline);
      
      expect(response.status).toBe(200);
      expect(response.data.rsvp_status).toBe('not_attending');
      
      // Special notes should be recorded
      if (mockRsvpDecline.special_notes) {
        expect(response.data.special_notes).toBe(mockRsvpDecline.special_notes);
      }
    });

    test('should record maybe RSVP', async () => {
      const maybeRsvp = {
        rsvp_status: 'maybe' as const,
        special_notes: 'Will confirm closer to date'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, maybeRsvp);
      
      expect(response.status).toBe(200);
      expect(response.data.rsvp_status).toBe('maybe');
      expect(response.data.special_notes).toBe(maybeRsvp.special_notes);
    });

    test('should update existing RSVP', async () => {
      // First RSVP
      await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, {
        rsvp_status: 'maybe' as const
      });
      
      // Update RSVP
      const updatedRsvp = {
        rsvp_status: 'attending' as const,
        plus_one_name: 'Updated Plus One'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, updatedRsvp);
      
      expect(response.status).toBe(200);
      expect(response.data.rsvp_status).toBe('attending');
      expect(response.data.plus_one_name).toBe('Updated Plus One');
    });
  });

  describe('Request Validation', () => {
    test('should require rsvp_status', async () => {
      const invalidData = {
        plus_one_name: 'John Doe'
        // Missing required rsvp_status
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate rsvp_status values', async () => {
      const invalidData = {
        rsvp_status: 'invalid_status'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate dietary_requirements as object', async () => {
      const invalidData = {
        rsvp_status: 'attending' as const,
        dietary_requirements: 'string instead of object'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should handle empty dietary requirements object', async () => {
      const validData = {
        rsvp_status: 'attending' as const,
        dietary_requirements: {}
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validData);
      
      expect(response.status).toBe(200);
      expect(response.data.dietary_requirements).toEqual({});
    });

    test('should validate plus_one_name when provided', async () => {
      const dataWithEmptyPlusOne = {
        rsvp_status: 'attending' as const,
        plus_one_name: ''
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, dataWithEmptyPlusOne);
      
      // Should either accept empty string or reject it
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // If accepted, should be stored as null or empty string
        expect([null, '', undefined]).toContain(response.data.plus_one_name);
      }
    });
  });

  describe('Authorization and Access Control', () => {
    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.post(`/weddings/${nonExistentWeddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should validate guest exists in wedding', async () => {
      const nonExistentGuestId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${nonExistentGuestId}/rsvp`, validRsvpData);
      
      expect(response.status).toBe(404);
    });

    test('should prevent cross-tenant access', async () => {
      // Test with guest from different wedding/couple
      const otherWeddingId = '777e4567-e89b-12d3-a456-426614174777';
      const response = await apiClient.post(`/weddings/${otherWeddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed UUID in wedding path', async () => {
      const response = await apiClient.post('/weddings/invalid-uuid/guests/${guestId}/rsvp', validRsvpData);
      
      expect(response.status).toBe(400);
    });

    test('should handle malformed UUID in guest path', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests/invalid-uuid/rsvp`, validRsvpData);
      
      expect(response.status).toBe(400);
    });

    test('should handle very long special notes', async () => {
      const longNotesData = {
        rsvp_status: 'attending' as const,
        special_notes: 'A'.repeat(1000) // Very long string
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, longNotesData);
      
      // Should either accept or reject gracefully
      expect([200, 400, 413]).toContain(response.status);
    });

    test('should handle very long plus-one name', async () => {
      const longPlusOneData = {
        rsvp_status: 'attending' as const,
        plus_one_name: 'Very Long Plus One Name That Exceeds Normal Length Expectations'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, longPlusOneData);
      
      // Should either accept or reject gracefully
      expect([200, 400]).toContain(response.status);
    });

    test('should handle complex dietary requirements', async () => {
      const complexDietaryData = {
        rsvp_status: 'attending' as const,
        dietary_requirements: {
          vegetarian: true,
          vegan: false,
          gluten_free: true,
          dairy_free: false,
          nut_free: true,
          allergies: ['shellfish', 'eggs', 'soy'],
          medical_conditions: ['diabetes', 'celiac'],
          special_instructions: 'Please ensure all food is prepared in a nut-free environment',
          emergency_contact: {
            name: 'Emergency Contact',
            phone: '+1234567890'
          }
        }
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, complexDietaryData);
      
      expect(response.status).toBe(200);
      expect(response.data.dietary_requirements).toEqual(complexDietaryData.dietary_requirements);
    });
  });

  describe('Business Logic', () => {
    test('should allow RSVP changes up until wedding date', async () => {
      // This test validates that RSVP changes are allowed
      // Business rule implementation would need to check wedding date
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect(response.status).toBe(200);
    });

    test('should track RSVP response timestamp', async () => {
      const beforeRsvp = new Date();
      
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      const afterRsvp = new Date();
      
      expect(response.status).toBe(200);
      expect(response.data.rsvp_responded_at).toBeDefined();
      
      const responseTime = new Date(response.data.rsvp_responded_at);
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeRsvp.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterRsvp.getTime());
    });

    test('should preserve guest information after RSVP', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/guests/${guestId}/rsvp`, validRsvpData);
      
      expect(response.status).toBe(200);
      
      // Original guest data should be preserved
      expect(response.data.first_name).toBeDefined();
      expect(response.data.last_name).toBeDefined();
      expect(response.data.email).toBeDefined();
      
      // RSVP should not modify original guest relationship or other core data
      expect(response.data.relationship).toBeDefined();
      expect(response.data.plus_one_allowed).toBeDefined();
    });
  });
});