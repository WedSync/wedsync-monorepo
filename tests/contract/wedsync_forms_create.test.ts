/**
 * T029: Contract test POST /forms in tests/contract/wedsync_forms_create.test.ts
 * 
 * This test validates the WedSync API form creation endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - POST /forms
 * - Requires authentication
 * - Accepts form data with name, description, wedding_id, fields_schema, ai_prompt
 * - Returns created form with 201 status
 * - Validates required fields and data types
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validSupplierCredentials, 
  validFormData,
  invalidFormData,
  mockForm 
} from './helpers/fixtures';

describe('WedSync API - POST /forms Contract', () => {
  let apiClient: ApiClient;
  let authToken: string;

  beforeEach(async () => {
    apiClient = new ApiClient();
    
    // Get authentication token
    const authResponse = await apiClient.post('/auth/login', validSupplierCredentials);
    authToken = authResponse.body.access_token;
  });

  describe('Valid Form Creation', () => {
    test('should create form with all required fields', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        supplier_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        name: validFormData.name,
        description: validFormData.description,
        fields_schema: validFormData.fields_schema,
        is_active: expect.any(Boolean),
        submission_count: 0,
        completion_rate: 0,
        ai_generated: false,
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      });

      // New forms should default to active
      expect(response.body.is_active).toBe(true);
    });

    test('should create form with minimal required fields only', async () => {
      const minimalFormData = {
        name: 'Minimal Test Form',
        fields_schema: {
          fields: [
            {
              id: 'test_field',
              type: 'text',
              label: 'Test Field',
              required: true
            }
          ]
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', minimalFormData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(minimalFormData.name);
      expect(response.body.fields_schema).toEqual(minimalFormData.fields_schema);
      expect(response.body.description).toBe('');
    });

    test('should create form with AI prompt', async () => {
      const formWithAI = {
        ...validFormData,
        ai_prompt: 'Create a photography consultation form with style preferences and budget'
      };

      const response = await apiClient.withAuth(authToken).post('/forms', formWithAI);

      expect(response.status).toBe(201);
      expect(response.body.ai_generated).toBe(true);
    });

    test('should handle complex fields_schema', async () => {
      const complexSchema = {
        name: 'Complex Form',
        fields_schema: {
          fields: [
            {
              id: 'dropdown_field',
              type: 'select',
              label: 'Choose an option',
              required: true,
              options: ['Option 1', 'Option 2', 'Option 3']
            },
            {
              id: 'number_field',
              type: 'number',
              label: 'Enter a number',
              required: false,
              min: 0,
              max: 1000
            },
            {
              id: 'file_field',
              type: 'file',
              label: 'Upload a file',
              required: false,
              accept: ['image/*', '.pdf']
            }
          ]
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', complexSchema);

      expect(response.status).toBe(201);
      expect(response.body.fields_schema).toEqual(complexSchema.fields_schema);
    });

    test('should associate form with wedding when wedding_id provided', async () => {
      const formWithWedding = {
        ...validFormData,
        wedding_id: '123e4567-e89b-12d3-a456-426614174002'
      };

      const response = await apiClient.withAuth(authToken).post('/forms', formWithWedding);

      expect(response.status).toBe(201);
      expect(response.body.wedding_id).toBe(formWithWedding.wedding_id);
    });
  });

  describe('Validation Errors', () => {
    test('should reject form without name', async () => {
      const invalidData = {
        fields_schema: validFormData.fields_schema
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('name');
    });

    test('should reject form without fields_schema', async () => {
      const invalidData = {
        name: 'Test Form'
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('fields_schema');
    });

    test('should reject form with empty name', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', invalidFormData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should reject form with invalid fields_schema structure', async () => {
      const invalidSchema = {
        name: 'Test Form',
        fields_schema: {
          // Missing 'fields' array
          title: 'Invalid Schema'
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidSchema);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should reject form with invalid wedding_id format', async () => {
      const invalidData = {
        ...validFormData,
        wedding_id: 'invalid-uuid-format'
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('wedding_id');
    });

    test('should reject form with non-existent wedding_id', async () => {
      const invalidData = {
        ...validFormData,
        wedding_id: '123e4567-e89b-12d3-a456-999999999999'
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('wedding');
    });

    test('should validate field types in schema', async () => {
      const invalidFieldSchema = {
        name: 'Test Form',
        fields_schema: {
          fields: [
            {
              id: 'invalid_field',
              type: 'invalid_type', // Invalid field type
              label: 'Invalid Field',
              required: true
            }
          ]
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', invalidFieldSchema);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('type');
    });

    test('should validate required field properties', async () => {
      const incompleteFieldSchema = {
        name: 'Test Form',
        fields_schema: {
          fields: [
            {
              // Missing required properties: id, type, label
              required: true
            }
          ]
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', incompleteFieldSchema);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication', async () => {
      const response = await apiClient.post('/forms', validFormData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should reject invalid authentication token', async () => {
      const response = await apiClient.withAuth('invalid-token').post('/forms', validFormData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should associate form with authenticated supplier', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response.status).toBe(201);
      expect(response.body.supplier_id).toBeDefined();
      // The supplier_id should match the authenticated user's supplier
    });
  });

  describe('Business Logic', () => {
    test('should initialize form with default values', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response.status).toBe(201);
      expect(response.body.submission_count).toBe(0);
      expect(response.body.completion_rate).toBe(0);
      expect(response.body.is_active).toBe(true);
      expect(response.body.conditional_logic).toEqual({});
    });

    test('should handle conditional logic when provided', async () => {
      const formWithLogic = {
        ...validFormData,
        conditional_logic: {
          rules: [
            {
              condition: 'field_value_equals',
              field_id: 'test_field',
              value: 'show_next',
              action: 'show_field',
              target_field_id: 'conditional_field'
            }
          ]
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', formWithLogic);

      expect(response.status).toBe(201);
      expect(response.body.conditional_logic).toEqual(formWithLogic.conditional_logic);
    });

    test('should generate unique form ID', async () => {
      const response1 = await apiClient.withAuth(authToken).post('/forms', validFormData);
      const response2 = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.id).not.toBe(response2.body.id);
    });

    test('should allow duplicate form names for same supplier', async () => {
      const response1 = await apiClient.withAuth(authToken).post('/forms', validFormData);
      const response2 = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.name).toBe(response2.body.name);
      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('Response Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await apiClient.withAuth(authToken).post('/forms', validFormData);
      
      const responseTime = Date.now() - startTime;
      
      // Form creation should complete within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
  });

  describe('Response Headers', () => {
    test('should include Location header with created resource', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response.status).toBe(201);
      expect(response.headers).toHaveProperty('location');
      expect(response.headers.location).toContain(`/forms/${response.body.id}`);
    });

    test('should include content type header', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', validFormData);

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Data Persistence', () => {
    test('should persist created form data', async () => {
      const createResponse = await apiClient.withAuth(authToken).post('/forms', validFormData);
      expect(createResponse.status).toBe(201);

      const formId = createResponse.body.id;
      
      // Verify form can be retrieved
      const getResponse = await apiClient.withAuth(authToken).get(`/forms/${formId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(formId);
      expect(getResponse.body.name).toBe(validFormData.name);
    });
  });

  describe('Error Response Format', () => {
    test('should return consistent error format', async () => {
      const response = await apiClient.withAuth(authToken).post('/forms', invalidFormData);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String)
      });

      if (response.body.details) {
        expect(response.body.details).toBeInstanceOf(Object);
      }
    });
  });

  describe('Large Data Handling', () => {
    test('should handle large fields_schema', async () => {
      const largeSchema = {
        name: 'Large Form',
        fields_schema: {
          fields: Array.from({ length: 50 }, (_, i) => ({
            id: `field_${i}`,
            type: 'text',
            label: `Field ${i}`,
            required: false
          }))
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', largeSchema);

      expect(response.status).toBe(201);
      expect(response.body.fields_schema.fields.length).toBe(50);
    });

    test('should enforce reasonable size limits', async () => {
      const extremelyLargeSchema = {
        name: 'Extreme Form',
        description: 'A'.repeat(10000), // Very long description
        fields_schema: {
          fields: Array.from({ length: 1000 }, (_, i) => ({
            id: `field_${i}`,
            type: 'text',
            label: `Field ${i}`,
            required: false
          }))
        }
      };

      const response = await apiClient.withAuth(authToken).post('/forms', extremelyLargeSchema);

      // Should either accept or reject with clear error
      expect([201, 413]).toContain(response.status);
      
      if (response.status === 413) {
        expect(response.body.error).toBe('Payload Too Large');
      }
    });
  });
});