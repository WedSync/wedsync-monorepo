/**
 * T037: Contract test POST /auth/login in tests/contract/wedme_auth_login.test.ts
 * 
 * This test validates the WedMe API authentication endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - POST /auth/login
 * - Accepts couple email/password
 * - Returns access_token, user, and weddings data
 * - Handles authentication errors
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials, 
  invalidCoupleCredentials, 
  mockWedMeAuthResponse 
} from './helpers/fixtures';

describe('WedMe API - POST /auth/login Contract', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('Valid Authentication', () => {
    test('should successfully authenticate with valid couple credentials', async () => {
      const response = await apiClient.post('/auth/login', validCoupleCredentials);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('weddings');
      
      // Validate access token
      expect(typeof response.data.access_token).toBe('string');
      expect(response.data.access_token.length).toBeGreaterThan(0);
      
      // Validate user object
      const user = response.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('created_at');
      
      // Validate user properties
      expect(typeof user.id).toBe('string');
      expect(user.email).toBe(validCoupleCredentials.email);
      expect(user.role).toBe('couple');
      expect(typeof user.created_at).toBe('string');
      
      // Validate UUID format for user ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(user.id).toMatch(uuidRegex);
      
      // Validate ISO date format for created_at
      expect(() => new Date(user.created_at)).not.toThrow();
      
      // Validate weddings array
      expect(Array.isArray(response.data.weddings)).toBe(true);
    });

    test('should return wedding details in the response', async () => {
      const response = await apiClient.post('/auth/login', validCoupleCredentials);
      
      expect(response.status).toBe(200);
      
      if (response.data.weddings.length > 0) {
        const wedding = response.data.weddings[0];
        
        // Required wedding fields
        expect(wedding).toHaveProperty('id');
        expect(wedding).toHaveProperty('title');
        expect(wedding).toHaveProperty('wedding_date');
        expect(wedding).toHaveProperty('status');
        expect(wedding).toHaveProperty('core_details_complete');
        
        // Validate wedding properties
        expect(typeof wedding.id).toBe('string');
        expect(typeof wedding.title).toBe('string');
        expect(typeof wedding.wedding_date).toBe('string');
        expect(['planning', 'confirmed', 'completed', 'cancelled']).toContain(wedding.status);
        expect(typeof wedding.core_details_complete).toBe('boolean');
        
        // Validate UUID format for wedding ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(wedding.id).toMatch(uuidRegex);
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        expect(wedding.wedding_date).toMatch(dateRegex);
        
        // Optional fields validation if present
        if (wedding.ceremony_venue) {
          expect(wedding.ceremony_venue).toHaveProperty('id');
          expect(wedding.ceremony_venue).toHaveProperty('name');
        }
        
        if (wedding.reception_venue) {
          expect(wedding.reception_venue).toHaveProperty('id');
          expect(wedding.reception_venue).toHaveProperty('name');
        }
        
        if (wedding.guest_count_estimated !== undefined) {
          expect(typeof wedding.guest_count_estimated).toBe('number');
          expect(wedding.guest_count_estimated).toBeGreaterThanOrEqual(0);
        }
        
        if (wedding.guest_count_confirmed !== undefined) {
          expect(typeof wedding.guest_count_confirmed).toBe('number');
          expect(wedding.guest_count_confirmed).toBeGreaterThanOrEqual(0);
        }
        
        if (wedding.budget_total !== undefined) {
          expect(typeof wedding.budget_total).toBe('number');
          expect(wedding.budget_total).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Invalid Authentication', () => {
    test('should reject invalid credentials', async () => {
      const response = await apiClient.post('/auth/login', invalidCoupleCredentials);
      
      expect(response.status).toBe(401);
      expect(response.data).not.toHaveProperty('access_token');
      expect(response.data).not.toHaveProperty('user');
      expect(response.data).not.toHaveProperty('weddings');
    });

    test('should reject missing email', async () => {
      const invalidData = {
        password: 'password123'
        // Missing email
      };
      
      const response = await apiClient.post('/auth/login', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should reject missing password', async () => {
      const invalidData = {
        email: 'couple@test.com'
        // Missing password
      };
      
      const response = await apiClient.post('/auth/login', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const response = await apiClient.post('/auth/login', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should reject empty credentials', async () => {
      const invalidData = {
        email: '',
        password: ''
      };
      
      const response = await apiClient.post('/auth/login', invalidData);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Request Validation', () => {
    test('should require Content-Type application/json', async () => {
      // This test depends on the API client implementation
      // but validates the contract expects JSON content
      const response = await apiClient.post('/auth/login', validCoupleCredentials);
      
      // Should not fail due to content type when using proper JSON
      expect(response.status).not.toBe(415);
    });

    test('should handle malformed JSON gracefully', async () => {
      // This would be implementation-specific but the contract should handle it
      const response = await apiClient.postRaw('/auth/login', 'invalid-json');
      
      expect(response.status).toBe(400);
    });
  });

  describe('Security', () => {
    test('should not require authentication for login endpoint', async () => {
      // Login endpoint should be accessible without authentication
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post('/auth/login', validCoupleCredentials);
      
      // Should not fail with 401 (may fail with other codes if credentials are wrong)
      expect(response.status).not.toBe(401);
    });

    test('should not expose sensitive information in error responses', async () => {
      const response = await apiClient.post('/auth/login', invalidCoupleCredentials);
      
      expect(response.status).toBe(401);
      
      // Error response should not contain sensitive info
      const responseText = JSON.stringify(response.data).toLowerCase();
      expect(responseText).not.toContain('password');
      expect(responseText).not.toContain('hash');
      expect(responseText).not.toContain('secret');
    });
  });
});