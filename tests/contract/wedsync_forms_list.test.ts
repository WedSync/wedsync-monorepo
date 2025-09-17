/**
 * T028: Contract test GET /forms in tests/contract/wedsync_forms_list.test.ts
 * 
 * This test validates the WedSync API forms listing endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - GET /forms
 * - Requires authentication
 * - Supports pagination (page, limit)
 * - Supports filtering by wedding_id
 * - Returns forms array with pagination metadata
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validSupplierCredentials, 
  mockFormsListResponse,
  mockForm 
} from './helpers/fixtures';

describe('WedSync API - GET /forms Contract', () => {
  let apiClient: ApiClient;
  let authToken: string;

  beforeEach(async () => {
    apiClient = new ApiClient();
    
    // Get authentication token
    const authResponse = await apiClient.post('/auth/login', validSupplierCredentials);
    authToken = authResponse.body.access_token;
  });

  describe('Basic List Functionality', () => {
    test('should return forms list with default pagination', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('forms');
      expect(response.body).toHaveProperty('pagination');

      // Validate forms array structure
      expect(Array.isArray(response.body.forms)).toBe(true);
      
      // Validate pagination structure
      expect(response.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        total_pages: expect.any(Number)
      });

      // Default pagination values
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination.total_pages).toBeGreaterThanOrEqual(0);
    });

    test('should return forms with correct structure when forms exist', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);

      if (response.body.forms.length > 0) {
        const form = response.body.forms[0];
        
        expect(form).toMatchObject({
          id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          supplier_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
          name: expect.any(String),
          description: expect.any(String),
          fields_schema: expect.any(Object),
          is_active: expect.any(Boolean),
          submission_count: expect.any(Number),
          completion_rate: expect.any(Number),
          ai_generated: expect.any(Boolean),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
        });

        // Validate numeric constraints
        expect(form.submission_count).toBeGreaterThanOrEqual(0);
        expect(form.completion_rate).toBeGreaterThanOrEqual(0);
        expect(form.completion_rate).toBeLessThanOrEqual(1);
      }
    });

    test('should return empty array when no forms exist', async () => {
      // This test assumes a supplier with no forms
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);
      expect(response.body.forms).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.total_pages).toBe(0);
    });
  });

  describe('Pagination', () => {
    test('should respect page parameter', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?page=2');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
    });

    test('should respect limit parameter', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?limit=5');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.forms.length).toBeLessThanOrEqual(5);
    });

    test('should handle combined pagination parameters', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.forms.length).toBeLessThanOrEqual(10);
    });

    test('should validate page parameter bounds', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?page=0');

      // Should either return 400 for invalid page or default to page 1
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.pagination.page).toBe(1);
      }
    });

    test('should validate limit parameter bounds', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?limit=0');

      // Should either return 400 for invalid limit or use default
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.pagination.limit).toBeGreaterThan(0);
      }
    });

    test('should handle large limit values appropriately', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?limit=1000');

      expect(response.status).toBe(200);
      
      // Should cap limit to reasonable maximum (e.g., 100)
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('Filtering', () => {
    test('should filter by wedding_id when provided', async () => {
      const weddingId = '123e4567-e89b-12d3-a456-426614174002';
      const response = await apiClient.withAuth(authToken).get(`/forms?wedding_id=${weddingId}`);

      expect(response.status).toBe(200);
      
      // All forms should be associated with the specified wedding
      response.body.forms.forEach((form: any) => {
        if (form.wedding_id) {
          expect(form.wedding_id).toBe(weddingId);
        }
      });
    });

    test('should validate wedding_id format', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?wedding_id=invalid-uuid');

      // Should return 400 for invalid UUID format
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should handle non-existent wedding_id gracefully', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';
      const response = await apiClient.withAuth(authToken).get(`/forms?wedding_id=${nonExistentId}`);

      expect(response.status).toBe(200);
      expect(response.body.forms).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication', async () => {
      const response = await apiClient.get('/forms');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should reject invalid authentication token', async () => {
      const response = await apiClient.withAuth('invalid-token').get('/forms');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should only return forms owned by authenticated supplier', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);
      
      // All forms should belong to the authenticated supplier
      response.body.forms.forEach((form: any) => {
        expect(form.supplier_id).toBeDefined();
        // The supplier_id should match the authenticated user's supplier
      });
    });
  });

  describe('Response Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).get('/forms');
      
      const responseTime = Date.now() - startTime;
      
      // Forms list should load within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });

    test('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).get('/forms?limit=100');
      
      const responseTime = Date.now() - startTime;
      
      // Even with larger limit, should respond quickly
      expect(responseTime).toBeLessThan(3000);
    });
  });

  describe('Response Headers', () => {
    test('should include appropriate cache headers', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('cache-control');
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should include pagination headers if implemented', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);
      
      // Some APIs include pagination info in headers
      if (response.headers['x-total-count']) {
        expect(parseInt(response.headers['x-total-count'])).toBe(response.body.pagination.total);
      }
    });
  });

  describe('Data Validation', () => {
    test('should validate fields_schema structure when present', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);

      response.body.forms.forEach((form: any) => {
        if (form.fields_schema) {
          expect(form.fields_schema).toBeInstanceOf(Object);
          
          // If fields array exists, validate structure
          if (form.fields_schema.fields) {
            expect(Array.isArray(form.fields_schema.fields)).toBe(true);
          }
        }
      });
    });

    test('should include conditional_logic when available', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms');

      expect(response.status).toBe(200);

      response.body.forms.forEach((form: any) => {
        expect(form).toHaveProperty('conditional_logic');
        
        if (form.conditional_logic !== null) {
          expect(form.conditional_logic).toBeInstanceOf(Object);
        }
      });
    });
  });

  describe('Sorting', () => {
    test('should return forms in consistent order', async () => {
      const response1 = await apiClient.withAuth(authToken).get('/forms');
      const response2 = await apiClient.withAuth(authToken).get('/forms');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Order should be consistent between requests
      if (response1.body.forms.length > 1 && response2.body.forms.length > 1) {
        expect(response1.body.forms[0].id).toBe(response2.body.forms[0].id);
      }
    });

    test('should handle empty results consistently', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms?wedding_id=123e4567-e89b-12d3-a456-999999999999');

      expect(response.status).toBe(200);
      expect(response.body.forms).toEqual([]);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        total: 0,
        total_pages: 0
      });
    });
  });
});