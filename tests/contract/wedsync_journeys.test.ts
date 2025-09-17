import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';

/**
 * T032: Contract test for GET/POST /journeys
 * 
 * Tests the WedSync API endpoints for journey management
 * This test MUST FAIL until the actual API endpoints are implemented
 */
describe('WedSync API: /journeys', () => {
  let apiClient: ApiClient;
  const mockAuthToken = 'mock-jwt-token';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('GET /journeys', () => {
    describe('Authentication', () => {
      it('should return 401 when no auth token provided', async () => {
        const response = await apiClient.get('/journeys');
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/unauthorized|authentication/i);
      });

      it('should return 401 when invalid auth token provided', async () => {
        const response = await apiClient
          .withAuth('invalid-token')
          .get('/journeys');
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Successful Response', () => {
      it('should return 200 with array of journeys', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/journeys');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should return journeys with correct schema structure', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/journeys');
        
        expect(response.status).toBe(200);
        
        if (response.body.length > 0) {
          const journey = response.body[0];
          
          // Check required Journey fields based on schema
          expect(journey).toHaveProperty('id');
          expect(journey).toHaveProperty('name');
          expect(journey).toHaveProperty('description');
          expect(journey).toHaveProperty('workflow_definition');
          expect(journey).toHaveProperty('trigger_conditions');
          expect(journey).toHaveProperty('created_at');
          expect(journey).toHaveProperty('updated_at');
          
          // Validate field types
          expect(typeof journey.id).toBe('string');
          expect(typeof journey.name).toBe('string');
          expect(typeof journey.workflow_definition).toBe('object');
          expect(typeof journey.trigger_conditions).toBe('object');
          expect(typeof journey.created_at).toBe('string');
          expect(typeof journey.updated_at).toBe('string');
        }
      });

      it('should return application/json content type', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get('/journeys');
        
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });
  });

  describe('POST /journeys', () => {
    const validJourneyData = {
      name: 'Test Journey',
      description: 'A test journey for contract testing',
      workflow_definition: {
        steps: [
          { type: 'email', template: 'welcome' },
          { type: 'wait', duration: '1 day' },
          { type: 'email', template: 'follow_up' }
        ]
      },
      trigger_conditions: {
        event: 'form_submission',
        form_id: '123e4567-e89b-12d3-a456-426614174000'
      }
    };

    describe('Authentication', () => {
      it('should return 401 when no auth token provided', async () => {
        const response = await apiClient.post('/journeys', validJourneyData);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/unauthorized|authentication/i);
      });

      it('should return 401 when invalid auth token provided', async () => {
        const response = await apiClient
          .withAuth('invalid-token')
          .post('/journeys', validJourneyData);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Request Validation', () => {
      it('should return 400 when name is missing', async () => {
        const invalidData = { ...validJourneyData };
        delete invalidData.name;
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', invalidData);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/name.*required/i);
      });

      it('should return 400 when workflow_definition is missing', async () => {
        const invalidData = { ...validJourneyData };
        delete invalidData.workflow_definition;
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', invalidData);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/workflow_definition.*required/i);
      });

      it('should return 400 when name is not a string', async () => {
        const invalidData = { ...validJourneyData, name: 123 };
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', invalidData);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/name.*string/i);
      });

      it('should return 400 when workflow_definition is not an object', async () => {
        const invalidData = { ...validJourneyData, workflow_definition: 'invalid' };
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', invalidData);
        
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/workflow_definition.*object/i);
      });

      it('should accept request without optional description', async () => {
        const dataWithoutDescription = { ...validJourneyData };
        delete dataWithoutDescription.description;
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', dataWithoutDescription);
        
        // Should not fail due to missing optional field
        expect([201, 401, 403, 500]).toContain(response.status);
        if (response.status !== 201) {
          expect(response.body.error).not.toMatch(/description.*required/i);
        }
      });

      it('should accept request without optional trigger_conditions', async () => {
        const dataWithoutTriggers = { ...validJourneyData };
        delete dataWithoutTriggers.trigger_conditions;
        
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', dataWithoutTriggers);
        
        // Should not fail due to missing optional field
        expect([201, 401, 403, 500]).toContain(response.status);
        if (response.status !== 201) {
          expect(response.body.error).not.toMatch(/trigger_conditions.*required/i);
        }
      });
    });

    describe('Content Type', () => {
      it('should return 400 when content-type is not application/json', async () => {
        // This would test that the endpoint only accepts JSON
        // Implementation depends on the framework being used
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', 'invalid-content-type');
        
        expect([400, 415]).toContain(response.status);
      });
    });

    describe('Successful Response', () => {
      it('should return 201 with created journey when valid data provided', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', validJourneyData);
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(validJourneyData.name);
        expect(response.body.description).toBe(validJourneyData.description);
      });

      it('should return journey with correct schema structure', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', validJourneyData);
        
        expect(response.status).toBe(201);
        
        // Check required Journey fields in response
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('workflow_definition');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body).toHaveProperty('updated_at');
        
        // Validate field types
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.name).toBe('string');
        expect(typeof response.body.workflow_definition).toBe('object');
        expect(typeof response.body.created_at).toBe('string');
        expect(typeof response.body.updated_at).toBe('string');
        
        // Validate that input data is preserved
        expect(response.body.name).toBe(validJourneyData.name);
        expect(response.body.workflow_definition).toEqual(validJourneyData.workflow_definition);
      });

      it('should return application/json content type', async () => {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', validJourneyData);
        
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });

      it('should generate unique IDs for different journeys', async () => {
        const journey1Data = { ...validJourneyData, name: 'Journey 1' };
        const journey2Data = { ...validJourneyData, name: 'Journey 2' };
        
        const response1 = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', journey1Data);
        
        const response2 = await apiClient
          .withAuth(mockAuthToken)
          .post('/journeys', journey2Data);
        
        if (response1.status === 201 && response2.status === 201) {
          expect(response1.body.id).not.toBe(response2.body.id);
        }
      });
    });
  });
});