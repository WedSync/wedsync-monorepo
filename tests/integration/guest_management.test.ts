/**
 * T051: Integration test guest management and RSVP flow in tests/integration/guest_management.test.ts
 * 
 * This integration test validates the complete guest management and RSVP workflow
 * across both WedSync and WedMe platforms, ensuring real-time data synchronization
 * and proper cross-platform communication.
 * 
 * Test scenarios:
 * 1. Complete guest lifecycle from supplier perspective
 * 2. Complete RSVP workflow from couple perspective
 * 3. Real-time synchronization between platforms
 * 4. Bulk operations and data consistency
 * 5. Cross-platform notifications and updates
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockCoupleWedding,
  validGuestData,
  validBulkGuestData,
  validRsvpData,
  mockRsvpWithPlusOne,
  mockRsvpDecline
} from '../contract/helpers/fixtures';

describe('Integration: Guest Management and RSVP Flow', () => {
  let wedSyncClient: ApiClient;
  let wedMeClient: ApiClient;
  let testWeddingId: string;
  let createdGuestIds: string[] = [];
  let supplierToken: string;
  let coupleToken: string;

  beforeAll(async () => {
    // Initialize API clients for both platforms
    wedSyncClient = new ApiClient(process.env.WEDSYNC_API_URL || 'http://localhost:3001/api/v1');
    wedMeClient = new ApiClient(process.env.WEDME_API_URL || 'http://localhost:3002/api/v1');
  });

  beforeEach(async () => {
    // Authenticate with both platforms
    const supplierAuth = await wedSyncClient.post('/auth/login', validSupplierCredentials);
    expect(supplierAuth.status).toBe(200);
    supplierToken = supplierAuth.body.access_token;

    const coupleAuth = await wedMeClient.post('/auth/login', validCoupleCredentials);
    expect(coupleAuth.status).toBe(200);
    coupleToken = coupleAuth.body.access_token;
    
    testWeddingId = mockCoupleWedding.id;
    createdGuestIds = [];
  });

  afterEach(async () => {
    // Cleanup created test data
    for (const guestId of createdGuestIds) {
      try {
        await wedMeClient.withAuth(coupleToken).delete(`/weddings/${testWeddingId}/guests/${guestId}`);
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Failed to cleanup guest ${guestId}:`, error);
      }
    }
  });

  describe('Complete Guest Lifecycle Management', () => {
    test('should manage complete guest lifecycle from creation to RSVP', async () => {
      // Step 1: Couple adds initial guest list via WedMe
      const guestCreateResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Integration',
          last_name: 'Test Guest',
          email: 'integration.guest@test.com',
          phone: '+1234567890',
          relationship: 'Friend',
          plus_one_allowed: true
        });

      expect(guestCreateResponse.status).toBe(201);
      expect(guestCreateResponse.body).toHaveProperty('id');
      expect(guestCreateResponse.body.rsvp_status).toBe('pending');
      
      const guestId = guestCreateResponse.body.id;
      createdGuestIds.push(guestId);

      // Step 2: Verify guest appears in WedSync supplier view (real-time sync)
      // Wait a brief moment for real-time sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const supplierGuestView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);

      expect(supplierGuestView.status).toBe(200);
      const supplierGuests = supplierGuestView.body;
      const syncedGuest = supplierGuests.find((g: any) => g.id === guestId);
      expect(syncedGuest).toBeDefined();
      expect(syncedGuest.first_name).toBe('Integration');
      expect(syncedGuest.last_name).toBe('Test Guest');

      // Step 3: Guest updates details via WedMe
      const guestUpdateResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/guests/${guestId}`, {
          phone: '+1234567891', // Updated phone
          dietary_requirements: {
            vegetarian: true,
            allergies: ['nuts']
          }
        });

      expect(guestUpdateResponse.status).toBe(200);
      expect(guestUpdateResponse.body.phone).toBe('+1234567891');
      expect(guestUpdateResponse.body.dietary_requirements.vegetarian).toBe(true);

      // Step 4: Verify updates sync to WedSync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSupplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(updatedSupplierView.status).toBe(200);
      expect(updatedSupplierView.body.phone).toBe('+1234567891');
      expect(updatedSupplierView.body.dietary_requirements.vegetarian).toBe(true);

      // Step 5: Guest submits RSVP via WedMe
      const rsvpResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'attending',
          plus_one_name: 'Plus One Guest',
          dietary_requirements: {
            vegetarian: true,
            allergies: ['nuts', 'shellfish'],
            special_notes: 'Please ensure vegetarian meal'
          },
          special_notes: 'Looking forward to celebrating with you!'
        });

      expect(rsvpResponse.status).toBe(200);
      expect(rsvpResponse.body.rsvp_status).toBe('attending');
      expect(rsvpResponse.body.plus_one_name).toBe('Plus One Guest');
      expect(rsvpResponse.body.rsvp_responded_at).toBeDefined();

      // Step 6: Verify RSVP data syncs to supplier view
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalSupplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(finalSupplierView.status).toBe(200);
      expect(finalSupplierView.body.rsvp_status).toBe('attending');
      expect(finalSupplierView.body.plus_one_name).toBe('Plus One Guest');
      expect(finalSupplierView.body.dietary_requirements.allergies).toContain('shellfish');

      // Step 7: Verify guest count updates in wedding summary
      const weddingSummary = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}`);

      expect(weddingSummary.status).toBe(200);
      expect(weddingSummary.body.guest_count_confirmed).toBeGreaterThan(0);
    });
  });

  describe('Bulk Guest Operations and Data Consistency', () => {
    test('should handle bulk guest import with real-time sync', async () => {
      // Step 1: Bulk import guests via WedMe
      const bulkGuestData = {
        guests: [
          {
            first_name: 'Bulk',
            last_name: 'Guest One',
            email: 'bulk1@test.com',
            relationship: 'Family',
            plus_one_allowed: true
          },
          {
            first_name: 'Bulk',
            last_name: 'Guest Two',
            email: 'bulk2@test.com',
            relationship: 'Friend',
            plus_one_allowed: false
          },
          {
            first_name: 'Bulk',
            last_name: 'Guest Three',
            email: 'bulk3@test.com',
            relationship: 'Colleague',
            plus_one_allowed: true,
            dietary_requirements: {
              vegan: true
            }
          }
        ]
      };

      const bulkImportResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/guests`, bulkGuestData);

      expect(bulkImportResponse.status).toBe(200);
      expect(bulkImportResponse.body.imported_count).toBe(3);
      expect(bulkImportResponse.body.failed_count).toBe(0);

      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Verify all guests appear in supplier view
      const supplierGuestList = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);

      expect(supplierGuestList.status).toBe(200);
      const guests = supplierGuestList.body;
      
      const bulkGuests = guests.filter((g: any) => g.first_name === 'Bulk');
      expect(bulkGuests).toHaveLength(3);

      // Store guest IDs for cleanup
      bulkGuests.forEach((guest: any) => {
        createdGuestIds.push(guest.id);
      });

      // Step 3: Verify dietary requirements are properly synced
      const veganGuest = bulkGuests.find((g: any) => g.last_name === 'Guest Three');
      expect(veganGuest).toBeDefined();
      expect(veganGuest.dietary_requirements.vegan).toBe(true);

      // Step 4: Multiple guests RSVP simultaneously
      const rsvpPromises = bulkGuests.map((guest: any, index: number) => {
        const rsvpData = {
          rsvp_status: index === 0 ? 'attending' : index === 1 ? 'not_attending' : 'maybe',
          ...(guest.plus_one_allowed && index === 0 ? { plus_one_name: 'Bulk Plus One' } : {}),
          ...(index === 1 ? { special_notes: 'Cannot attend due to work' } : {})
        };

        return wedMeClient
          .withAuth(coupleToken)
          .post(`/weddings/${testWeddingId}/guests/${guest.id}/rsvp`, rsvpData);
      });

      const rsvpResponses = await Promise.all(rsvpPromises);
      
      // Verify all RSVPs succeeded
      rsvpResponses.forEach((response, index) => {
        expect(response.status).toBe(200);
        const expectedStatus = index === 0 ? 'attending' : index === 1 ? 'not_attending' : 'maybe';
        expect(response.body.rsvp_status).toBe(expectedStatus);
      });

      // Step 5: Verify RSVP aggregation and stats
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const guestStats = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/guests/stats`);

      expect(guestStats.status).toBe(200);
      expect(guestStats.body.total_invited).toBeGreaterThanOrEqual(3);
      expect(guestStats.body.attending_count).toBeGreaterThanOrEqual(1);
      expect(guestStats.body.not_attending_count).toBeGreaterThanOrEqual(1);
      expect(guestStats.body.pending_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-time Data Synchronization', () => {
    test('should maintain data consistency across platforms during concurrent operations', async () => {
      // Step 1: Create guest via WedMe
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Concurrent',
          last_name: 'Test',
          email: 'concurrent@test.com',
          relationship: 'Family'
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdGuestIds.push(guestId);

      // Step 2: Perform concurrent operations
      const concurrentPromises = [
        // Update guest details via WedMe
        wedMeClient
          .withAuth(coupleToken)
          .put(`/weddings/${testWeddingId}/guests/${guestId}`, {
            phone: '+1111111111',
            dietary_requirements: { gluten_free: true }
          }),
        
        // Submit RSVP via WedMe
        new Promise(resolve => setTimeout(() => {
          resolve(wedMeClient
            .withAuth(coupleToken)
            .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
              rsvp_status: 'attending',
              dietary_requirements: { 
                gluten_free: true,
                dairy_free: true 
              }
            }));
        }, 500)),
        
        // Check guest from supplier view
        new Promise(resolve => setTimeout(() => {
          resolve(wedSyncClient
            .withAuth(supplierToken)
            .get(`/weddings/${testWeddingId}/guests/${guestId}`));
        }, 1000))
      ];

      const [updateResponse, rsvpResponse, supplierViewResponse] = await Promise.all(concurrentPromises);

      // Step 3: Verify all operations succeeded
      expect((updateResponse as any).status).toBe(200);
      expect((rsvpResponse as any).status).toBe(200);
      expect((supplierViewResponse as any).status).toBe(200);

      // Step 4: Verify final data consistency
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalWedMeView = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      const finalSupplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(finalWedMeView.status).toBe(200);
      expect(finalSupplierView.status).toBe(200);

      // Verify data consistency between platforms
      const wedMeGuest = finalWedMeView.body;
      const supplierGuest = finalSupplierView.body;

      expect(wedMeGuest.id).toBe(supplierGuest.id);
      expect(wedMeGuest.rsvp_status).toBe(supplierGuest.rsvp_status);
      expect(wedMeGuest.phone).toBe(supplierGuest.phone);
      expect(wedMeGuest.dietary_requirements.gluten_free).toBe(true);
      expect(wedMeGuest.dietary_requirements.dairy_free).toBe(true);
      expect(supplierGuest.dietary_requirements.gluten_free).toBe(true);
      expect(supplierGuest.dietary_requirements.dairy_free).toBe(true);
    });
  });

  describe('Cross-platform Notifications and Updates', () => {
    test('should trigger proper notifications across platforms', async () => {
      // Step 1: Create guest with notification preferences
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Notification',
          last_name: 'Test',
          email: 'notification@test.com',
          phone: '+1222222222',
          relationship: 'Friend',
          plus_one_allowed: true,
          notification_preferences: {
            email: true,
            sms: true,
            push: false
          }
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdGuestIds.push(guestId);

      // Step 2: Submit RSVP and check notification triggers
      const rsvpResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'attending',
          plus_one_name: 'Notification Plus One',
          special_notes: 'Excited to attend!'
        });

      expect(rsvpResponse.status).toBe(200);

      // Step 3: Verify supplier receives notification about RSVP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const supplierNotifications = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/notifications?type=guest_rsvp&wedding_id=${testWeddingId}`);

      expect(supplierNotifications.status).toBe(200);
      expect(Array.isArray(supplierNotifications.body)).toBe(true);
      
      // Should have notification about the RSVP
      const rsvpNotification = supplierNotifications.body.find((n: any) => 
        n.data.guest_id === guestId && n.type === 'guest_rsvp'
      );
      expect(rsvpNotification).toBeDefined();
      expect(rsvpNotification.data.rsvp_status).toBe('attending');

      // Step 4: Update wedding timeline and verify guest notifications
      const timelineUpdate = {
        timeline: {
          '14:00': {
            events: [{
              title: 'Ceremony',
              duration: 45,
              location: 'Main Chapel'
            }]
          },
          '15:30': {
            events: [{
              title: 'Reception',
              duration: 300,
              location: 'Grand Ballroom'
            }]
          }
        },
        notify_guests: true
      };

      const timelineResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/timeline`, timelineUpdate);

      expect(timelineResponse.status).toBe(200);

      // Step 5: Verify guest receives timeline notification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const guestNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}/notifications`);

      expect(guestNotifications.status).toBe(200);
      const timelineNotification = guestNotifications.body.find((n: any) => 
        n.type === 'timeline_update'
      );
      expect(timelineNotification).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle sync failures gracefully', async () => {
      // Step 1: Create guest with potential sync issues
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Sync',
          last_name: 'Test',
          email: 'sync.test@test.com'
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdGuestIds.push(guestId);

      // Step 2: Simulate rapid updates that might cause sync conflicts
      const rapidUpdates = Array.from({ length: 5 }, (_, i) => 
        wedMeClient
          .withAuth(coupleToken)
          .put(`/weddings/${testWeddingId}/guests/${guestId}`, {
            phone: `+111111111${i}`,
            update_sequence: i
          })
      );

      const updateResponses = await Promise.allSettled(rapidUpdates);
      
      // At least some updates should succeed
      const successfulUpdates = updateResponses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 200
      );
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Step 3: Verify eventual consistency
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const finalState = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(finalState.status).toBe(200);
      expect(finalState.body.phone).toMatch(/^\+11111111\d$/);

      // Step 4: Verify supplier view matches
      const supplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(supplierView.status).toBe(200);
      expect(supplierView.body.phone).toBe(finalState.body.phone);
    });

    test('should handle invalid RSVP transitions properly', async () => {
      // Step 1: Create guest and submit initial RSVP
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'RSVP',
          last_name: 'Transition',
          email: 'rsvp.transition@test.com'
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdGuestIds.push(guestId);

      // Step 2: Submit valid RSVP
      const initialRsvp = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'attending'
        });

      expect(initialRsvp.status).toBe(200);

      // Step 3: Attempt invalid status transition
      const invalidRsvp = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'invalid_status'
        });

      expect(invalidRsvp.status).toBe(400);

      // Step 4: Verify original status is preserved
      const guestCheck = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(guestCheck.status).toBe(200);
      expect(guestCheck.body.rsvp_status).toBe('attending');

      // Step 5: Submit valid status change
      const validChange = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'not_attending',
          special_notes: 'Plans changed'
        });

      expect(validChange.status).toBe(200);
      expect(validChange.body.rsvp_status).toBe('not_attending');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high-volume guest operations efficiently', async () => {
      const guestCount = 20; // Reduced for faster test execution
      const startTime = Date.now();

      // Step 1: Create multiple guests in parallel
      const guestPromises = Array.from({ length: guestCount }, (_, i) =>
        wedMeClient
          .withAuth(coupleToken)
          .post(`/weddings/${testWeddingId}/guests`, {
            first_name: `Perf${i}`,
            last_name: 'Test',
            email: `perf${i}@test.com`,
            relationship: 'Friend'
          })
      );

      const guestResponses = await Promise.all(guestPromises);
      const creationTime = Date.now() - startTime;

      // Verify all guests were created
      guestResponses.forEach(response => {
        expect(response.status).toBe(201);
        createdGuestIds.push(response.body.id);
      });

      // Step 2: Submit RSVPs in parallel
      const rsvpStartTime = Date.now();
      const rsvpPromises = guestResponses.map((response, i) =>
        wedMeClient
          .withAuth(coupleToken)
          .post(`/weddings/${testWeddingId}/guests/${response.body.id}/rsvp`, {
            rsvp_status: i % 3 === 0 ? 'attending' : i % 3 === 1 ? 'not_attending' : 'maybe'
          })
      );

      const rsvpResponses = await Promise.all(rsvpPromises);
      const rsvpTime = Date.now() - rsvpStartTime;

      // Verify all RSVPs succeeded
      rsvpResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Step 3: Verify sync performance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const syncStartTime = Date.now();
      const supplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);
      const syncTime = Date.now() - syncStartTime;

      expect(supplierView.status).toBe(200);
      const perfGuests = supplierView.body.filter((g: any) => g.first_name.startsWith('Perf'));
      expect(perfGuests.length).toBe(guestCount);

      // Performance assertions (adjust thresholds based on requirements)
      expect(creationTime).toBeLessThan(5000); // 5 seconds for 20 guests
      expect(rsvpTime).toBeLessThan(3000); // 3 seconds for 20 RSVPs
      expect(syncTime).toBeLessThan(1000); // 1 second for sync verification

      console.log(`Performance metrics:
        - Guest creation: ${creationTime}ms for ${guestCount} guests
        - RSVP submission: ${rsvpTime}ms for ${guestCount} RSVPs
        - Sync verification: ${syncTime}ms
      `);
    });
  });
});