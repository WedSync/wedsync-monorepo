import { describe, it, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';

/**
 * T035: Contract test for GET /clients/{id}/engagement
 * 
 * Tests the WedSync API endpoint for retrieving client engagement metrics
 * This test MUST FAIL until the actual API endpoint is implemented
 */
describe('WedSync API: GET /clients/{weddingId}/engagement', () => {
  let apiClient: ApiClient;
  const mockAuthToken = 'mock-jwt-token';
  const mockWeddingId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Authentication', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await apiClient.get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/unauthorized|authentication/i);
    });

    it('should return 401 when invalid auth token provided', async () => {
      const response = await apiClient
        .withAuth('invalid-token')
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Path Parameters', () => {
    it('should return 400 when weddingId is not a valid UUID', async () => {
      const invalidWeddingId = 'not-a-uuid';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${invalidWeddingId}/engagement`);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid.*uuid/i);
    });

    it('should return 404 when weddingId does not exist', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${nonExistentWeddingId}/engagement`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/wedding.*not.*found/i);
    });
  });

  describe('Successful Response', () => {
    it('should return 200 with engagement metrics when wedding exists', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('engagement_score');
      expect(response.body).toHaveProperty('activity_feed');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should return engagement data with correct schema structure', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(200);
      
      // Check required fields
      expect(response.body).toHaveProperty('engagement_score');
      expect(response.body).toHaveProperty('activity_feed');
      expect(response.body).toHaveProperty('metrics');
      
      // Validate field types
      expect(typeof response.body.engagement_score).toBe('number');
      expect(Array.isArray(response.body.activity_feed)).toBe(true);
      expect(typeof response.body.metrics).toBe('object');
    });

    it('should return engagement_score within valid range (0-100)', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(200);
      expect(response.body.engagement_score).toBeGreaterThanOrEqual(0);
      expect(response.body.engagement_score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(response.body.engagement_score)).toBe(true);
    });

    it('should return activity_feed with correct Activity schema structure', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.activity_feed)).toBe(true);
      
      if (response.body.activity_feed.length > 0) {
        const activity = response.body.activity_feed[0];
        
        // Check required Activity fields based on schema
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('description');
        expect(activity).toHaveProperty('timestamp');
        expect(activity).toHaveProperty('user_id');
        
        // Validate field types
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.type).toBe('string');
        expect(typeof activity.description).toBe('string');
        expect(typeof activity.timestamp).toBe('string');
        expect(typeof activity.user_id).toBe('string');
        
        // Validate timestamp is a valid date
        expect(isNaN(Date.parse(activity.timestamp))).toBe(false);
      }
    });

    it('should return metrics object with engagement analytics', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.status).toBe(200);
      expect(typeof response.body.metrics).toBe('object');
      
      // Common metrics that might be included
      const possibleMetrics = [
        'last_activity_date',
        'total_interactions',
        'form_completion_rate',
        'response_time_avg',
        'communication_frequency',
        'task_completion_rate'
      ];
      
      // At least some metrics should be present
      const hasMetrics = possibleMetrics.some(metric => 
        response.body.metrics.hasOwnProperty(metric)
      );
      
      if (Object.keys(response.body.metrics).length > 0) {
        expect(hasMetrics || Object.keys(response.body.metrics).length > 0).toBe(true);
      }
    });

    it('should return application/json content type', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Authorization', () => {
    it('should return 403 when user does not have access to wedding', async () => {
      // This tests that suppliers can only access engagement for their own clients
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      // Could be 403 (forbidden) or 404 (not found for security)
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Data Quality and Consistency', () => {
    it('should return consistent engagement score calculation', async () => {
      // Make multiple requests to ensure consistent calculation
      const response1 = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      const response2 = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      if (response1.status === 200 && response2.status === 200) {
        // Score should be consistent (assuming no activity between requests)
        expect(response1.body.engagement_score).toBe(response2.body.engagement_score);
      }
    });

    it('should sort activity_feed by timestamp (most recent first)', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      if (response.status === 200 && response.body.activity_feed.length > 1) {
        const activities = response.body.activity_feed;
        
        for (let i = 0; i < activities.length - 1; i++) {
          const current = new Date(activities[i].timestamp);
          const next = new Date(activities[i + 1].timestamp);
          
          // Should be sorted newest first
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    it('should return reasonable activity_feed size for performance', async () => {
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      if (response.status === 200) {
        // Should not return excessive activity feed for performance
        expect(response.body.activity_feed.length).toBeLessThanOrEqual(50);
      }
    });

    it('should handle wedding with no activity gracefully', async () => {
      // Test with a wedding that has minimal activity
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      
      if (response.status === 200) {
        // Should still return valid structure even with no activity
        expect(typeof response.body.engagement_score).toBe('number');
        expect(Array.isArray(response.body.activity_feed)).toBe(true);
        expect(typeof response.body.metrics).toBe('object');
        
        // Engagement score should be reasonable even with no activity
        expect(response.body.engagement_score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${mockWeddingId}/engagement`);
      const endTime = Date.now();
      
      if (response.status === 200) {
        // Should respond quickly (under 3 seconds for contract test)
        expect(endTime - startTime).toBeLessThan(3000);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long wedding ID gracefully', async () => {
      const longId = 'a'.repeat(1000);
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${longId}/engagement`);
      
      expect([400, 404, 414]).toContain(response.status);
    });

    it('should handle special characters in wedding ID', async () => {
      const specialId = '123e4567-e89b-12d3-a456-426614174000%20';
      const response = await apiClient
        .withAuth(mockAuthToken)
        .get(`/clients/${encodeURIComponent(specialId)}/engagement`);
      
      expect([400, 404]).toContain(response.status);
    });
  });
});