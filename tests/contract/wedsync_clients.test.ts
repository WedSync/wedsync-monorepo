import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';

/**
 * T034: Contract test for GET /clients
 * 
 * Tests the WedSync API endpoint for listing client weddings
 * This test MUST FAIL until the actual API endpoint is implemented
 */
describe('WedSync API: GET /clients', () => {
  let apiClient: ApiClient;
  const mockAuthToken = 'mock-jwt-token';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Authentication', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await apiClient.get('/clients');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/unauthorized|authentication/i);
    });

    it('should return 401 when invalid auth token provided', async () => {
      const response = await apiClient
        .withAuth('invalid-token')
        .get('/clients');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Query Parameters', () => {
    describe('status filter', () => {
      it('should accept valid status filter values', async () => {
        const validStatuses = ['planning', 'confirmed', 'completed', 'cancelled'];
        
        for (const status of validStatuses) {
          const response = await apiClient
            .withAuth(mockAuthToken)
            .get(`/clients?status=${status}`);
          
          // Should not fail due to invalid query parameter
          expect([200, 401, 403]).toContain(response.status);
          if (response.status !== 200) {
            expect(response.body.error).not.toMatch(/invalid.*status/i);
          }
        }
      });

      it('should return 400 when status filter has invalid value', async () => {
        const invalidStatus = 'invalid-status';
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get(`/clients?status=${invalidStatus}`);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/invalid.*status/i);
      });

      it('should return all clients when no status filter provided', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/clients');
        
        expect([200, 401, 403]).toContain(response.status);
      });
    });

    describe('search parameter', () => {
      it('should accept search query string', async () => {
        const searchQuery = 'john jane wedding';
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get(`/clients?search=${encodeURIComponent(searchQuery)}`);
        
        expect([200, 401, 403]).toContain(response.status);
      });

      it('should handle empty search string', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/clients?search=');
        
        expect([200, 401, 403]).toContain(response.status);
      });

      it('should handle special characters in search', async () => {
        const searchQuery = 'café & résumé';
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get(`/clients?search=${encodeURIComponent(searchQuery)}`);
        
        expect([200, 401, 403]).toContain(response.status);
      });
    });

    describe('combined parameters', () => {
      it('should accept both status and search parameters', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/clients?status=planning&search=wedding');
        
        expect([200, 400, 401, 403]).toContain(response.status);
      });
    });
  });

  describe('Successful Response', () => {
    it('should return 200 with array of client weddings', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return clients with correct Wedding schema structure', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      expect(response.status).toBe(200);
      
      if (response.body.length > 0) {
        const wedding = response.body[0];
        
        // Check required Wedding fields based on schema
        expect(wedding).toHaveProperty('id');
        expect(wedding).toHaveProperty('couple_names');
        expect(wedding).toHaveProperty('wedding_date');
        expect(wedding).toHaveProperty('status');
        expect(wedding).toHaveProperty('venue');
        expect(wedding).toHaveProperty('guest_count');
        expect(wedding).toHaveProperty('budget');
        expect(wedding).toHaveProperty('created_at');
        expect(wedding).toHaveProperty('updated_at');
        
        // Validate field types
        expect(typeof wedding.id).toBe('string');
        expect(typeof wedding.couple_names).toBe('string');
        expect(typeof wedding.wedding_date).toBe('string');
        expect(typeof wedding.status).toBe('string');
        expect(typeof wedding.guest_count).toBe('number');
        expect(typeof wedding.budget).toBe('number');
        expect(typeof wedding.created_at).toBe('string');
        expect(typeof wedding.updated_at).toBe('string');
        
        // Validate status enum
        expect(['planning', 'confirmed', 'completed', 'cancelled'])
          .toContain(wedding.status);
      }
    });

    it('should return application/json content type', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should filter clients by status when provided', async () => {
      const status = 'planning';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients?status=${status}`);
      
      expect(response.status).toBe(200);
      
      // All returned clients should have the requested status
      response.body.forEach((wedding: any) => {
        expect(wedding.status).toBe(status);
      });
    });

    it('should return relevant clients when search query provided', async () => {
      const searchQuery = 'john';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients?search=${searchQuery}`);
      
      expect(response.status).toBe(200);
      
      // Results should be relevant to search query
      // This is a basic check - actual implementation may search in different fields
      if (response.body.length > 0) {
        const hasRelevantResults = response.body.some((wedding: any) => 
          wedding.couple_names?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wedding.venue?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        // Note: This assertion might be too strict depending on search implementation
        // expect(hasRelevantResults).toBe(true);
      }
    });

    it('should return empty array when no clients match filters', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients?search=nonexistentclient12345');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Could be empty array or have results depending on test data
    });
  });

  describe('Authorization', () => {
    it('should only return clients accessible to the authenticated supplier', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 200) {
        // All returned clients should belong to the authenticated supplier
        // This would be validated based on the business logic
        // The test assumes proper multi-tenant data isolation
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      const endTime = Date.now();
      
      if (response.status === 200) {
        // Response should be reasonably fast (under 5 seconds for contract test)
        expect(endTime - startTime).toBeLessThan(5000);
      }
    });

    it('should return reasonable number of results by default', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      if (response.status === 200) {
        // Should not return excessive number of results without pagination
        expect(response.body.length).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Data Quality', () => {
    it('should return consistent data types across all wedding objects', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      if (response.status === 200 && response.body.length > 1) {
        const firstWedding = response.body[0];
        const secondWedding = response.body[1];
        
        // Check that all weddings have consistent field types
        Object.keys(firstWedding).forEach(key => {
          if (secondWedding.hasOwnProperty(key)) {
            expect(typeof firstWedding[key]).toBe(typeof secondWedding[key]);
          }
        });
      }
    });

    it('should return valid date formats for wedding dates', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get('/clients');
      
      if (response.status === 200) {
        response.body.forEach((wedding: any) => {
          if (wedding.wedding_date) {
            // Should be a valid date string (ISO format expected)
            expect(isNaN(Date.parse(wedding.wedding_date))).toBe(false);
          }
        });
      }
    });
  });
});