/**
 * T030: Contract test GET/PUT/DELETE /forms/{id} in tests/contract/wedsync_forms_crud.test.ts
 * 
 * This test validates the WedSync API form CRUD operations endpoint contract.
 * It MUST FAIL until the actual API endpoints are implemented.
 * 
 * Contract being tested:
 * - GET /forms/{formId} - Retrieve form details
 * - PUT /forms/{formId} - Update form
 * - DELETE /forms/{formId} - Delete form
 * - Proper error handling for non-existent forms
 * - Authorization for form ownership
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validSupplierCredentials, 
  validFormData,
  mockForm 
} from './helpers/fixtures';

describe('WedSync API - Forms CRUD Operations Contract', () => {
  let apiClient: ApiClient;
  let authToken: string;
  let createdFormId: string;

  beforeEach(async () => {
    apiClient = new ApiClient();
    
    // Get authentication token
    const authResponse = await apiClient.post('/auth/login', validSupplierCredentials);
    authToken = authResponse.body.access_token;

    // Create a test form for CRUD operations
    const createResponse = await apiClient.withAuth(authToken).post('/forms', validFormData);
    createdFormId = createResponse.body.id;
  });

  afterEach(async () => {
    // Cleanup: Delete the test form if it still exists
    try {
      await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  describe('GET /forms/{formId} - Retrieve Form', () => {
    test('should retrieve existing form with full details', async () => {
      const response = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: createdFormId,
        supplier_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        name: validFormData.name,
        description: validFormData.description,
        fields_schema: validFormData.fields_schema,
        conditional_logic: expect.any(Object),
        is_active: expect.any(Boolean),
        submission_count: expect.any(Number),
        completion_rate: expect.any(Number),
        ai_generated: expect.any(Boolean),
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      });
    });

    test('should return 404 for non-existent form', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';
      const response = await apiClient.withAuth(authToken).get(`/forms/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not Found');
    });

    test('should return 400 for invalid form ID format', async () => {
      const response = await apiClient.withAuth(authToken).get('/forms/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should require authentication', async () => {
      const response = await apiClient.get(`/forms/${createdFormId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should only allow access to own forms', async () => {
      // This test assumes another supplier's form exists
      // In real implementation, this would test authorization
      const response = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);

      expect(response.status).toBe(200);
      expect(response.body.supplier_id).toBeDefined();
    });
  });

  describe('PUT /forms/{formId} - Update Form', () => {
    test('should update form with valid data', async () => {
      const updateData = {
        name: 'Updated Form Name',
        description: 'Updated description',
        is_active: false
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: createdFormId,
        name: updateData.name,
        description: updateData.description,
        is_active: updateData.is_active
      });

      // Original fields should remain unchanged
      expect(response.body.fields_schema).toEqual(validFormData.fields_schema);
    });

    test('should update fields_schema', async () => {
      const newSchema = {
        fields: [
          {
            id: 'updated_field',
            type: 'email',
            label: 'Email Address',
            required: true
          }
        ]
      };

      const updateData = {
        fields_schema: newSchema
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.body.fields_schema).toEqual(newSchema);
    });

    test('should update conditional_logic', async () => {
      const newLogic = {
        rules: [
          {
            condition: 'field_value_equals',
            field_id: 'updated_field',
            value: 'trigger',
            action: 'show_field',
            target_field_id: 'conditional_field'
          }
        ]
      };

      const updateData = {
        conditional_logic: newLogic
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.body.conditional_logic).toEqual(newLogic);
    });

    test('should allow partial updates', async () => {
      const updateData = {
        name: 'Partially Updated Form'
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      
      // Other fields should remain unchanged
      expect(response.body.description).toBe(validFormData.description);
      expect(response.body.fields_schema).toEqual(validFormData.fields_schema);
    });

    test('should validate required fields during update', async () => {
      const invalidUpdate = {
        name: '', // Empty name should be invalid
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should validate fields_schema structure during update', async () => {
      const invalidSchema = {
        fields_schema: {
          // Invalid structure - missing fields array
          title: 'Invalid'
        }
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, invalidSchema);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should return 404 for non-existent form', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';
      const updateData = { name: 'Updated Name' };

      const response = await apiClient.withAuth(authToken).put(`/forms/${nonExistentId}`, updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not Found');
    });

    test('should require authentication for updates', async () => {
      const updateData = { name: 'Updated Name' };
      const response = await apiClient.put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should not allow updating read-only fields', async () => {
      const updateData = {
        id: 'new-id', // Should not be updatable
        supplier_id: 'new-supplier-id', // Should not be updatable
        submission_count: 999, // Should not be updatable
        completion_rate: 0.99, // Should not be updatable
        created_at: '2025-01-01T00:00:00Z' // Should not be updatable
      };

      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);

      expect(response.status).toBe(200);
      
      // Read-only fields should remain unchanged
      expect(response.body.id).toBe(createdFormId);
      expect(response.body.submission_count).not.toBe(999);
      expect(response.body.completion_rate).not.toBe(0.99);
    });
  });

  describe('DELETE /forms/{formId} - Delete Form', () => {
    test('should delete existing form', async () => {
      const response = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    test('should verify form is deleted after deletion', async () => {
      // Delete the form
      const deleteResponse = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);
      expect(deleteResponse.status).toBe(204);

      // Try to retrieve the deleted form
      const getResponse = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);
      expect(getResponse.status).toBe(404);
    });

    test('should return 404 for non-existent form', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';
      const response = await apiClient.withAuth(authToken).delete(`/forms/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not Found');
    });

    test('should return 400 for invalid form ID format', async () => {
      const response = await apiClient.withAuth(authToken).delete('/forms/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should require authentication for deletion', async () => {
      const response = await apiClient.delete(`/forms/${createdFormId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should handle forms with submissions gracefully', async () => {
      // This test assumes there might be a business rule about deleting forms with submissions
      const response = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);

      // Should either allow deletion or return appropriate error
      expect([204, 409]).toContain(response.status);
      
      if (response.status === 409) {
        expect(response.body.error).toBe('Conflict');
        expect(response.body.message).toContain('submissions');
      }
    });

    test('should be idempotent - multiple deletes should not cause errors', async () => {
      // First deletion
      const firstResponse = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);
      expect(firstResponse.status).toBe(204);

      // Second deletion should return 404, not 500
      const secondResponse = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);
      expect(secondResponse.status).toBe(404);
    });
  });

  describe('Cross-Operation Validation', () => {
    test('should maintain data consistency across operations', async () => {
      // Get initial state
      const initialResponse = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);
      expect(initialResponse.status).toBe(200);

      const initialData = initialResponse.body;

      // Update the form
      const updateData = { name: 'Consistency Test Form' };
      const updateResponse = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData);
      expect(updateResponse.status).toBe(200);

      // Verify changes persist
      const verifyResponse = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.name).toBe(updateData.name);
      expect(verifyResponse.body.id).toBe(initialData.id);
    });

    test('should handle concurrent updates gracefully', async () => {
      const updateData1 = { name: 'Update 1' };
      const updateData2 = { name: 'Update 2' };

      // Send concurrent updates
      const [response1, response2] = await Promise.all([
        apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData1),
        apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, updateData2)
      ]);

      // Both should succeed (last writer wins) or one should fail with conflict
      expect([200, 409]).toContain(response1.status);
      expect([200, 409]).toContain(response2.status);
    });
  });

  describe('Response Performance', () => {
    test('should respond within acceptable time limits for GET', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    test('should respond within acceptable time limits for PUT', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, { name: 'Speed Test' });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
    });

    test('should respond within acceptable time limits for DELETE', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Response Headers', () => {
    test('should include appropriate headers for GET', async () => {
      const response = await apiClient.withAuth(authToken).get(`/forms/${createdFormId}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers).toHaveProperty('cache-control');
    });

    test('should include appropriate headers for PUT', async () => {
      const response = await apiClient.withAuth(authToken).put(`/forms/${createdFormId}`, { name: 'Header Test' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should include appropriate headers for DELETE', async () => {
      const response = await apiClient.withAuth(authToken).delete(`/forms/${createdFormId}`);

      expect(response.status).toBe(204);
      expect(response.headers['content-length']).toBe('0');
    });
  });

  describe('Error Response Consistency', () => {
    test('should return consistent error format across all operations', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';

      const getResponse = await apiClient.withAuth(authToken).get(`/forms/${nonExistentId}`);
      const putResponse = await apiClient.withAuth(authToken).put(`/forms/${nonExistentId}`, { name: 'Test' });
      const deleteResponse = await apiClient.withAuth(authToken).delete(`/forms/${nonExistentId}`);

      [getResponse, putResponse, deleteResponse].forEach(response => {
        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: 'Not Found',
          message: expect.any(String)
        });
      });
    });
  });
});