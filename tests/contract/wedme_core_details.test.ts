/**
 * T040: Contract test PUT /weddings/{id}/core-details in tests/contract/wedme_core_details.test.ts
 * 
 * This test validates the WedMe API core wedding details endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - PUT /weddings/{weddingId}/core-details - Update core wedding details
 * - Updates wedding date, venues, guest count, theme, and special requirements
 * - Authentication required
 * - UUID validation and error handling
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { mockCoupleWedding } from './helpers/fixtures';

describe('WedMe API - PUT /weddings/{id}/core-details Contract', () => {
  let apiClient: ApiClient;
  const validWeddingId = mockCoupleWedding.id;
  const invalidWeddingId = '00000000-0000-0000-0000-000000000000';
  const malformedWeddingId = 'invalid-uuid';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('PUT /weddings/{weddingId}/core-details', () => {
    const validCoreDetails = {
      wedding_date: '2024-12-25',
      ceremony_venue: {
        name: 'Christmas Chapel',
        address: {
          street: '123 Holiday Lane',
          city: 'Christmas City',
          state: 'CC',
          zip: '12345',
          country: 'US'
        },
        contact_info: {
          phone: '+1234567890',
          email: 'info@christmaschapel.com'
        },
        capacity_max: 150
      },
      reception_venue: {
        name: 'Winter Wonderland Hall',
        address: {
          street: '456 Snow Avenue',
          city: 'Christmas City',
          state: 'CC',
          zip: '12345',
          country: 'US'
        },
        contact_info: {
          phone: '+1234567891',
          email: 'info@winterhall.com'
        },
        capacity_max: 200
      },
      guest_count_estimated: 125,
      theme: 'Christmas Magic',
      special_requirements: 'Vegan options, wheelchair accessible'
    };

    test('should successfully update all core details', async () => {
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, validCoreDetails);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(validWeddingId);
      
      // Verify all updated fields
      expect(response.data.wedding_date).toBe(validCoreDetails.wedding_date);
      expect(response.data.guest_count_estimated).toBe(validCoreDetails.guest_count_estimated);
      expect(response.data.theme).toBe(validCoreDetails.theme);
      
      // Verify venue updates
      expect(response.data.ceremony_venue).toHaveProperty('id');
      expect(response.data.ceremony_venue.name).toBe(validCoreDetails.ceremony_venue.name);
      
      expect(response.data.reception_venue).toHaveProperty('id');
      expect(response.data.reception_venue.name).toBe(validCoreDetails.reception_venue.name);
      
      // Verify UUID format is maintained
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
      expect(response.data.ceremony_venue.id).toMatch(uuidRegex);
      expect(response.data.reception_venue.id).toMatch(uuidRegex);
    });

    test('should allow partial core details updates', async () => {
      const partialUpdate = {
        wedding_date: '2024-11-30',
        theme: 'Autumn Romance'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, partialUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.wedding_date).toBe(partialUpdate.wedding_date);
      expect(response.data.theme).toBe(partialUpdate.theme);
      
      // Should preserve existing fields
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('status');
    });

    test('should update only ceremony venue', async () => {
      const ceremonyOnlyUpdate = {
        ceremony_venue: {
          name: 'New Beautiful Church',
          address: {
            street: '789 Church Street',
            city: 'Faith City',
            state: 'FC',
            zip: '54321',
            country: 'US'
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, ceremonyOnlyUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.ceremony_venue.name).toBe(ceremonyOnlyUpdate.ceremony_venue.name);
      
      // Should preserve reception venue if it exists
      expect(response.data).toHaveProperty('reception_venue');
    });

    test('should update only reception venue', async () => {
      const receptionOnlyUpdate = {
        reception_venue: {
          name: 'Grand Ballroom Updated',
          address: {
            street: '999 Reception Blvd',
            city: 'Party City',
            state: 'PC',
            zip: '99999',
            country: 'US'
          },
          capacity_max: 300
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, receptionOnlyUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.reception_venue.name).toBe(receptionOnlyUpdate.reception_venue.name);
      
      // Should preserve ceremony venue if it exists
      expect(response.data).toHaveProperty('ceremony_venue');
    });

    test('should validate wedding date format', async () => {
      const invalidUpdate = {
        wedding_date: 'invalid-date-format'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate wedding date is not in the past', async () => {
      const invalidUpdate = {
        wedding_date: '2020-01-01'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate guest count is positive', async () => {
      const invalidUpdate = {
        guest_count_estimated: -25
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate venue capacity if provided', async () => {
      const invalidUpdate = {
        ceremony_venue: {
          name: 'Test Venue',
          capacity_max: -10
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should require venue name when updating venue', async () => {
      const invalidUpdate = {
        ceremony_venue: {
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TC',
            zip: '12345',
            country: 'US'
          }
          // Missing required name field
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should handle guest count that exceeds venue capacity', async () => {
      const conflictingUpdate = {
        guest_count_estimated: 500,
        ceremony_venue: {
          name: 'Small Chapel',
          capacity_max: 50
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, conflictingUpdate);
      
      // Should either succeed with warning or fail with validation error
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // If it succeeds, data should be updated as requested
        expect(response.data.guest_count_estimated).toBe(conflictingUpdate.guest_count_estimated);
        expect(response.data.ceremony_venue.name).toBe(conflictingUpdate.ceremony_venue.name);
      }
    });

    test('should handle non-existent wedding ID', async () => {
      const response = await apiClient.put(`/weddings/${invalidWeddingId}/core-details`, validCoreDetails);
      
      expect(response.status).toBe(404);
    });

    test('should validate UUID format in path parameter', async () => {
      const response = await apiClient.put(`/weddings/${malformedWeddingId}/core-details`, validCoreDetails);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${validWeddingId}/core-details`, validCoreDetails);
      
      expect(response.status).toBe(401);
    });

    test('should deny access to wedding not owned by user', async () => {
      const otherUserWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      
      const response = await apiClient.put(`/weddings/${otherUserWeddingId}/core-details`, validCoreDetails);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle empty update request', async () => {
      const emptyUpdate = {};
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, emptyUpdate);
      
      // Should either succeed with no changes or return 400 for empty body
      expect([200, 400]).toContain(response.status);
    });

    test('should update core_details_complete status appropriately', async () => {
      const completeUpdate = {
        wedding_date: '2024-12-31',
        ceremony_venue: {
          name: 'Complete Venue',
          address: {
            street: '123 Complete St',
            city: 'Complete City',
            state: 'CC',
            zip: '12345',
            country: 'US'
          }
        },
        guest_count_estimated: 100,
        theme: 'Complete Theme'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, completeUpdate);
      
      expect(response.status).toBe(200);
      
      // Should have core_details_complete field
      expect(response.data).toHaveProperty('core_details_complete');
      expect(typeof response.data.core_details_complete).toBe('boolean');
      
      // With substantial core details provided, should likely be true
      // But this depends on business logic implementation
    });

    test('should preserve other wedding fields not related to core details', async () => {
      const coreUpdate = {
        wedding_date: '2024-10-15',
        theme: 'Updated Theme'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, coreUpdate);
      
      expect(response.status).toBe(200);
      
      // Core details should be updated
      expect(response.data.wedding_date).toBe(coreUpdate.wedding_date);
      expect(response.data.theme).toBe(coreUpdate.theme);
      
      // Non-core fields should be preserved
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('id');
    });
  });

  describe('Content Type Validation', () => {
    test('should require JSON content type', async () => {
      const response = await apiClient.putRaw(`/weddings/${validWeddingId}/core-details`, 'invalid-content');
      
      expect(response.status).toBe(400);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await apiClient.putRaw(`/weddings/${validWeddingId}/core-details`, '{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });

  describe('Business Logic Validation', () => {
    test('should handle venue address validation', async () => {
      const updateWithIncompleteAddress = {
        ceremony_venue: {
          name: 'Test Venue',
          address: {
            street: '123 Test St'
            // Missing city, state, zip, country
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, updateWithIncompleteAddress);
      
      // Should either succeed (if partial addresses allowed) or fail with validation
      expect([200, 400]).toContain(response.status);
    });

    test('should handle special characters in theme and requirements', async () => {
      const updateWithSpecialChars = {
        theme: 'Römantiç & Élégant™',
        special_requirements: 'Kosher + Halal meals, sign language interpreter, HVAC at 68°F'
      };
      
      const response = await apiClient.put(`/weddings/${validWeddingId}/core-details`, updateWithSpecialChars);
      
      expect(response.status).toBe(200);
      expect(response.data.theme).toBe(updateWithSpecialChars.theme);
    });
  });
});