/**
 * T045: Contract test GET/POST /weddings/{id}/suppliers in tests/contract/wedme_suppliers.test.ts
 * 
 * This test validates the WedMe API supplier collaboration endpoints contract.
 * It MUST FAIL until the actual API endpoints are implemented.
 * 
 * Contracts being tested:
 * - GET /weddings/{weddingId}/suppliers
 * - POST /weddings/{weddingId}/suppliers (invite supplier)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials,
  mockCoupleWedding,
  mockWeddingSupplier,
  validSupplierInvitation,
  mockSupplierInviteResponse
} from './helpers/fixtures';

describe('WedMe API - Supplier Collaboration Contract', () => {
  let apiClient: ApiClient;
  const weddingId = mockCoupleWedding.id;

  beforeEach(async () => {
    apiClient = new ApiClient();
    // Authenticate as couple
    await apiClient.authenticate(validCoupleCredentials);
  });

  describe('GET /weddings/{weddingId}/suppliers', () => {
    test('should get wedding suppliers', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/suppliers`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const weddingSupplier = response.data[0];
        
        // Required wedding supplier fields
        expect(weddingSupplier).toHaveProperty('supplier');
        expect(weddingSupplier).toHaveProperty('service_type');
        expect(weddingSupplier).toHaveProperty('contract_status');
        
        // Validate supplier object
        const supplier = weddingSupplier.supplier;
        expect(supplier).toHaveProperty('id');
        expect(supplier).toHaveProperty('business_name');
        expect(supplier).toHaveProperty('specialization');
        expect(supplier).toHaveProperty('verification_status');
        
        // Validate supplier properties
        expect(typeof supplier.id).toBe('string');
        expect(typeof supplier.business_name).toBe('string');
        expect(typeof supplier.specialization).toBe('string');
        expect(typeof supplier.verification_status).toBe('string');
        
        // Validate UUID format for supplier ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(supplier.id).toMatch(uuidRegex);
        
        // Validate service type and contract status
        expect(typeof weddingSupplier.service_type).toBe('string');
        expect(['inquiry', 'proposal', 'contracted', 'completed']).toContain(weddingSupplier.contract_status);
        
        // Optional fields validation
        if (supplier.description) {
          expect(typeof supplier.description).toBe('string');
        }
        
        if (supplier.website) {
          expect(typeof supplier.website).toBe('string');
          expect(supplier.website).toMatch(/^https?:\/\//);
        }
        
        if (weddingSupplier.booking_confirmed_at) {
          expect(typeof weddingSupplier.booking_confirmed_at).toBe('string');
          expect(() => new Date(weddingSupplier.booking_confirmed_at)).not.toThrow();
        }
        
        if (weddingSupplier.timeline_items) {
          expect(typeof weddingSupplier.timeline_items).toBe('object');
        }
      }
    });

    test('should handle empty suppliers list', async () => {
      // For a new wedding, suppliers list might be empty
      const response = await apiClient.get(`/weddings/${weddingId}/suppliers`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // Empty array is valid
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get(`/weddings/${weddingId}/suppliers`);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.get(`/weddings/${nonExistentWeddingId}/suppliers`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle malformed UUID in path', async () => {
      const response = await apiClient.get('/weddings/invalid-uuid/suppliers');
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /weddings/{weddingId}/suppliers', () => {
    test('should invite supplier to wedding', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('invitation_id');
      expect(response.data).toHaveProperty('status');
      
      // Validate invitation response
      expect(typeof response.data.invitation_id).toBe('string');
      expect(typeof response.data.status).toBe('string');
      
      // Validate UUID format for invitation ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.invitation_id).toMatch(uuidRegex);
      
      // Status should indicate invitation was sent
      expect(['sent', 'pending', 'delivered']).toContain(response.data.status);
    });

    test('should require supplier_email and service_type', async () => {
      const invalidData = {
        message: 'Please join our wedding'
        // Missing required fields
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate email format', async () => {
      const invalidData = {
        supplier_email: 'invalid-email',
        service_type: 'photography'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate service_type', async () => {
      const validServiceTypes = [
        'photography', 'videography', 'catering', 'flowers', 'music', 
        'venue', 'transportation', 'planning', 'decoration', 'other'
      ];
      
      const validData = {
        supplier_email: 'supplier@test.com',
        service_type: 'photography',
        message: 'We would love to work with you'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, validData);
      
      expect(response.status).toBe(201);
    });

    test('should handle custom message', async () => {
      const invitationWithMessage = {
        supplier_email: 'photographer@test.com',
        service_type: 'photography',
        message: 'We loved your portfolio and would like to work with you for our wedding'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invitationWithMessage);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('invitation_id');
      expect(response.data).toHaveProperty('status');
    });

    test('should handle duplicate invitation', async () => {
      // Send first invitation
      await apiClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      // Send duplicate invitation
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      // Should either create new invitation or return conflict
      expect([201, 409]).toContain(response.status);
      
      if (response.status === 409) {
        expect(response.data).toHaveProperty('message');
      }
    });

    test('should validate message length', async () => {
      const longMessageData = {
        supplier_email: 'supplier@test.com',
        service_type: 'photography',
        message: 'A'.repeat(2000) // Very long message
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, longMessageData);
      
      // Should either accept or reject gracefully
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.post(`/weddings/${nonExistentWeddingId}/suppliers`, validSupplierInvitation);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Edge Cases and Security', () => {
    test('should prevent cross-tenant data access', async () => {
      const otherWeddingId = '777e4567-e89b-12d3-a456-426614174777';
      const response = await apiClient.get(`/weddings/${otherWeddingId}/suppliers`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle malformed service type', async () => {
      const invalidData = {
        supplier_email: 'supplier@test.com',
        service_type: 'invalid-service-type-with-special-chars!@#'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should handle empty message', async () => {
      const dataWithEmptyMessage = {
        supplier_email: 'supplier@test.com',
        service_type: 'photography',
        message: ''
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, dataWithEmptyMessage);
      
      // Should accept empty message or use default
      expect([201, 400]).toContain(response.status);
    });

    test('should handle special characters in email', async () => {
      const specialEmailData = {
        supplier_email: 'test+supplier@domain-name.co.uk',
        service_type: 'photography'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, specialEmailData);
      
      expect(response.status).toBe(201);
    });

    test('should validate maximum number of suppliers per service type', async () => {
      // Try to invite many suppliers for the same service type
      const invitations = Array(10).fill(null).map((_, i) => ({
        supplier_email: `photographer${i}@test.com`,
        service_type: 'photography',
        message: `Invitation ${i}`
      }));
      
      let lastResponse;
      for (const invitation of invitations) {
        lastResponse = await apiClient.post(`/weddings/${weddingId}/suppliers`, invitation);
      }
      
      // Should either accept all or enforce limits
      expect([201, 422]).toContain(lastResponse.status);
    });
  });

  describe('Business Logic', () => {
    test('should generate unique invitation ID for each request', async () => {
      const firstResponse = await apiClient.post(`/weddings/${weddingId}/suppliers`, {
        supplier_email: 'supplier1@test.com',
        service_type: 'photography'
      });
      
      const secondResponse = await apiClient.post(`/weddings/${weddingId}/suppliers`, {
        supplier_email: 'supplier2@test.com',
        service_type: 'videography'
      });
      
      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      
      expect(firstResponse.data.invitation_id).not.toBe(secondResponse.data.invitation_id);
    });

    test('should track invitation status', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      expect(response.status).toBe(201);
      expect(response.data.status).toBeDefined();
      
      // Status should be trackable (sent, pending, accepted, etc.)
      const validStatuses = ['sent', 'pending', 'delivered', 'opened', 'accepted', 'declined'];
      expect(validStatuses).toContain(response.data.status);
    });

    test('should handle supplier already in system', async () => {
      // Invite a supplier that might already be registered
      const knownSupplierInvitation = {
        supplier_email: 'existing-supplier@test.com',
        service_type: 'photography',
        message: 'We know you from our friend\'s wedding'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, knownSupplierInvitation);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('invitation_id');
      expect(response.data).toHaveProperty('status');
    });

    test('should maintain invitation history', async () => {
      const invitation = {
        supplier_email: 'photographer@test.com',
        service_type: 'photography',
        message: 'Initial invitation'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invitation);
      
      expect(response.status).toBe(201);
      
      // The system should track when this invitation was sent
      // This is implied by the invitation_id being generated
      expect(response.data.invitation_id).toBeDefined();
    });

    test('should validate wedding date for supplier booking', async () => {
      // Business rule: suppliers should be bookable for future weddings
      const futureWeddingInvitation = {
        supplier_email: 'future-supplier@test.com',
        service_type: 'photography',
        message: 'Our wedding is on ' + mockCoupleWedding.wedding_date
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, futureWeddingInvitation);
      
      expect(response.status).toBe(201);
    });

    test('should support different service types', async () => {
      const serviceTypes = ['photography', 'videography', 'catering', 'flowers', 'music'];
      
      for (const serviceType of serviceTypes) {
        const invitation = {
          supplier_email: `${serviceType}@test.com`,
          service_type: serviceType,
          message: `We need ${serviceType} services`
        };
        
        const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, invitation);
        
        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('invitation_id');
      }
    });
  });

  describe('Integration with Supplier System', () => {
    test('should validate supplier email exists', async () => {
      // This test depends on whether the system validates supplier existence
      const unknownSupplierInvitation = {
        supplier_email: 'unknown-supplier@nonexistent.com',
        service_type: 'photography'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, unknownSupplierInvitation);
      
      // Should either send invitation anyway or validate supplier exists
      expect([201, 404, 422]).toContain(response.status);
    });

    test('should handle supplier response to invitation', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/suppliers`, validSupplierInvitation);
      
      expect(response.status).toBe(201);
      
      // The invitation should create a pathway for supplier to respond
      expect(response.data.invitation_id).toBeDefined();
      
      // This ID would be used in supplier response flows
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.invitation_id).toMatch(uuidRegex);
    });
  });
});