/**
 * T044: Contract test GET/PUT /weddings/{id}/timeline in tests/contract/wedme_timeline.test.ts
 * 
 * This test validates the WedMe API timeline management endpoints contract.
 * It MUST FAIL until the actual API endpoints are implemented.
 * 
 * Contracts being tested:
 * - GET /weddings/{weddingId}/timeline
 * - PUT /weddings/{weddingId}/timeline
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials,
  mockCoupleWedding,
  mockTimeline,
  validTimelineUpdate,
  mockTimelineWithSuppliers
} from './helpers/fixtures';

describe('WedMe API - Timeline Management Contract', () => {
  let apiClient: ApiClient;
  const weddingId = mockCoupleWedding.id;

  beforeEach(async () => {
    apiClient = new ApiClient();
    // Authenticate as couple
    await apiClient.authenticate(validCoupleCredentials);
  });

  describe('GET /weddings/{weddingId}/timeline', () => {
    test('should get wedding timeline', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/timeline`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('timeline');
      expect(response.data).toHaveProperty('supplier_schedules');
      
      // Validate timeline structure
      expect(typeof response.data.timeline).toBe('object');
      expect(Array.isArray(response.data.supplier_schedules)).toBe(true);
      
      // Validate timeline content if present
      if (response.data.timeline && Object.keys(response.data.timeline).length > 0) {
        const timeline = response.data.timeline;
        
        // Timeline should have time-based structure
        Object.keys(timeline).forEach(timeKey => {
          const timeSlot = timeline[timeKey];
          expect(typeof timeSlot).toBe('object');
          
          if (timeSlot.events) {
            expect(Array.isArray(timeSlot.events)).toBe(true);
            timeSlot.events.forEach((event: any) => {
              expect(event).toHaveProperty('title');
              expect(typeof event.title).toBe('string');
              
              if (event.duration) {
                expect(typeof event.duration).toBe('number');
                expect(event.duration).toBeGreaterThan(0);
              }
              
              if (event.location) {
                expect(typeof event.location).toBe('string');
              }
              
              if (event.suppliers) {
                expect(Array.isArray(event.suppliers)).toBe(true);
              }
            });
          }
        });
      }
      
      // Validate supplier schedules
      response.data.supplier_schedules.forEach((schedule: any) => {
        expect(schedule).toHaveProperty('supplier_id');
        expect(schedule).toHaveProperty('schedule');
        
        expect(typeof schedule.supplier_id).toBe('string');
        expect(typeof schedule.schedule).toBe('object');
        
        // Validate UUID format for supplier ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(schedule.supplier_id).toMatch(uuidRegex);
      });
    });

    test('should handle empty timeline', async () => {
      // For a new wedding, timeline might be empty
      const response = await apiClient.get(`/weddings/${weddingId}/timeline`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('timeline');
      expect(response.data).toHaveProperty('supplier_schedules');
      
      // Empty timeline should still be valid objects/arrays
      expect(typeof response.data.timeline).toBe('object');
      expect(Array.isArray(response.data.supplier_schedules)).toBe(true);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get(`/weddings/${weddingId}/timeline`);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.get(`/weddings/${nonExistentWeddingId}/timeline`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle malformed UUID in path', async () => {
      const response = await apiClient.get('/weddings/invalid-uuid/timeline');
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /weddings/{weddingId}/timeline', () => {
    test('should update wedding timeline', async () => {
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, validTimelineUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('timeline');
      expect(response.data).toHaveProperty('updated_suppliers');
      
      // Validate updated timeline
      expect(typeof response.data.timeline).toBe('object');
      expect(Array.isArray(response.data.updated_suppliers)).toBe(true);
      
      // Timeline should match the update
      expect(response.data.timeline).toEqual(validTimelineUpdate.timeline);
      
      // Updated suppliers should be an array of supplier IDs
      response.data.updated_suppliers.forEach((supplierId: string) => {
        expect(typeof supplierId).toBe('string');
        
        // Should be valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(supplierId).toMatch(uuidRegex);
      });
    });

    test('should update timeline with complex schedule', async () => {
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, mockTimelineWithSuppliers);
      
      expect(response.status).toBe(200);
      
      const timeline = response.data.timeline;
      expect(typeof timeline).toBe('object');
      
      // Validate complex timeline structure
      Object.keys(timeline).forEach(timeKey => {
        const timeSlot = timeline[timeKey];
        expect(typeof timeSlot).toBe('object');
        
        if (timeSlot.events) {
          expect(Array.isArray(timeSlot.events)).toBe(true);
          
          timeSlot.events.forEach((event: any) => {
            expect(event).toHaveProperty('title');
            expect(typeof event.title).toBe('string');
            
            if (event.suppliers) {
              expect(Array.isArray(event.suppliers)).toBe(true);
              event.suppliers.forEach((supplier: any) => {
                expect(supplier).toHaveProperty('id');
                expect(supplier).toHaveProperty('role');
                expect(typeof supplier.id).toBe('string');
                expect(typeof supplier.role).toBe('string');
              });
            }
          });
        }
      });
    });

    test('should handle notify_suppliers flag', async () => {
      const updateWithNotification = {
        ...validTimelineUpdate,
        notify_suppliers: true
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, updateWithNotification);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('updated_suppliers');
      
      // When notify_suppliers is true, updated_suppliers should contain relevant supplier IDs
      expect(Array.isArray(response.data.updated_suppliers)).toBe(true);
    });

    test('should handle notify_suppliers=false', async () => {
      const updateWithoutNotification = {
        ...validTimelineUpdate,
        notify_suppliers: false
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, updateWithoutNotification);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('updated_suppliers');
      
      // When notify_suppliers is false, updated_suppliers might be empty
      expect(Array.isArray(response.data.updated_suppliers)).toBe(true);
    });

    test('should default notify_suppliers to true', async () => {
      const updateWithoutFlag = {
        timeline: validTimelineUpdate.timeline
        // notify_suppliers not specified, should default to true
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, updateWithoutFlag);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('updated_suppliers');
    });

    test('should require timeline in request body', async () => {
      const invalidData = {
        notify_suppliers: true
        // Missing required timeline
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate timeline structure', async () => {
      const invalidData = {
        timeline: 'invalid timeline string instead of object'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should handle empty timeline object', async () => {
      const emptyTimelineData = {
        timeline: {}
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, emptyTimelineData);
      
      expect(response.status).toBe(200);
      expect(response.data.timeline).toEqual({});
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${weddingId}/timeline`, validTimelineUpdate);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.put(`/weddings/${nonExistentWeddingId}/timeline`, validTimelineUpdate);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Timeline Validation', () => {
    test('should validate time format in timeline keys', async () => {
      const invalidTimeFormat = {
        timeline: {
          'invalid-time': {
            events: [{ title: 'Test Event' }]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, invalidTimeFormat);
      
      // Should either accept flexible format or reject invalid time format
      expect([200, 400]).toContain(response.status);
    });

    test('should validate event structure', async () => {
      const invalidEventStructure = {
        timeline: {
          '10:00': {
            events: [
              {
                // Missing required title
                duration: 60
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, invalidEventStructure);
      
      expect(response.status).toBe(400);
    });

    test('should validate supplier references in events', async () => {
      const invalidSupplierRef = {
        timeline: {
          '10:00': {
            events: [
              {
                title: 'Photography Session',
                suppliers: [
                  {
                    id: 'invalid-uuid',
                    role: 'photographer'
                  }
                ]
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, invalidSupplierRef);
      
      expect(response.status).toBe(400);
    });

    test('should handle overlapping events', async () => {
      const overlappingEvents = {
        timeline: {
          '14:00': {
            events: [
              {
                title: 'Ceremony',
                duration: 60,
                location: 'Main Hall'
              },
              {
                title: 'Photography',
                duration: 90,
                location: 'Garden'
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, overlappingEvents);
      
      // Overlapping events might be allowed depending on business rules
      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large timeline', async () => {
      const largeTimeline = {
        timeline: {}
      };
      
      // Create a timeline with many time slots
      for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          largeTimeline.timeline[timeKey] = {
            events: [
              {
                title: `Event at ${timeKey}`,
                duration: 15
              }
            ]
          };
        }
      }
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, largeTimeline);
      
      // Should either accept or reject gracefully
      expect([200, 413, 422]).toContain(response.status);
    });

    test('should handle timeline with many suppliers per event', async () => {
      const manySuppliersTimeline = {
        timeline: {
          '15:00': {
            events: [
              {
                title: 'Reception Setup',
                suppliers: Array(20).fill(null).map((_, i) => ({
                  id: `123e4567-e89b-12d3-a456-42661417400${i}`,
                  role: `Supplier ${i}`
                }))
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, manySuppliersTimeline);
      
      // Should either accept or reject gracefully
      expect([200, 400, 422]).toContain(response.status);
    });

    test('should handle deeply nested timeline structure', async () => {
      const deepTimelineStructure = {
        timeline: {
          '16:00': {
            events: [
              {
                title: 'Complex Event',
                duration: 120,
                location: 'Ballroom',
                setup: {
                  start_time: '15:30',
                  tasks: [
                    {
                      title: 'Setup chairs',
                      assignees: ['supplier1', 'supplier2'],
                      equipment: ['chairs', 'microphone']
                    }
                  ]
                },
                execution: {
                  phases: [
                    {
                      name: 'Welcome',
                      duration: 30,
                      suppliers: ['mc', 'photographer']
                    }
                  ]
                }
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, deepTimelineStructure);
      
      // Should handle complex nested structures
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Business Logic', () => {
    test('should preserve timeline history', async () => {
      // First update
      await apiClient.put(`/weddings/${weddingId}/timeline`, validTimelineUpdate);
      
      // Second update
      const secondUpdate = {
        timeline: {
          '11:00': {
            events: [{ title: 'Updated Event' }]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, secondUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.timeline).toEqual(secondUpdate.timeline);
    });

    test('should identify affected suppliers automatically', async () => {
      const timelineWithSuppliers = {
        timeline: {
          '12:00': {
            events: [
              {
                title: 'Photo Session',
                suppliers: [
                  {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    role: 'photographer'
                  }
                ]
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, timelineWithSuppliers);
      
      expect(response.status).toBe(200);
      expect(response.data.updated_suppliers).toContain('123e4567-e89b-12d3-a456-426614174001');
    });

    test('should handle timeline consistency', async () => {
      // Timeline should be consistent with wedding date
      const futureTimeline = {
        timeline: {
          '10:00': {
            events: [
              {
                title: 'Ceremony',
                date: mockCoupleWedding.wedding_date,
                duration: 60
              }
            ]
          }
        }
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/timeline`, futureTimeline);
      
      expect(response.status).toBe(200);
    });
  });
});