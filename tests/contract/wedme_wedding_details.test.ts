/**
 * T039: Contract test GET/PUT /weddings/{id} in tests/contract/wedme_wedding_details.test.ts
 * 
 * This test validates the WedMe API wedding details endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - GET /weddings/{weddingId} - Get detailed wedding information
 * - PUT /weddings/{weddingId} - Update wedding details
 * - Authentication required
 * - UUID validation and error handling
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { mockCoupleWedding } from './helpers/fixtures';

describe('WedMe API - /weddings/{id} Contract', () => {
  let apiClient: ApiClient;
  const validWeddingId = mockCoupleWedding.id;
  const invalidWeddingId = '00000000-0000-0000-0000-000000000000';
  const malformedWeddingId = 'invalid-uuid';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('GET /weddings/{weddingId}', () => {
    test('should retrieve detailed wedding information', async () => {
      const response = await apiClient.get(`/weddings/${validWeddingId}`);
      
      expect(response.status).toBe(200);
      
      // Basic wedding fields (from Wedding schema)
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('wedding_date');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('core_details_complete');
      
      // Extended fields (from WeddingDetailed schema)
      expect(response.data).toHaveProperty('timeline');
      expect(response.data).toHaveProperty('suppliers');
      expect(response.data).toHaveProperty('guest_summary');
      
      // Field type validation
      expect(typeof response.data.id).toBe('string');
      expect(typeof response.data.title).toBe('string');
      expect(typeof response.data.wedding_date).toBe('string');
      expect(['planning', 'confirmed', 'completed', 'cancelled']).toContain(response.data.status);
      expect(typeof response.data.core_details_complete).toBe('boolean');
      
      // UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
      
      // Date format validation (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(response.data.wedding_date).toMatch(dateRegex);
      
      // Timeline validation
      expect(typeof response.data.timeline).toBe('object');
      
      // Suppliers validation
      expect(Array.isArray(response.data.suppliers)).toBe(true);
      if (response.data.suppliers.length > 0) {
        const supplier = response.data.suppliers[0];
        expect(supplier).toHaveProperty('id');
        expect(supplier).toHaveProperty('business_name');
        expect(supplier).toHaveProperty('specialization');
        expect(typeof supplier.id).toBe('string');
        expect(typeof supplier.business_name).toBe('string');
        expect(typeof supplier.specialization).toBe('string');
      }
      
      // Guest summary validation
      expect(typeof response.data.guest_summary).toBe('object');
      if (response.data.guest_summary) {
        const guestSummary = response.data.guest_summary;
        
        if (guestSummary.total_guests !== undefined) {
          expect(typeof guestSummary.total_guests).toBe('number');
          expect(guestSummary.total_guests).toBeGreaterThanOrEqual(0);
        }
        
        if (guestSummary.rsvp_pending !== undefined) {
          expect(typeof guestSummary.rsvp_pending).toBe('number');
          expect(guestSummary.rsvp_pending).toBeGreaterThanOrEqual(0);
        }
        
        if (guestSummary.attending !== undefined) {
          expect(typeof guestSummary.attending).toBe('number');
          expect(guestSummary.attending).toBeGreaterThanOrEqual(0);
        }
        
        if (guestSummary.not_attending !== undefined) {
          expect(typeof guestSummary.not_attending).toBe('number');
          expect(guestSummary.not_attending).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should handle non-existent wedding ID', async () => {
      const response = await apiClient.get(`/weddings/${invalidWeddingId}`);
      
      expect(response.status).toBe(404);
    });

    test('should validate UUID format in path parameter', async () => {
      const response = await apiClient.get(`/weddings/${malformedWeddingId}`);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get(`/weddings/${validWeddingId}`);
      
      expect(response.status).toBe(401);
    });

    test('should deny access to wedding not owned by user', async () => {
      // This test assumes there's a wedding ID that exists but belongs to another user
      const otherUserWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      
      const response = await apiClient.get(`/weddings/${otherUserWeddingId}`);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PUT /weddings/{weddingId}', () => {
    const validUpdateData = {
      title: 'Updated Wedding Title',
      wedding_date: '2024-12-20',
      guest_count_estimated: 200,
      budget_total: 75000,
      theme: 'Winter Wonderland',
      special_requirements: 'Vegetarian options required'
    };

    test('should successfully update wedding details', async () => {
      const response = await apiClient.put(`/weddings/${validWeddingId}`, validUpdateData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(validWeddingId);
      expect(response.data.title).toBe(validUpdateData.title);
      expect(response.data.wedding_date).toBe(validUpdateData.wedding_date);
      expect(response.data.guest_count_estimated).toBe(validUpdateData.guest_count_estimated);
      expect(response.data.budget_total).toBe(validUpdateData.budget_total);
      expect(response.data.theme).toBe(validUpdateData.theme);
      
      // Verify UUID format is maintained
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });

    test('should allow partial updates', async () => {
      const partialUpdate = {
        title: 'Partially Updated Wedding'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, partialUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(partialUpdate.title);
      expect(response.data).toHaveProperty('wedding_date'); // Should retain existing value
      expect(response.data).toHaveProperty('status');
    });

    test('should validate date format', async () => {
      const invalidUpdate = {
        wedding_date: 'invalid-date-format'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate guest count is positive', async () => {
      const invalidUpdate = {
        guest_count_estimated: -50
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate budget is positive', async () => {
      const invalidUpdate = {
        budget_total: -1000
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate date is not in the past', async () => {
      const invalidUpdate = {
        wedding_date: '2020-01-01'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should handle non-existent wedding ID', async () => {
      const response = await apiClient.put(`/weddings/${invalidWeddingId}`, validUpdateData);
      
      expect(response.status).toBe(404);
    });

    test('should validate UUID format in path parameter', async () => {
      const response = await apiClient.put(`/weddings/${malformedWeddingId}`, validUpdateData);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${validWeddingId}`, validUpdateData);
      
      expect(response.status).toBe(401);
    });

    test('should deny access to wedding not owned by user', async () => {
      const otherUserWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      
      const response = await apiClient.put(`/weddings/${otherUserWeddingId}`, validUpdateData);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle empty update gracefully', async () => {
      const emptyUpdate = {};
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, emptyUpdate);
      
      // Should either succeed with no changes or return 400 for empty body
      expect([200, 400]).toContain(response.status);
    });

    test('should preserve fields not included in update', async () => {
      const limitedUpdate = {
        title: 'New Title Only'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}`, limitedUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(limitedUpdate.title);
      // Other fields should be preserved
      expect(response.data).toHaveProperty('wedding_date');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('core_details_complete');
    });
  });

  describe('Content Type Validation', () => {
    test('should require JSON content type for PUT', async () => {
      const response = await apiClient.putRaw(`/weddings/${validWeddingId}`, 'invalid-content');
      
      expect(response.status).toBe(400);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await apiClient.putRaw(`/weddings/${validWeddingId}`, '{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });
});