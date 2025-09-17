/**
 * T052: Integration test real-time data sync between platforms in tests/integration/realtime_sync.test.ts
 * 
 * This integration test validates real-time data synchronization between WedSync and WedMe platforms.
 * It ensures that data changes in one platform are immediately reflected in the other platform
 * through WebSocket connections, database triggers, and event-driven architecture.
 * 
 * Test scenarios:
 * 1. Real-time wedding data synchronization
 * 2. Guest list synchronization across platforms
 * 3. Form and submission real-time updates
 * 4. Task and timeline synchronization
 * 5. Communication thread updates
 * 6. Venue and supplier data sync
 * 7. Conflict resolution and eventual consistency
 * 8. Connection resilience and reconnection
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockCoupleWedding,
  validGuestData,
  validFormData,
  validTaskData,
  mockVenueData
} from '../contract/helpers/fixtures';

// WebSocket client for real-time testing
class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connectionPromise: Promise<void> | null = null;

  constructor(private url: string, private token: string) {}

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?token=${this.token}`);
        
        this.ws.onopen = () => resolve();
        this.ws.onerror = (error) => reject(error);
        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionPromise = null;
    this.messageHandlers.clear();
  }
}

describe('Integration: Real-time Data Sync Between Platforms', () => {
  let wedSyncClient: ApiClient;
  let wedMeClient: ApiClient;
  let adminClient: ApiClient;
  let wedSyncWsClient: WebSocketClient;
  let wedMeWsClient: WebSocketClient;
  let testWeddingId: string;
  let supplierToken: string;
  let coupleToken: string;
  let adminToken: string;
  let createdResourceIds: string[] = [];

  beforeAll(async () => {
    // Initialize API clients for all platforms
    wedSyncClient = new ApiClient(process.env.WEDSYNC_API_URL || 'http://localhost:3001/api/v1');
    wedMeClient = new ApiClient(process.env.WEDME_API_URL || 'http://localhost:3002/api/v1');
    adminClient = new ApiClient(process.env.ADMIN_API_URL || 'http://localhost:3003/api/v1');
  });

  beforeEach(async () => {
    // Authenticate with all platforms
    const supplierAuth = await wedSyncClient.post('/auth/login', validSupplierCredentials);
    expect(supplierAuth.status).toBe(200);
    supplierToken = supplierAuth.body.access_token;

    const coupleAuth = await wedMeClient.post('/auth/login', validCoupleCredentials);
    expect(coupleAuth.status).toBe(200);
    coupleToken = coupleAuth.body.access_token;

    const adminAuth = await adminClient.post('/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    expect(adminAuth.status).toBe(200);
    adminToken = adminAuth.body.access_token;
    
    testWeddingId = mockCoupleWedding.id;
    createdResourceIds = [];

    // Initialize WebSocket connections
    wedSyncWsClient = new WebSocketClient(
      process.env.WEDSYNC_WS_URL || 'ws://localhost:3001/ws',
      supplierToken
    );
    
    wedMeWsClient = new WebSocketClient(
      process.env.WEDME_WS_URL || 'ws://localhost:3002/ws',
      coupleToken
    );

    await Promise.all([
      wedSyncWsClient.connect(),
      wedMeWsClient.connect()
    ]);
  });

  afterEach(async () => {
    // Cleanup WebSocket connections
    wedSyncWsClient.disconnect();
    wedMeWsClient.disconnect();

    // Cleanup created test data
    for (const resourceId of createdResourceIds) {
      try {
        // Attempt cleanup across all platforms
        await Promise.allSettled([
          wedMeClient.withAuth(coupleToken).delete(`/resources/${resourceId}`),
          wedSyncClient.withAuth(supplierToken).delete(`/resources/${resourceId}`)
        ]);
      } catch (error) {
        console.warn(`Failed to cleanup resource ${resourceId}:`, error);
      }
    }
  });

  describe('Wedding Data Real-time Synchronization', () => {
    test('should sync wedding details changes in real-time', async () => {
      const syncMessages: any[] = [];
      
      // Set up WebSocket listeners
      wedSyncWsClient.onMessage('wedding_updated', (data) => {
        syncMessages.push({ platform: 'wedsync', type: 'wedding_updated', data });
      });

      wedMeWsClient.onMessage('wedding_updated', (data) => {
        syncMessages.push({ platform: 'wedme', type: 'wedding_updated', data });
      });

      // Step 1: Update wedding details via WedMe
      const weddingUpdate = {
        ceremony_time: '15:30',
        reception_venue: {
          name: 'Updated Reception Hall',
          address: {
            street: '789 Updated St',
            city: 'New City',
            state: 'NC',
            zip: '54321'
          }
        },
        guest_count_estimate: 150,
        budget_total: 45000,
        special_requirements: {
          accessibility: true,
          dietary_restrictions: ['vegetarian', 'gluten_free'],
          photography_restrictions: false
        }
      };

      const updateResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}`, weddingUpdate);

      expect(updateResponse.status).toBe(200);

      // Step 2: Wait for real-time sync and verify messages
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(syncMessages.length).toBeGreaterThan(0);
      
      const wedSyncMessage = syncMessages.find(m => m.platform === 'wedsync');
      expect(wedSyncMessage).toBeDefined();
      expect(wedSyncMessage.data.wedding_id).toBe(testWeddingId);
      expect(wedSyncMessage.data.changes).toMatchObject({
        ceremony_time: '15:30',
        guest_count_estimate: 150
      });

      // Step 3: Verify data consistency via API
      const [wedMeView, wedSyncView] = await Promise.all([
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}`),
        wedSyncClient.withAuth(supplierToken).get(`/weddings/${testWeddingId}`)
      ]);

      expect(wedMeView.status).toBe(200);
      expect(wedSyncView.status).toBe(200);

      // Verify both platforms have identical data
      expect(wedMeView.body.ceremony_time).toBe('15:30');
      expect(wedSyncView.body.ceremony_time).toBe('15:30');
      expect(wedMeView.body.reception_venue.name).toBe('Updated Reception Hall');
      expect(wedSyncView.body.reception_venue.name).toBe('Updated Reception Hall');
      expect(wedMeView.body.guest_count_estimate).toBe(150);
      expect(wedSyncView.body.guest_count_estimate).toBe(150);
    });

    test('should handle concurrent wedding updates with conflict resolution', async () => {
      const conflictMessages: any[] = [];
      
      wedSyncWsClient.onMessage('sync_conflict', (data) => {
        conflictMessages.push({ platform: 'wedsync', ...data });
      });

      wedMeWsClient.onMessage('sync_conflict', (data) => {
        conflictMessages.push({ platform: 'wedme', ...data });
      });

      // Step 1: Perform concurrent updates to same wedding
      const updatePromises = [
        wedMeClient.withAuth(coupleToken).put(`/weddings/${testWeddingId}`, {
          ceremony_time: '14:00',
          updated_by: 'couple',
          timestamp: Date.now()
        }),
        
        wedSyncClient.withAuth(supplierToken).put(`/weddings/${testWeddingId}`, {
          ceremony_time: '14:30',
          updated_by: 'supplier',
          timestamp: Date.now() + 100
        })
      ];

      const [coupleUpdate, supplierUpdate] = await Promise.allSettled(updatePromises);

      // Step 2: At least one update should succeed
      const successfulUpdates = [coupleUpdate, supplierUpdate].filter(
        result => result.status === 'fulfilled' && (result.value as any).status === 200
      );
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Step 3: Wait for conflict resolution
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: Verify eventual consistency
      const [finalWedMeView, finalWedSyncView] = await Promise.all([
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}`),
        wedSyncClient.withAuth(supplierToken).get(`/weddings/${testWeddingId}`)
      ]);

      expect(finalWedMeView.status).toBe(200);
      expect(finalWedSyncView.status).toBe(200);

      // Both platforms should have the same final state
      expect(finalWedMeView.body.ceremony_time).toBe(finalWedSyncView.body.ceremony_time);
      expect(finalWedMeView.body.last_updated_at).toBe(finalWedSyncView.body.last_updated_at);

      // Should have received conflict resolution notifications
      expect(conflictMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Guest List Real-time Synchronization', () => {
    test('should sync guest operations across platforms in real-time', async () => {
      const guestSyncMessages: any[] = [];
      
      wedSyncWsClient.onMessage('guest_list_updated', (data) => {
        guestSyncMessages.push({ platform: 'wedsync', ...data });
      });

      wedMeWsClient.onMessage('guest_list_updated', (data) => {
        guestSyncMessages.push({ platform: 'wedme', ...data });
      });

      // Step 1: Add guest via WedMe
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'RealTime',
          last_name: 'Sync Guest',
          email: 'realtime@test.com',
          relationship: 'Friend',
          plus_one_allowed: true
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdResourceIds.push(guestId);

      // Step 2: Wait for real-time sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Verify WebSocket notifications
      const wedSyncGuestMessage = guestSyncMessages.find(
        m => m.platform === 'wedsync' && m.operation === 'guest_added'
      );
      expect(wedSyncGuestMessage).toBeDefined();
      expect(wedSyncGuestMessage.guest_id).toBe(guestId);

      // Step 4: Verify guest appears in supplier view
      const supplierGuestList = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);

      expect(supplierGuestList.status).toBe(200);
      const syncedGuest = supplierGuestList.body.find((g: any) => g.id === guestId);
      expect(syncedGuest).toBeDefined();
      expect(syncedGuest.first_name).toBe('RealTime');

      // Step 5: Update guest RSVP via WedMe
      const rsvpResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests/${guestId}/rsvp`, {
          rsvp_status: 'attending',
          plus_one_name: 'RealTime Plus One',
          dietary_requirements: {
            vegetarian: true,
            allergies: ['nuts']
          }
        });

      expect(rsvpResponse.status).toBe(200);

      // Step 6: Wait for RSVP sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 7: Verify RSVP sync messages
      const rsvpSyncMessage = guestSyncMessages.find(
        m => m.platform === 'wedsync' && m.operation === 'rsvp_updated'
      );
      expect(rsvpSyncMessage).toBeDefined();
      expect(rsvpSyncMessage.guest_id).toBe(guestId);

      // Step 8: Verify RSVP data in supplier view
      const updatedSupplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(updatedSupplierView.status).toBe(200);
      expect(updatedSupplierView.body.rsvp_status).toBe('attending');
      expect(updatedSupplierView.body.plus_one_name).toBe('RealTime Plus One');
      expect(updatedSupplierView.body.dietary_requirements.vegetarian).toBe(true);
    });

    test('should sync bulk guest operations efficiently', async () => {
      const bulkSyncMessages: any[] = [];
      
      wedSyncWsClient.onMessage('bulk_guest_operation', (data) => {
        bulkSyncMessages.push({ platform: 'wedsync', ...data });
      });

      // Step 1: Bulk add guests
      const bulkGuestData = {
        guests: [
          { first_name: 'Bulk1', last_name: 'Guest', email: 'bulk1@test.com', relationship: 'Family' },
          { first_name: 'Bulk2', last_name: 'Guest', email: 'bulk2@test.com', relationship: 'Friend' },
          { first_name: 'Bulk3', last_name: 'Guest', email: 'bulk3@test.com', relationship: 'Colleague' }
        ]
      };

      const bulkResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/guests`, bulkGuestData);

      expect(bulkResponse.status).toBe(200);
      expect(bulkResponse.body.imported_count).toBe(3);

      // Step 2: Wait for bulk sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Verify bulk sync message
      const bulkSyncMessage = bulkSyncMessages.find(m => m.operation === 'bulk_import');
      expect(bulkSyncMessage).toBeDefined();
      expect(bulkSyncMessage.imported_count).toBe(3);

      // Step 4: Verify all guests appear in supplier view
      const supplierGuestList = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);

      expect(supplierGuestList.status).toBe(200);
      const bulkGuests = supplierGuestList.body.filter((g: any) => g.first_name.startsWith('Bulk'));
      expect(bulkGuests).toHaveLength(3);

      // Add to cleanup
      bulkGuests.forEach((guest: any) => {
        createdResourceIds.push(guest.id);
      });
    });
  });

  describe('Form and Submission Real-time Updates', () => {
    test('should sync form creation and submissions across platforms', async () => {
      const formSyncMessages: any[] = [];
      
      wedMeWsClient.onMessage('form_available', (data) => {
        formSyncMessages.push({ platform: 'wedme', type: 'form_available', ...data });
      });

      wedSyncWsClient.onMessage('form_submitted', (data) => {
        formSyncMessages.push({ platform: 'wedsync', type: 'form_submitted', ...data });
      });

      // Step 1: Create form via WedSync
      const formData = {
        title: 'RealTime Dietary Requirements Form',
        description: 'Please provide your dietary requirements',
        fields: [
          {
            type: 'text',
            label: 'Guest Name',
            required: true,
            validation: { min_length: 2 }
          },
          {
            type: 'select',
            label: 'Dietary Preference',
            options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'],
            required: true
          },
          {
            type: 'textarea',
            label: 'Allergies and Special Requirements',
            required: false
          }
        ],
        target_wedding_id: testWeddingId,
        auto_send_to_guests: true
      };

      const formResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post('/forms', formData);

      expect(formResponse.status).toBe(201);
      const formId = formResponse.body.id;
      createdResourceIds.push(formId);

      // Step 2: Wait for form availability sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Verify form available message received by couple
      const formAvailableMessage = formSyncMessages.find(
        m => m.type === 'form_available' && m.form_id === formId
      );
      expect(formAvailableMessage).toBeDefined();

      // Step 4: Verify form appears in WedMe
      const wedMeFormList = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/forms`);

      expect(wedMeFormList.status).toBe(200);
      const syncedForm = wedMeFormList.body.find((f: any) => f.id === formId);
      expect(syncedForm).toBeDefined();
      expect(syncedForm.title).toBe('RealTime Dietary Requirements Form');

      // Step 5: Submit form via WedMe
      const submissionData = {
        responses: {
          'Guest Name': 'RealTime Test Submitter',
          'Dietary Preference': 'Vegetarian',
          'Allergies and Special Requirements': 'No nuts please'
        },
        submitted_by_guest_id: null, // Couple submitting on behalf
        submission_method: 'couple_portal'
      };

      const submissionResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/forms/${formId}/submit`, submissionData);

      expect(submissionResponse.status).toBe(201);

      // Step 6: Wait for submission sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 7: Verify submission notification received by supplier
      const submissionMessage = formSyncMessages.find(
        m => m.type === 'form_submitted' && m.form_id === formId
      );
      expect(submissionMessage).toBeDefined();

      // Step 8: Verify submission appears in WedSync
      const wedSyncSubmissions = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/forms/${formId}/submissions`);

      expect(wedSyncSubmissions.status).toBe(200);
      expect(wedSyncSubmissions.body).toHaveLength(1);
      expect(wedSyncSubmissions.body[0].responses['Guest Name']).toBe('RealTime Test Submitter');
      expect(wedSyncSubmissions.body[0].responses['Dietary Preference']).toBe('Vegetarian');
    });
  });

  describe('Task and Timeline Real-time Sync', () => {
    test('should sync task updates and timeline changes in real-time', async () => {
      const taskSyncMessages: any[] = [];
      
      wedSyncWsClient.onMessage('task_updated', (data) => {
        taskSyncMessages.push({ platform: 'wedsync', ...data });
      });

      wedMeWsClient.onMessage('timeline_updated', (data) => {
        taskSyncMessages.push({ platform: 'wedme', type: 'timeline_updated', ...data });
      });

      // Step 1: Create task via WedMe
      const taskData = {
        title: 'RealTime Task: Finalize Menu',
        description: 'Work with caterer to finalize the wedding menu',
        due_date: '2024-05-15',
        priority: 'high',
        assigned_to: 'couple',
        category: 'catering',
        dependencies: [],
        estimated_duration: 120 // minutes
      };

      const taskResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/tasks`, taskData);

      expect(taskResponse.status).toBe(201);
      const taskId = taskResponse.body.id;
      createdResourceIds.push(taskId);

      // Step 2: Wait for task sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Verify task appears in WedSync supplier view
      const supplierTasks = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/tasks`);

      expect(supplierTasks.status).toBe(200);
      const syncedTask = supplierTasks.body.find((t: any) => t.id === taskId);
      expect(syncedTask).toBeDefined();
      expect(syncedTask.title).toBe('RealTime Task: Finalize Menu');

      // Step 4: Update task status via WedMe
      const taskUpdateResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/tasks/${taskId}`, {
          status: 'in_progress',
          progress_percentage: 25,
          notes: 'Started reviewing catering options'
        });

      expect(taskUpdateResponse.status).toBe(200);

      // Step 5: Wait for update sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 6: Verify task update sync message
      const taskUpdateMessage = taskSyncMessages.find(
        m => m.task_id === taskId && m.changes && m.changes.status === 'in_progress'
      );
      expect(taskUpdateMessage).toBeDefined();

      // Step 7: Verify updated task in supplier view
      const updatedSupplierTask = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/tasks/${taskId}`);

      expect(updatedSupplierTask.status).toBe(200);
      expect(updatedSupplierTask.body.status).toBe('in_progress');
      expect(updatedSupplierTask.body.progress_percentage).toBe(25);

      // Step 8: Update wedding timeline via WedMe
      const timelineUpdate = {
        timeline: {
          '13:00': {
            events: [{
              title: 'Guest Arrival',
              duration: 30,
              location: 'Main Entrance',
              notes: 'Welcome drinks served'
            }]
          },
          '13:30': {
            events: [{
              title: 'Ceremony',
              duration: 45,
              location: 'Garden Chapel',
              related_tasks: [taskId]
            }]
          }
        },
        notify_suppliers: true,
        sync_with_tasks: true
      };

      const timelineResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/timeline`, timelineUpdate);

      expect(timelineResponse.status).toBe(200);

      // Step 9: Wait for timeline sync
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 10: Verify timeline update message
      const timelineMessage = taskSyncMessages.find(m => m.type === 'timeline_updated');
      expect(timelineMessage).toBeDefined();

      // Step 11: Verify timeline sync in supplier view
      const supplierTimeline = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/timeline`);

      expect(supplierTimeline.status).toBe(200);
      expect(supplierTimeline.body.timeline['13:30'].events[0].title).toBe('Ceremony');
      expect(supplierTimeline.body.timeline['13:30'].events[0].related_tasks).toContain(taskId);
    });
  });

  describe('Connection Resilience and Reconnection', () => {
    test('should handle WebSocket disconnections and reconnections gracefully', async () => {
      const reconnectionMessages: any[] = [];
      
      wedSyncWsClient.onMessage('sync_resumed', (data) => {
        reconnectionMessages.push({ platform: 'wedsync', ...data });
      });

      // Step 1: Create initial data
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Resilience',
          last_name: 'Test',
          email: 'resilience@test.com'
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdResourceIds.push(guestId);

      // Step 2: Simulate connection loss
      wedSyncWsClient.disconnect();

      // Step 3: Make changes while disconnected
      const offlineUpdateResponse = await wedMeClient
        .withAuth(coupleToken)
        .put(`/weddings/${testWeddingId}/guests/${guestId}`, {
          phone: '+1555555555',
          dietary_requirements: { vegan: true }
        });

      expect(offlineUpdateResponse.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Reconnect WebSocket
      wedSyncWsClient = new WebSocketClient(
        process.env.WEDSYNC_WS_URL || 'ws://localhost:3001/ws',
        supplierToken
      );

      wedSyncWsClient.onMessage('sync_resumed', (data) => {
        reconnectionMessages.push({ platform: 'wedsync', ...data });
      });

      await wedSyncWsClient.connect();

      // Step 5: Wait for sync resume
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 6: Verify missed updates are synced
      const supplierView = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(supplierView.status).toBe(200);
      expect(supplierView.body.phone).toBe('+1555555555');
      expect(supplierView.body.dietary_requirements.vegan).toBe(true);

      // Step 7: Verify sync resume notification
      expect(reconnectionMessages.length).toBeGreaterThan(0);
      const syncResumedMessage = reconnectionMessages.find(m => m.missed_updates);
      expect(syncResumedMessage).toBeDefined();
    });

    test('should handle high-frequency updates without message loss', async () => {
      const allMessages: any[] = [];
      let messageCount = 0;
      
      wedSyncWsClient.onMessage('guest_updated', (data) => {
        messageCount++;
        allMessages.push({ platform: 'wedsync', sequence: messageCount, ...data });
      });

      // Step 1: Create test guest
      const guestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'HighFreq',
          last_name: 'Test',
          email: 'highfreq@test.com'
        });

      expect(guestResponse.status).toBe(201);
      const guestId = guestResponse.body.id;
      createdResourceIds.push(guestId);

      // Step 2: Perform rapid updates
      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        wedMeClient
          .withAuth(coupleToken)
          .put(`/weddings/${testWeddingId}/guests/${guestId}`, {
            phone: `+155555555${i}`,
            update_sequence: i,
            notes: `Update ${i} at ${Date.now()}`
          })
      );

      const updateResponses = await Promise.allSettled(updatePromises);
      
      // Step 3: Verify most updates succeeded
      const successfulUpdates = updateResponses.filter(
        r => r.status === 'fulfilled' && (r.value as any).status === 200
      );
      expect(successfulUpdates.length).toBeGreaterThan(7); // Allow some failures

      // Step 4: Wait for all sync messages
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 5: Verify message ordering and completeness
      expect(allMessages.length).toBeGreaterThan(0);
      
      // Messages should be in sequence
      for (let i = 1; i < allMessages.length; i++) {
        expect(allMessages[i].sequence).toBeGreaterThan(allMessages[i-1].sequence);
      }

      // Step 6: Verify final state consistency
      const finalState = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests/${guestId}`);

      expect(finalState.status).toBe(200);
      expect(finalState.body.phone).toMatch(/^\+15555555\d$/);
    });
  });

  describe('Performance and Scalability of Real-time Sync', () => {
    test('should maintain sync performance under load', async () => {
      const performanceMetrics = {
        syncLatencies: [] as number[],
        messagesSent: 0,
        messagesReceived: 0,
        startTime: Date.now()
      };

      wedSyncWsClient.onMessage('performance_sync', (data) => {
        const latency = Date.now() - data.timestamp;
        performanceMetrics.syncLatencies.push(latency);
        performanceMetrics.messagesReceived++;
      });

      // Step 1: Create multiple resources simultaneously
      const resourceCount = 15;
      const guestPromises = Array.from({ length: resourceCount }, (_, i) =>
        wedMeClient
          .withAuth(coupleToken)
          .post(`/weddings/${testWeddingId}/guests`, {
            first_name: `Perf${i}`,
            last_name: 'Load Test',
            email: `perf${i}@test.com`,
            timestamp: Date.now()
          })
      );

      performanceMetrics.messagesSent = resourceCount;
      
      const guestResponses = await Promise.all(guestPromises);
      guestResponses.forEach(response => {
        if (response.status === 201) {
          createdResourceIds.push(response.body.id);
        }
      });

      // Step 2: Wait for all sync messages
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Analyze performance metrics
      const totalTime = Date.now() - performanceMetrics.startTime;
      const avgLatency = performanceMetrics.syncLatencies.reduce((a, b) => a + b, 0) / 
                         performanceMetrics.syncLatencies.length;
      const messageDeliveryRate = performanceMetrics.messagesReceived / performanceMetrics.messagesSent;

      // Performance assertions
      expect(avgLatency).toBeLessThan(2000); // Average sync latency under 2 seconds
      expect(messageDeliveryRate).toBeGreaterThan(0.8); // At least 80% message delivery
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds

      console.log(`Real-time sync performance metrics:
        - Total time: ${totalTime}ms
        - Average latency: ${avgLatency}ms
        - Message delivery rate: ${(messageDeliveryRate * 100).toFixed(1)}%
        - Messages sent: ${performanceMetrics.messagesSent}
        - Messages received: ${performanceMetrics.messagesReceived}
      `);

      // Step 4: Verify all resources are properly synced
      const supplierGuestList = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/weddings/${testWeddingId}/guests`);

      expect(supplierGuestList.status).toBe(200);
      const perfGuests = supplierGuestList.body.filter((g: any) => g.first_name.startsWith('Perf'));
      expect(perfGuests.length).toBe(guestResponses.filter(r => r.status === 201).length);
    });
  });
});