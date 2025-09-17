import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';

/**
 * T031: Contract test for GET /forms/{id}/submissions
 * 
 * Tests the WedSync API endpoint for retrieving form submissions
 * This test MUST FAIL until the actual API endpoint is implemented
 */
describe('WedSync API: GET /forms/{formId}/submissions', () => {
  let apiClient: ApiClient;
  const mockAuthToken = 'mock-jwt-token';
  const mockFormId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Authentication', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await apiClient.get(`/forms/${mockFormId}/submissions`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/unauthorized|authentication/i);
    });

    it('should return 401 when invalid auth token provided', async () => {
      const response = await apiClient
        .withAuth('invalid-token')
        .get(`/forms/${mockFormId}/submissions`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Path Parameters', () => {
    it('should return 400 when formId is not a valid UUID', async () => {
      const invalidFormId = 'not-a-uuid';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${invalidFormId}/submissions`);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*uuid/i);
    });

    it('should return 404 when formId does not exist', async () => {
      const nonExistentFormId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${nonExistentFormId}/submissions`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/form.*not.*found/i);
    });
  });

  describe('Query Parameters', () => {
    it('should accept valid status filter values', async () => {
      const validStatuses = ['draft', 'submitted', 'reviewed', 'approved'];
      
      for (const status of validStatuses) {
        const response = await apiClient
          .withAuth(mockAuthToken)
          .get(`/forms/${mockFormId}/submissions?status=${status}`);
        
        // Should not fail due to invalid query parameter
        expect([200, 404]).toContain(response.status);
      }
    });

    it('should return 400 when status filter has invalid value', async () => {
      const invalidStatus = 'invalid-status';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions?status=${invalidStatus}`);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*status/i);
    });
  });

  describe('Successful Response', () => {
    it('should return 200 with correct response schema when form exists', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('submissions');
      expect(Array.isArray(response.body.submissions)).toBe(true);
    });

    it('should return submissions with correct schema structure', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions`);
      
      expect(response.status).toBe(200);
      
      if (response.body.submissions.length > 0) {
        const submission = response.body.submissions[0];
        
        // Check required FormSubmission fields based on schema
        expect(submission).toHaveProperty('id');
        expect(submission).toHaveProperty('formId');
        expect(submission).toHaveProperty('status');
        expect(submission).toHaveProperty('submittedAt');
        expect(submission).toHaveProperty('data');
        
        // Validate field types
        expect(typeof submission.id).toBe('string');
        expect(typeof submission.formId).toBe('string');
        expect(typeof submission.status).toBe('string');
        expect(typeof submission.submittedAt).toBe('string');
        expect(typeof submission.data).toBe('object');
        
        // Validate status enum
        expect(['draft', 'submitted', 'reviewed', 'approved'])
          .toContain(submission.status);
      }
    });

    it('should filter submissions by status when query parameter provided', async () => {
      const status = 'submitted';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions?status=${status}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('submissions');
      
      // All returned submissions should have the requested status
      response.body.submissions.forEach((submission: any) => {
        expect(submission.status).toBe(status);
      });
    });
  });

  describe('Content Type', () => {
    it('should return application/json content type', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions`);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Authorization', () => {
    it('should return 403 when user does not have access to form', async () => {
      // This tests that suppliers can only access their own forms
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/forms/${mockFormId}/submissions`);
      
      // Could be 403 (forbidden) or 404 (not found for security)
      expect([403, 404]).toContain(response.status);
    });
  });
});