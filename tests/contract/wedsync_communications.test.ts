/**
 * T036: Contract test GET/POST /communications in tests/contract/wedsync_communications.test.ts
 * 
 * This test validates the WedSync API communications endpoint contract.
 * It MUST FAIL until the actual API endpoint is implemented.
 * 
 * Contract being tested:
 * - GET /communications - Get communication history
 * - POST /communications - Send message
 * - Supports email, sms, whatsapp, internal message types
 * - Handles wedding-specific communications
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { mockWedding } from './helpers/fixtures';

describe('WedSync API - /communications Contract', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
  });

  describe('GET /communications', () => {
    test('should retrieve communication history without filters', async () => {
      const response = await apiClient.get('/communications');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const communication = response.data[0];
        expect(communication).toHaveProperty('id');
        expect(communication).toHaveProperty('wedding_id');
        expect(communication).toHaveProperty('sender_id');
        expect(communication).toHaveProperty('recipient_id');
        expect(communication).toHaveProperty('message_type');
        expect(['email', 'sms', 'whatsapp', 'internal']).toContain(communication.message_type);
        expect(communication).toHaveProperty('content');
        expect(communication).toHaveProperty('status');
        expect(['draft', 'sent', 'delivered', 'read', 'failed']).toContain(communication.status);
      }
    });

    test('should filter communications by wedding_id', async () => {
      const response = await apiClient.get(`/communications?wedding_id=${mockWedding.id}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((communication: any) => {
        expect(communication.wedding_id).toBe(mockWedding.id);
      });
    });

    test('should filter communications by message_type', async () => {
      const messageType = 'email';
      const response = await apiClient.get(`/communications?message_type=${messageType}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((communication: any) => {
        expect(communication.message_type).toBe(messageType);
      });
    });

    test('should handle multiple query parameters', async () => {
      const response = await apiClient.get(`/communications?wedding_id=${mockWedding.id}&message_type=email`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      response.data.forEach((communication: any) => {
        expect(communication.wedding_id).toBe(mockWedding.id);
        expect(communication.message_type).toBe('email');
      });
    });
  });

  describe('POST /communications', () => {
    const validCommunicationData = {
      wedding_id: mockWedding.id,
      recipient_id: '123e4567-e89b-12d3-a456-426614174004',
      message_type: 'email',
      subject: 'Wedding Update',
      content: 'This is a test communication message.'
    };

    test('should successfully send email message', async () => {
      const response = await apiClient.post('/communications', validCommunicationData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.wedding_id).toBe(validCommunicationData.wedding_id);
      expect(response.data.recipient_id).toBe(validCommunicationData.recipient_id);
      expect(response.data.message_type).toBe(validCommunicationData.message_type);
      expect(response.data.subject).toBe(validCommunicationData.subject);
      expect(response.data.content).toBe(validCommunicationData.content);
      expect(response.data).toHaveProperty('status');
      expect(['draft', 'sent', 'delivered', 'read', 'failed']).toContain(response.data.status);
    });

    test('should successfully send SMS message', async () => {
      const smsData = {
        ...validCommunicationData,
        message_type: 'sms',
        subject: undefined // SMS doesn't need subject
      };
      delete smsData.subject;
      
      const response = await apiClient.post('/communications', smsData);
      
      expect(response.status).toBe(201);
      expect(response.data.message_type).toBe('sms');
      expect(response.data).not.toHaveProperty('subject');
    });

    test('should successfully send WhatsApp message', async () => {
      const whatsappData = {
        ...validCommunicationData,
        message_type: 'whatsapp',
        subject: undefined
      };
      delete whatsappData.subject;
      
      const response = await apiClient.post('/communications', whatsappData);
      
      expect(response.status).toBe(201);
      expect(response.data.message_type).toBe('whatsapp');
    });

    test('should successfully send internal message', async () => {
      const internalData = {
        ...validCommunicationData,
        message_type: 'internal',
        subject: 'Internal Note'
      };
      
      const response = await apiClient.post('/communications', internalData);
      
      expect(response.status).toBe(201);
      expect(response.data.message_type).toBe('internal');
    });

    test('should handle scheduled messages', async () => {
      const scheduledData = {
        ...validCommunicationData,
        scheduled_for: '2024-12-31T09:00:00Z'
      };
      
      const response = await apiClient.post('/communications', scheduledData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('scheduled_for');
    });

    test('should validate required fields', async () => {
      const invalidData = {
        wedding_id: mockWedding.id,
        // Missing required fields: recipient_id, message_type, content
      };
      
      const response = await apiClient.post('/communications', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate message_type enum', async () => {
      const invalidData = {
        ...validCommunicationData,
        message_type: 'invalid_type'
      };
      
      const response = await apiClient.post('/communications', invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate UUID formats', async () => {
      const invalidData = {
        ...validCommunicationData,
        wedding_id: 'invalid-uuid'
      };
      
      const response = await apiClient.post('/communications', invalidData);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    test('should require authentication for GET /communications', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get('/communications');
      
      expect(response.status).toBe(401);
    });

    test('should require authentication for POST /communications', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post('/communications', {
        wedding_id: mockWedding.id,
        recipient_id: '123e4567-e89b-12d3-a456-426614174004',
        message_type: 'email',
        content: 'Test message'
      });
      
      expect(response.status).toBe(401);
    });
  });
});