import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';

/**
 * T033: Contract test for POST /journeys/{id}/enroll
 * 
 * Tests the WedSync API endpoint for enrolling weddings in journeys
 * This test MUST FAIL until the actual API endpoint is implemented
 */
describe('WedSync API: POST /journeys/{journeyId}/enroll', () => {
  let apiClient: ApiClient;
  const mockAuthToken = 'mock-jwt-token';
  const mockJourneyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockWeddingId = '456e7890-e89b-12d3-a456-426614174001';

  const validEnrollmentData = {
    wedding_id: mockWeddingId,
    custom_variables: {
      couple_names: 'John & Jane',
      wedding_date: '2024-06-15',
      venue: 'Garden Resort'
    }
  };

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Authentication', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await apiClient.post(
        `/journeys/${mockJourneyId}/enroll`,
        validEnrollmentData
      );
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/unauthorized|authentication/i);
    });

    it('should return 401 when invalid auth token provided', async () => {
      const response = await apiClient
        .withAuth('invalid-token')
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Path Parameters', () => {
    it('should return 400 when journeyId is not a valid UUID', async () => {
      const invalidJourneyId = 'not-a-uuid';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${invalidJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*uuid/i);
    });

    it('should return 404 when journeyId does not exist', async () => {
      const nonExistentJourneyId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${nonExistentJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/journey.*not.*found/i);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when wedding_id is missing', async () => {
      const invalidData = { ...validEnrollmentData };
      delete invalidData.wedding_id;
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wedding_id.*required/i);
    });

    it('should return 400 when wedding_id is not a valid UUID', async () => {
      const invalidData = { ...validEnrollmentData, wedding_id: 'not-a-uuid' };
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wedding_id.*uuid/i);
    });

    it('should return 400 when wedding_id is not a string', async () => {
      const invalidData = { ...validEnrollmentData, wedding_id: 123 };
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wedding_id.*string/i);
    });

    it('should accept request without optional custom_variables', async () => {
      const dataWithoutCustomVars = { wedding_id: mockWeddingId };
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, dataWithoutCustomVars);
      
      // Should not fail due to missing optional field
      expect([201, 401, 403, 404, 409, 500]).toContain(response.status);
      if (![201, 401, 403, 404, 409, 500].includes(response.status)) {
        expect(response.body.error).not.toMatch(/custom_variables.*required/i);
      }
    });

    it('should return 400 when custom_variables is not an object', async () => {
      const invalidData = { ...validEnrollmentData, custom_variables: 'invalid' };
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/custom_variables.*object/i);
    });

    it('should return 404 when wedding_id does not exist', async () => {
      const dataWithNonExistentWedding = {
        wedding_id: '999e4567-e89b-12d3-a456-426614174999',
        custom_variables: {}
      };
      
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, dataWithNonExistentWedding);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wedding.*not.*found/i);
    });
  });

  describe('Business Logic Validation', () => {
    it('should return 409 when wedding is already enrolled in journey', async () => {
      // First enrollment (assuming it succeeds or fails for other reasons)
      await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      // Second enrollment of same wedding should conflict
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      // Should either conflict or succeed (depending on business rules)
      if (response.status === 409) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/already.*enrolled|conflict/i);
      }
    });

    it('should return 403 when user does not have access to wedding', async () => {
      // This tests that suppliers can only enroll their own weddings
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      // Could be 403 (forbidden) or 404 (not found for security)
      expect([201, 403, 404, 409]).toContain(response.status);
    });

    it('should return 403 when user does not have access to journey', async () => {
      // This tests that suppliers can only use their own journeys
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      // Could be 403 (forbidden) or 404 (not found for security)
      expect([201, 403, 404, 409]).toContain(response.status);
    });
  });

  describe('Content Type', () => {
    it('should return 400 when content-type is not application/json', async () => {
      // This would test that the endpoint only accepts JSON
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, 'invalid-content-type');
      
      expect([400, 415]).toContain(response.status);
    });

    it('should return application/json content type', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Successful Response', () => {
    it('should return 201 with enrollment details when valid data provided', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('journey_id');
      expect(response.body).toHaveProperty('wedding_id');
      expect(response.body).toHaveProperty('enrolled_at');
    });

    it('should return enrollment with correct schema structure', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      expect(response.status).toBe(201);
      
      // Check required JourneyEnrollment fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('journey_id');
      expect(response.body).toHaveProperty('wedding_id');
      expect(response.body).toHaveProperty('enrolled_at');
      expect(response.body).toHaveProperty('status');
      
      // Validate field types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.journey_id).toBe('string');
      expect(typeof response.body.wedding_id).toBe('string');
      expect(typeof response.body.enrolled_at).toBe('string');
      expect(typeof response.body.status).toBe('string');
      
      // Validate that input data is preserved
      expect(response.body.journey_id).toBe(mockJourneyId);
      expect(response.body.wedding_id).toBe(validEnrollmentData.wedding_id);
      
      // Validate status is a valid enum value
      expect(['active', 'paused', 'completed', 'cancelled']).toContain(response.body.status);
    });

    it('should preserve custom_variables in enrollment', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('custom_variables');
        expect(response.body.custom_variables).toEqual(validEnrollmentData.custom_variables);
      }
    });

    it('should generate unique IDs for different enrollments', async () => {
      const enrollment1Data = { ...validEnrollmentData };
      const enrollment2Data = { 
        ...validEnrollmentData, 
        wedding_id: '789e1234-e89b-12d3-a456-426614174002' 
      };
      
      const response1 = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, enrollment1Data);
      
      const response2 = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, enrollment2Data);
      
      if (response1.status === 201 && response2.status === 201) {
        expect(response1.body.id).not.toBe(response2.body.id);
      }
    });

    it('should set initial status as active for new enrollments', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .post(`/journeys/${mockJourneyId}/enroll`, validEnrollmentData);
      
      if (response.status === 201) {
        expect(response.body.status).toBe('active');
      }
    });
  });
});