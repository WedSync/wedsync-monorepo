/**
 * T026: Contract test POST /auth/login in tests/contract/wedsync_auth_login.test.ts
 * 
 * This test validates the WedSync API authentication endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - POST /auth/login
 * - Accepts email/password
 * - Returns access_token, user, and supplier data
 * - Handles authentication errors
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validSupplierCredentials, 
  invalidSupplierCredentials, 
  mockAuthResponse 
} from './helpers/fixtures';

describe('WedSync API - POST /auth/login Contract', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Valid Authentication', () => {
    test('should successfully authenticate with valid supplier credentials', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('supplier');

      // Validate token format (JWT)
      expect(response.body.access_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Validate user object structure
      expect(response.body.user).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        email: validSupplierCredentials.email,
        role: 'supplier',
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/),
        last_login_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)
      });

      // Validate supplier object structure
      expect(response.body.supplier).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        user_id: response.body.user.id,
        business_name: expect.any(String),
        specialization: expect.stringMatching(/^(photographer|dj|florist|caterer|venue|planner|other)$/),
        pricing_tier: expect.stringMatching(/^(free|starter|professional|scale|enterprise)$/),
        verification_status: expect.stringMatching(/^(unverified|verified|premium)$/)
      });
    });

    test('should include all required user fields', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      expect(response.status).toBe(200);
      
      const requiredUserFields = ['id', 'email', 'role', 'created_at', 'last_login_at'];
      requiredUserFields.forEach(field => {
        expect(response.body.user).toHaveProperty(field);
      });
    });

    test('should include all required supplier fields', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      expect(response.status).toBe(200);
      
      const requiredSupplierFields = [
        'id', 'user_id', 'business_name', 'specialization', 
        'pricing_tier', 'verification_status'
      ];
      requiredSupplierFields.forEach(field => {
        expect(response.body.supplier).toHaveProperty(field);
      });
    });
  });

  describe('Invalid Authentication', () => {
    test('should reject invalid credentials with 401', async () => {
      const response = await apiClient.post('/auth/login', invalidSupplierCredentials);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body).toHaveProperty('message');
    });

    test('should reject empty credentials with 400', async () => {
      const response = await apiClient.post('/auth/login', {});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should reject missing email with 400', async () => {
      const response = await apiClient.post('/auth/login', { 
        password: 'password123' 
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('email');
    });

    test('should reject missing password with 400', async () => {
      const response = await apiClient.post('/auth/login', { 
        email: 'test@example.com' 
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('password');
    });

    test('should reject invalid email format with 400', async () => {
      const response = await apiClient.post('/auth/login', {
        email: 'not-an-email',
        password: 'password123'
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('email');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle multiple rapid requests gracefully', async () => {
      const requests = Array(5).fill(null).map(() => 
        apiClient.post('/auth/login', invalidSupplierCredentials)
      );

      const responses = await Promise.all(requests);
      
      // All should return error responses (401 or 429 for rate limiting)
      responses.forEach(response => {
        expect([401, 429]).toContain(response.status);
      });
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in response', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      // Check for common security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should not expose sensitive server information', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      // Server header should not expose version details
      if (response.headers.server) {
        expect(response.headers.server).not.toContain('nginx/');
        expect(response.headers.server).not.toContain('Apache/');
      }
    });
  });

  describe('CORS Headers', () => {
    test('should include appropriate CORS headers for web clients', async () => {
      const response = await apiClient.post('/auth/login', validSupplierCredentials);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Response Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await apiClient.post('/auth/login', validSupplierCredentials);
      
      const responseTime = Date.now() - startTime;
      
      // Authentication should complete within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
  });
});