/**
 * T053: Integration test cross-platform communication in tests/integration/communication_flow.test.ts
 * 
 * This integration test validates communication flows between WedSync and WedMe platforms.
 * It ensures that messages, notifications, updates, and collaborative features work seamlessly
 * across both platforms, maintaining context and ensuring all parties stay informed.
 * 
 * Test scenarios:
 * 1. Supplier-to-couple communication via WedSync → WedMe
 * 2. Couple-to-supplier communication via WedMe → WedSync
 * 3. Multi-party communication threads
 * 4. Automated notification flows
 * 5. Form-based communication workflows
 * 6. Task-related communication and updates
 * 7. Emergency and priority communication
 * 8. Communication audit trails and history
 * 9. Cross-platform file sharing and attachments
 * 10. Integration with external communication channels
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockCoupleWedding,
  validFormData,
  validTaskData,
  mockVenueData
} from '../contract/helpers/fixtures';

// Mock email service for testing
class MockEmailService {
  public sentEmails: any[] = [];
  
  async sendEmail(to: string, subject: string, content: string, attachments?: any[]): Promise<void> {
    this.sentEmails.push({
      to,
      subject,
      content,
      attachments: attachments || [],
      timestamp: Date.now()
    });
  }

  reset(): void {
    this.sentEmails = [];
  }

  getEmailsTo(email: string): any[] {
    return this.sentEmails.filter(e => e.to.includes(email));
  }
}

// Mock SMS service for testing
class MockSMSService {
  public sentSMS: any[] = [];
  
  async sendSMS(to: string, message: string): Promise<void> {
    this.sentSMS.push({
      to,
      message,
      timestamp: Date.now()
    });
  }

  reset(): void {
    this.sentSMS = [];
  }
}

describe('Integration: Cross-platform Communication Flow', () => {
  let wedSyncClient: ApiClient;
  let wedMeClient: ApiClient;
  let adminClient: ApiClient;
  let testWeddingId: string;
  let supplierToken: string;
  let coupleToken: string;
  let adminToken: string;
  let createdResourceIds: string[] = [];
  let mockEmailService: MockEmailService;
  let mockSMSService: MockSMSService;

  beforeAll(async () => {
    // Initialize API clients for all platforms
    wedSyncClient = new ApiClient(process.env.WEDSYNC_API_URL || 'http://localhost:3001/api/v1');
    wedMeClient = new ApiClient(process.env.WEDME_API_URL || 'http://localhost:3002/api/v1');
    adminClient = new ApiClient(process.env.ADMIN_API_URL || 'http://localhost:3003/api/v1');
    
    // Initialize mock services
    mockEmailService = new MockEmailService();
    mockSMSService = new MockSMSService();
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
    
    // Reset mock services
    mockEmailService.reset();
    mockSMSService.reset();
  });

  afterEach(async () => {
    // Cleanup created test data
    for (const resourceId of createdResourceIds) {
      try {
        await Promise.allSettled([
          wedMeClient.withAuth(coupleToken).delete(`/resources/${resourceId}`),
          wedSyncClient.withAuth(supplierToken).delete(`/resources/${resourceId}`)
        ]);
      } catch (error) {
        console.warn(`Failed to cleanup resource ${resourceId}:`, error);
      }
    }
  });

  describe('Supplier-to-Couple Communication', () => {
    test('should deliver supplier messages to couple across platforms', async () => {
      // Step 1: Supplier sends message via WedSync
      const messageData = {
        subject: 'Wedding Photography Timeline',
        content: `Hi John & Jane,

I wanted to discuss the photography timeline for your special day. Based on our previous conversations, here's my recommended schedule:

**Pre-Ceremony (2:00 PM - 3:00 PM)**
- Bridal party getting ready shots
- Detail shots of dress, rings, flowers
- First look session (if desired)

**Ceremony (3:00 PM - 3:45 PM)**
- Guest arrival candids
- Processional and ceremony
- Recessional and immediate family shots

**Reception (4:00 PM - 9:00 PM)**
- Cocktail hour candids
- Reception details and décor
- First dance, speeches, cake cutting
- Open dancing and celebration

Please let me know if you'd like to adjust any timing or have specific shot requests!

Best regards,
Sarah Photography Studio`,
        recipient_type: 'couple',
        wedding_id: testWeddingId,
        priority: 'normal',
        message_type: 'timeline_discussion',
        request_response: true,
        attachments: [
          {
            name: 'sample_timeline.pdf',
            type: 'application/pdf',
            size: 245760,
            url: 'https://example.com/sample_timeline.pdf'
          }
        ]
      };

      const messageResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/send`, messageData);

      expect(messageResponse.status).toBe(201);
      const messageId = messageResponse.body.id;
      createdResourceIds.push(messageId);

      // Step 2: Wait for cross-platform delivery
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Verify message appears in WedMe for couple
      const coupleInbox = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox`);

      expect(coupleInbox.status).toBe(200);
      const receivedMessage = coupleInbox.body.find((m: any) => m.id === messageId);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.subject).toBe('Wedding Photography Timeline');
      expect(receivedMessage.sender_type).toBe('supplier');
      expect(receivedMessage.status).toBe('delivered');

      // Step 4: Verify notification was sent
      const coupleNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/notifications?type=new_message`);

      expect(coupleNotifications.status).toBe(200);
      const messageNotification = coupleNotifications.body.find(
        (n: any) => n.data.message_id === messageId
      );
      expect(messageNotification).toBeDefined();

      // Step 5: Couple reads message
      const readResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/${messageId}/mark-read`);

      expect(readResponse.status).toBe(200);

      // Step 6: Verify read receipt reaches supplier
      await new Promise(resolve => setTimeout(resolve, 1000));

      const supplierOutbox = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/sent`);

      expect(supplierOutbox.status).toBe(200);
      const sentMessage = supplierOutbox.body.find((m: any) => m.id === messageId);
      expect(sentMessage).toBeDefined();
      expect(sentMessage.read_at).toBeDefined();
      expect(sentMessage.read_status).toBe('read');
    });

    test('should handle urgent supplier communications with immediate notifications', async () => {
      // Step 1: Supplier sends urgent message
      const urgentMessageData = {
        subject: 'URGENT: Weather Alert for Wedding Day',
        content: `URGENT UPDATE: Weather forecast shows possible rain on your wedding day (June 15th).

I recommend we discuss backup plans:
1. Indoor ceremony setup at venue
2. Covered photo locations
3. Umbrella coordination for bridal party

Please call me ASAP at (555) 123-4567 or respond to this message.

Time sensitive - need to coordinate with venue by tomorrow!`,
        recipient_type: 'couple',
        wedding_id: testWeddingId,
        priority: 'urgent',
        message_type: 'emergency_alert',
        request_immediate_response: true,
        notification_channels: ['email', 'sms', 'push']
      };

      const urgentResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/send`, urgentMessageData);

      expect(urgentResponse.status).toBe(201);
      const urgentMessageId = urgentResponse.body.id;
      createdResourceIds.push(urgentMessageId);

      // Step 2: Wait for immediate notification delivery
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Verify urgent message in WedMe with priority flag
      const urgentInbox = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox?priority=urgent`);

      expect(urgentInbox.status).toBe(200);
      expect(urgentInbox.body).toHaveLength(1);
      expect(urgentInbox.body[0].id).toBe(urgentMessageId);
      expect(urgentInbox.body[0].priority).toBe('urgent');

      // Step 4: Verify multiple notification channels triggered
      const urgentNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/notifications?message_id=${urgentMessageId}`);

      expect(urgentNotifications.status).toBe(200);
      const channels = urgentNotifications.body.map((n: any) => n.channel);
      expect(channels).toContain('email');
      expect(channels).toContain('sms');
      expect(channels).toContain('push');

      // Step 5: Couple responds to urgent message
      const responseData = {
        content: `Thanks for the heads up! Yes, let's definitely set up the indoor backup plan. 

Can you coordinate with the venue manager about:
- Moving ceremony to the covered pavilion
- Setting up additional lighting
- Ensuring guest seating works in the new space

We'll call you this evening to discuss details.

- John & Jane`,
        message_type: 'urgent_response',
        reply_to_message_id: urgentMessageId
      };

      const coupleResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/send`, responseData);

      expect(coupleResponse.status).toBe(201);
      const responseId = coupleResponse.body.id;
      createdResourceIds.push(responseId);

      // Step 6: Verify supplier receives response notification
      await new Promise(resolve => setTimeout(resolve, 1500));

      const supplierNotifications = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/notifications?type=urgent_response`);

      expect(supplierNotifications.status).toBe(200);
      const responseNotification = supplierNotifications.body.find(
        (n: any) => n.data.message_id === responseId
      );
      expect(responseNotification).toBeDefined();
    });
  });

  describe('Couple-to-Supplier Communication', () => {
    test('should deliver couple messages to supplier with context preservation', async () => {
      // Step 1: Couple sends message via WedMe
      const coupleMessageData = {
        subject: 'Menu Preferences and Dietary Requirements',
        content: `Hi Sarah,

We're getting excited about the big day! We wanted to share some details about our menu preferences and guest dietary requirements:

**Menu Preferences:**
- We'd love to incorporate some Italian dishes (John's heritage)
- Prefer lighter options for the cocktail hour
- Signature cocktails: Old Fashioned and Mojito

**Dietary Requirements:**
- 8 vegetarian guests
- 3 vegan guests  
- 2 guests with severe nut allergies
- 1 guest with celiac disease (gluten-free needed)

**Special Requests:**
- Kids menu for 6 children (ages 4-12)
- Late night snack station (pizza or sliders?)

Do you have vendors you'd recommend for catering? We'd love to set up tastings in the next two weeks.

Also, should we create a dietary requirements form for our guests to fill out?

Thanks for all your help!
Jane & John`,
        recipient_type: 'supplier',
        wedding_id: testWeddingId,
        message_category: 'catering_planning',
        tags: ['menu', 'dietary_requirements', 'vendor_recommendations'],
        request_vendor_suggestions: true,
        timeline_related: true
      };

      const coupleMessageResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/send`, coupleMessageData);

      expect(coupleMessageResponse.status).toBe(201);
      const coupleMessageId = coupleMessageResponse.body.id;
      createdResourceIds.push(coupleMessageId);

      // Step 2: Wait for cross-platform delivery
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Verify message appears in WedSync with context
      const supplierInbox = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/inbox?category=catering_planning`);

      expect(supplierInbox.status).toBe(200);
      const receivedMessage = supplierInbox.body.find((m: any) => m.id === coupleMessageId);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.subject).toBe('Menu Preferences and Dietary Requirements');
      expect(receivedMessage.sender_type).toBe('couple');
      expect(receivedMessage.tags).toContain('dietary_requirements');
      expect(receivedMessage.request_vendor_suggestions).toBe(true);

      // Step 4: Verify related wedding context is attached
      const messageDetails = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/${coupleMessageId}/details`);

      expect(messageDetails.status).toBe(200);
      expect(messageDetails.body.wedding_context).toBeDefined();
      expect(messageDetails.body.wedding_context.guest_count).toBeDefined();
      expect(messageDetails.body.wedding_context.wedding_date).toBe('2024-06-15');

      // Step 5: Supplier responds with vendor recommendations
      const supplierResponseData = {
        content: `Hi Jane & John,

Great to hear from you! I love your menu ideas and I have perfect vendor recommendations for you.

**Recommended Caterers:**
1. **Bella Vista Catering** - Specializes in Italian cuisine, excellent with dietary restrictions
   - Contact: Maria Rossi, (555) 234-5678
   - Known for: Authentic Italian dishes, accommodation of all dietary needs
   - Price range: $$-$$$

2. **Garden Fresh Catering** - Farm-to-table, extensive vegan/vegetarian options  
   - Contact: Chef David, (555) 345-6789
   - Known for: Fresh, local ingredients, beautiful presentation
   - Price range: $$$

3. **Classic Celebrations** - Full-service, great kids menu options
   - Contact: Jennifer Smith, (555) 456-7890
   - Known for: Traditional and modern fusion, family-friendly
   - Price range: $$

I can arrange tastings with all three next week. Which days work best for you?

**Re: Dietary Requirements Form**
YES! I'll create a custom form for your guests. It will include:
- Meal preferences
- Detailed allergy information  
- Special accommodation needs
- Kids meal preferences

I'll have this ready by tomorrow for your review.

**Late Night Snack Ideas:**
- Mini pizza station (always a hit!)
- Gourmet slider bar
- Mac & cheese bar (kid-friendly too!)

Let me know your preferred tasting dates and I'll coordinate everything!

Best,
Sarah`,
        reply_to_message_id: coupleMessageId,
        message_type: 'vendor_recommendations',
        action_items: [
          'Schedule catering tastings',
          'Create dietary requirements form',
          'Finalize late night snack options'
        ],
        vendor_contacts: [
          { name: 'Bella Vista Catering', contact: 'Maria Rossi', phone: '(555) 234-5678' },
          { name: 'Garden Fresh Catering', contact: 'Chef David', phone: '(555) 345-6789' },
          { name: 'Classic Celebrations', contact: 'Jennifer Smith', phone: '(555) 456-7890' }
        ]
      };

      const supplierResponseResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/send`, supplierResponseData);

      expect(supplierResponseResponse.status).toBe(201);
      const supplierResponseId = supplierResponseResponse.body.id;
      createdResourceIds.push(supplierResponseId);

      // Step 6: Verify response reaches couple with action items
      await new Promise(resolve => setTimeout(resolve, 1500));

      const coupleResponseInbox = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox`);

      expect(coupleResponseInbox.status).toBe(200);
      const supplierResponse = coupleResponseInbox.body.find((m: any) => m.id === supplierResponseId);
      expect(supplierResponse).toBeDefined();
      expect(supplierResponse.action_items).toHaveLength(3);
      expect(supplierResponse.vendor_contacts).toHaveLength(3);

      // Step 7: Verify conversation thread is maintained
      const conversationThread = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/thread/${coupleMessageId}`);

      expect(conversationThread.status).toBe(200);
      expect(conversationThread.body.messages).toHaveLength(2);
      expect(conversationThread.body.messages[0].id).toBe(coupleMessageId);
      expect(conversationThread.body.messages[1].id).toBe(supplierResponseId);
    });

    test('should handle couple requests for form creation and delivery', async () => {
      // Step 1: Couple requests custom form via WedMe
      const formRequestData = {
        subject: 'Request: Guest Dietary Requirements Form',
        content: `Hi Sarah,

Could you please create a form for our guests to fill out their dietary requirements? 

We need to collect:
- Food allergies and intolerances
- Vegetarian/vegan preferences  
- Religious dietary restrictions
- Special accommodation needs
- Kids meal preferences

We'd like to send this out 8 weeks before the wedding.

Thanks!
Jane & John`,
        recipient_type: 'supplier',
        wedding_id: testWeddingId,
        message_type: 'form_request',
        form_specifications: {
          title: 'Dietary Requirements & Meal Preferences',
          fields_requested: [
            'allergies_intolerances',
            'dietary_preferences',
            'religious_restrictions',
            'special_accommodations',
            'kids_meal_preferences'
          ],
          delivery_timeline: '8_weeks_before',
          target_guests: 'all_invited'
        }
      };

      const formRequestResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/send`, formRequestData);

      expect(formRequestResponse.status).toBe(201);
      const formRequestId = formRequestResponse.body.id;
      createdResourceIds.push(formRequestId);

      // Step 2: Supplier receives request in WedSync
      await new Promise(resolve => setTimeout(resolve, 1500));

      const supplierFormRequests = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/inbox?type=form_request`);

      expect(supplierFormRequests.status).toBe(200);
      const formRequest = supplierFormRequests.body.find((m: any) => m.id === formRequestId);
      expect(formRequest).toBeDefined();
      expect(formRequest.form_specifications).toBeDefined();

      // Step 3: Supplier creates form via WedSync
      const formData = {
        title: 'Dietary Requirements & Meal Preferences',
        description: 'Please help us accommodate your dining needs for John & Jane\'s wedding',
        fields: [
          {
            type: 'checkbox',
            label: 'Do you have any food allergies or intolerances?',
            name: 'has_allergies',
            required: true,
            options: ['Yes', 'No']
          },
          {
            type: 'textarea',
            label: 'Please specify your allergies and intolerances',
            name: 'allergy_details',
            required: false,
            conditional: { field: 'has_allergies', value: 'Yes' }
          },
          {
            type: 'select',
            label: 'Dietary Preference',
            name: 'dietary_preference',
            required: true,
            options: ['No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other']
          },
          {
            type: 'textarea',
            label: 'Please specify other dietary needs',
            name: 'other_dietary',
            required: false,
            conditional: { field: 'dietary_preference', value: 'Other' }
          },
          {
            type: 'checkbox',
            label: 'Religious dietary restrictions',
            name: 'religious_restrictions',
            required: false,
            options: ['Halal', 'Kosher', 'Hindu vegetarian', 'None', 'Other']
          },
          {
            type: 'checkbox',
            label: 'Will you be bringing children who need a kids meal?',
            name: 'kids_meal_needed',
            required: true,
            options: ['Yes', 'No']
          },
          {
            type: 'number',
            label: 'How many kids meals needed?',
            name: 'kids_meal_count',
            required: false,
            conditional: { field: 'kids_meal_needed', value: 'Yes' }
          }
        ],
        target_wedding_id: testWeddingId,
        auto_send_to_guests: false, // Will be approved by couple first
        response_deadline: '2024-04-15',
        created_in_response_to: formRequestId
      };

      const formCreateResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post('/forms', formData);

      expect(formCreateResponse.status).toBe(201);
      const formId = formCreateResponse.body.id;
      createdResourceIds.push(formId);

      // Step 4: Supplier notifies couple about form completion
      const formCompletionData = {
        subject: 'Dietary Requirements Form Ready for Review',
        content: `Hi Jane & John,

I've created the dietary requirements form you requested! The form includes all the fields you wanted:

✓ Food allergies and intolerances  
✓ Dietary preferences (vegetarian, vegan, etc.)
✓ Religious dietary restrictions
✓ Special accommodation needs
✓ Kids meal requirements

**Next Steps:**
1. Review the form (link below)
2. Make any edits or requests for changes
3. Approve for sending to guests
4. We'll automatically send it 8 weeks before your wedding

**Form Preview:** [Click here to review form]

The form will be sent to all your guests and responses will be automatically organized for the caterer.

Let me know if you'd like any changes!

Best,
Sarah`,
        reply_to_message_id: formRequestId,
        message_type: 'form_completion',
        form_id: formId,
        action_required: 'review_and_approve',
        form_preview_url: `https://wedme.com/forms/${formId}/preview`
      };

      const formCompletionResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/send`, formCompletionData);

      expect(formCompletionResponse.status).toBe(201);
      const formCompletionId = formCompletionResponse.body.id;
      createdResourceIds.push(formCompletionId);

      // Step 5: Couple receives notification in WedMe
      await new Promise(resolve => setTimeout(resolve, 1500));

      const coupleFormNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox?type=form_completion`);

      expect(coupleFormNotifications.status).toBe(200);
      const formNotification = coupleFormNotifications.body.find((m: any) => m.id === formCompletionId);
      expect(formNotification).toBeDefined();
      expect(formNotification.form_id).toBe(formId);
      expect(formNotification.action_required).toBe('review_and_approve');

      // Step 6: Form appears in couple's WedMe dashboard for review
      const coupleFormList = await wedMeClient
        .withAuth(coupleToken)
        .get(`/weddings/${testWeddingId}/forms?status=pending_approval`);

      expect(coupleFormList.status).toBe(200);
      const pendingForm = coupleFormList.body.find((f: any) => f.id === formId);
      expect(pendingForm).toBeDefined();
      expect(pendingForm.title).toBe('Dietary Requirements & Meal Preferences');
      expect(pendingForm.created_by_supplier).toBe(true);

      // Step 7: Couple approves form
      const formApprovalResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/weddings/${testWeddingId}/forms/${formId}/approve`, {
          approved: true,
          send_to_guests: true,
          approval_message: 'Looks perfect! Please send to all guests.'
        });

      expect(formApprovalResponse.status).toBe(200);

      // Step 8: Supplier receives approval notification
      await new Promise(resolve => setTimeout(resolve, 1500));

      const supplierApprovalNotifications = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/notifications?type=form_approved`);

      expect(supplierApprovalNotifications.status).toBe(200);
      const approvalNotification = supplierApprovalNotifications.body.find(
        (n: any) => n.data.form_id === formId
      );
      expect(approvalNotification).toBeDefined();
    });
  });

  describe('Multi-party Communication Threads', () => {
    test('should handle complex multi-party conversations with context preservation', async () => {
      // Step 1: Supplier initiates group conversation
      const groupMessageData = {
        subject: 'Final Wedding Week Coordination - All Vendors',
        content: `Hi Everyone,

We're one week out from John & Jane's big day! Time for final coordination between all vendors.

**Event Details:**
- Date: Saturday, June 15th, 2024
- Ceremony: 3:00 PM at Garden Pavilion
- Reception: 4:30 PM at Grand Ballroom
- Guest Count: 150

**Vendor Coordination Needed:**
- Setup timeline coordination
- Power/electrical requirements
- Access and delivery schedules  
- Emergency contact information
- Final headcount confirmation

Please respond with your specific needs and timeline.

Best,
Sarah (Wedding Coordinator)`,
        recipients: [
          { type: 'couple', wedding_id: testWeddingId },
          { type: 'venue', venue_id: 'venue_123' },
          { type: 'caterer', vendor_id: 'caterer_456' },
          { type: 'florist', vendor_id: 'florist_789' }
        ],
        message_type: 'vendor_coordination',
        thread_type: 'multi_party',
        priority: 'high',
        requires_all_responses: true,
        response_deadline: '2024-06-10'
      };

      const groupMessageResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/send-group`, groupMessageData);

      expect(groupMessageResponse.status).toBe(201);
      const threadId = groupMessageResponse.body.thread_id;
      const messageId = groupMessageResponse.body.message_id;
      createdResourceIds.push(messageId);

      // Step 2: Verify all parties receive message
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Couple receives in WedMe
      const coupleGroupInbox = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/threads/${threadId}`);

      expect(coupleGroupInbox.status).toBe(200);
      expect(coupleGroupInbox.body.participants).toHaveLength(5); // coordinator + 4 recipients
      expect(coupleGroupInbox.body.thread_type).toBe('multi_party');

      // Step 3: Couple responds in thread
      const coupleThreadResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/threads/${threadId}/reply`, {
          content: `Thanks Sarah!

From our side:
- Final guest count is 148 (2 last-minute cancellations)
- We'll arrive at 1:30 PM for photos
- Emergency contact: John's phone (555) 987-6543
- Special note: Grandma Rose will need wheelchair access to front row

Looking forward to working with everyone!

Jane & John`,
          message_type: 'coordination_response',
          updates: {
            final_guest_count: 148,
            arrival_time: '13:30',
            emergency_contact: '(555) 987-6543',
            accessibility_needs: 'wheelchair access for front row'
          }
        });

      expect(coupleThreadResponse.status).toBe(201);
      const coupleResponseId = coupleThreadResponse.body.id;
      createdResourceIds.push(coupleResponseId);

      // Step 4: Mock vendor responses (simulating external vendor APIs)
      const venueResponse = {
        vendor_type: 'venue',
        vendor_id: 'venue_123',
        content: `Venue coordination update:

**Setup Schedule:**
- 8:00 AM: Venue access for vendors
- 10:00 AM: Florist setup begins  
- 12:00 PM: Catering setup begins
- 2:00 PM: Final venue walkthrough

**Important Notes:**
- Loading dock access until 11:00 AM only
- Power available: 6 outlets pavilion, 12 outlets ballroom
- Wheelchair ramp installed for front row access
- Weather backup plan activated (covered areas ready)

Contact: Venue Manager Mike (555) 111-2222

Venue Team`,
        coordination_data: {
          setup_start: '08:00',
          vendor_access_cutoff: '11:00',
          power_outlets: { pavilion: 6, ballroom: 12 },
          accessibility_ready: true
        }
      };

      // Simulate venue response via webhook/API
      const venueWebhookResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/threads/${threadId}/external-reply`, venueResponse);

      expect(venueWebhookResponse.status).toBe(201);

      // Step 5: Verify thread updates reach all parties
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedThread = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/threads/${threadId}`);

      expect(updatedThread.status).toBe(200);
      expect(updatedThread.body.messages).toHaveLength(3); // Original + couple + venue
      
      const venueMessage = updatedThread.body.messages.find(
        (m: any) => m.sender_type === 'venue'
      );
      expect(venueMessage).toBeDefined();
      expect(venueMessage.coordination_data.accessibility_ready).toBe(true);

      // Step 6: Supplier sends coordination summary
      const summaryData = {
        content: `Perfect! Thank you everyone for the quick responses.

**COORDINATION SUMMARY:**

**Timeline:**
- 8:00 AM: Venue opens, vendor access begins
- 10:00 AM: Florist setup
- 11:00 AM: Loading dock closes
- 12:00 PM: Catering setup  
- 1:30 PM: Couple arrival for photos
- 2:00 PM: Final walkthrough
- 3:00 PM: CEREMONY BEGINS

**Key Updates:**
✓ Guest count: 148 (updated)
✓ Wheelchair access: Front row ready
✓ Weather backup: Covered areas prepared
✓ Emergency contact: (555) 987-6543

**Action Items:**
- All vendors confirm setup times ✓
- Power requirements mapped ✓  
- Accessibility accommodations ready ✓
- Emergency contacts collected ✓

We're all set for a beautiful wedding! Final check-in call Friday at 2 PM.

Sarah`,
        message_type: 'coordination_summary',
        action_items_completed: [
          'vendor_setup_times',
          'power_requirements',
          'accessibility_prep',
          'emergency_contacts'
        ],
        final_checkin: {
          scheduled: '2024-06-14T14:00:00Z',
          method: 'conference_call'
        }
      };

      const summaryResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/threads/${threadId}/reply`, summaryData);

      expect(summaryResponse.status).toBe(201);

      // Step 7: Verify summary reaches all parties and thread is marked complete
      await new Promise(resolve => setTimeout(resolve, 1500));

      const finalThread = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/threads/${threadId}`);

      expect(finalThread.status).toBe(200);
      expect(finalThread.body.messages).toHaveLength(4);
      expect(finalThread.body.coordination_status).toBe('completed');
      expect(finalThread.body.action_items_completed).toHaveLength(4);
    });
  });

  describe('Automated Notification Flows', () => {
    test('should trigger automated communication workflows based on wedding timeline', async () => {
      // Step 1: Set up automated communication rules
      const automationRules = {
        wedding_id: testWeddingId,
        rules: [
          {
            trigger: 'timeline_milestone',
            milestone: '8_weeks_before',
            action: 'send_dietary_form',
            recipients: ['all_guests'],
            template: 'dietary_requirements_form'
          },
          {
            trigger: 'timeline_milestone', 
            milestone: '2_weeks_before',
            action: 'send_reminder',
            recipients: ['couple', 'suppliers'],
            template: 'final_details_reminder'
          },
          {
            trigger: 'timeline_milestone',
            milestone: '1_week_before',
            action: 'coordination_check',
            recipients: ['all_vendors'],
            template: 'vendor_coordination'
          },
          {
            trigger: 'rsvp_deadline_approaching',
            days_before: 3,
            action: 'send_reminder',
            recipients: ['pending_guests'],
            template: 'rsvp_reminder'
          }
        ]
      };

      const automationResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/automation/setup`, automationRules);

      expect(automationResponse.status).toBe(201);
      const automationId = automationResponse.body.id;
      createdResourceIds.push(automationId);

      // Step 2: Simulate timeline milestone trigger (8 weeks before)
      const milestoneSimulation = await adminClient
        .withAuth(adminToken)
        .post(`/admin/simulate-timeline-milestone`, {
          wedding_id: testWeddingId,
          milestone: '8_weeks_before',
          current_date: '2024-04-20' // 8 weeks before June 15
        });

      expect(milestoneSimulation.status).toBe(200);

      // Step 3: Wait for automated workflow execution
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: Verify dietary form was automatically sent to guests
      const automatedMessages = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/sent?automated=true&milestone=8_weeks_before`);

      expect(automatedMessages.status).toBe(200);
      expect(automatedMessages.body).toHaveLength(1);
      
      const dietaryFormMessage = automatedMessages.body[0];
      expect(dietaryFormMessage.template).toBe('dietary_requirements_form');
      expect(dietaryFormMessage.recipients_count).toBeGreaterThan(0);

      // Step 5: Verify couple receives notification about automated sending
      const coupleAutomationNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/notifications?type=automated_communication`);

      expect(coupleAutomationNotifications.status).toBe(200);
      const automationNotification = coupleAutomationNotifications.body.find(
        (n: any) => n.data.milestone === '8_weeks_before'
      );
      expect(automationNotification).toBeDefined();
      expect(automationNotification.data.action).toBe('send_dietary_form');

      // Step 6: Simulate RSVP deadline approaching trigger
      const rsvpDeadlineSimulation = await adminClient
        .withAuth(adminToken)
        .post(`/admin/simulate-rsvp-deadline`, {
          wedding_id: testWeddingId,
          days_before_deadline: 3,
          pending_guests_count: 12
        });

      expect(rsvpDeadlineSimulation.status).toBe(200);

      // Step 7: Wait for RSVP reminder automation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 8: Verify RSVP reminder messages were sent
      const rsvpReminders = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/sent?automated=true&type=rsvp_reminder`);

      expect(rsvpReminders.status).toBe(200);
      expect(rsvpReminders.body.length).toBeGreaterThan(0);

      const rsvpReminderMessage = rsvpReminders.body[0];
      expect(rsvpReminderMessage.template).toBe('rsvp_reminder');
      expect(rsvpReminderMessage.trigger_type).toBe('rsvp_deadline_approaching');

      // Step 9: Verify automation activity log
      const automationLog = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/automation/${automationId}/log`);

      expect(automationLog.status).toBe(200);
      expect(automationLog.body.executions).toHaveLength(2);
      expect(automationLog.body.executions[0].milestone).toBe('8_weeks_before');
      expect(automationLog.body.executions[1].trigger_type).toBe('rsvp_deadline_approaching');
    });

    test('should handle cascading automated workflows with dependencies', async () => {
      // Step 1: Set up cascading automation workflow
      const cascadingRules = {
        wedding_id: testWeddingId,
        workflow_name: 'vendor_coordination_cascade',
        rules: [
          {
            id: 'step_1',
            trigger: 'manual_start',
            action: 'request_vendor_confirmations',
            recipients: ['all_vendors'],
            template: 'vendor_confirmation_request',
            next_step_delay: '24_hours',
            next_step: 'step_2'
          },
          {
            id: 'step_2',
            trigger: 'previous_step_completed',
            previous_step: 'step_1',
            condition: 'all_vendors_responded',
            action: 'send_coordination_summary',
            recipients: ['couple', 'all_vendors'],
            template: 'vendor_coordination_summary',
            next_step: 'step_3'
          },
          {
            id: 'step_3',
            trigger: 'previous_step_completed',
            previous_step: 'step_2',
            delay: '48_hours',
            action: 'send_final_reminders',
            recipients: ['all_vendors'],
            template: 'final_coordination_reminder'
          }
        ]
      };

      const cascadingResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/automation/workflow`, cascadingRules);

      expect(cascadingResponse.status).toBe(201);
      const workflowId = cascadingResponse.body.workflow_id;
      createdResourceIds.push(workflowId);

      // Step 2: Manually trigger workflow start
      const workflowStartResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/automation/workflow/${workflowId}/start`);

      expect(workflowStartResponse.status).toBe(200);

      // Step 3: Wait for step 1 execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Verify vendor confirmation requests were sent
      const vendorConfirmationMessages = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/sent?workflow_id=${workflowId}&step=step_1`);

      expect(vendorConfirmationMessages.status).toBe(200);
      expect(vendorConfirmationMessages.body.length).toBeGreaterThan(0);

      // Step 5: Simulate vendor responses to trigger step 2
      const vendorResponseSimulation = await adminClient
        .withAuth(adminToken)
        .post(`/admin/simulate-vendor-responses`, {
          workflow_id: workflowId,
          step: 'step_1',
          all_responded: true,
          response_time: '12_hours'
        });

      expect(vendorResponseSimulation.status).toBe(200);

      // Step 6: Wait for step 2 automatic trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 7: Verify coordination summary was sent to couple
      const coordinationSummary = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox?workflow_id=${workflowId}&step=step_2`);

      expect(coordinationSummary.status).toBe(200);
      expect(coordinationSummary.body.length).toBe(1);
      expect(coordinationSummary.body[0].template).toBe('vendor_coordination_summary');

      // Step 8: Verify workflow status tracking
      const workflowStatus = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/automation/workflow/${workflowId}/status`);

      expect(workflowStatus.status).toBe(200);
      expect(workflowStatus.body.current_step).toBe('step_2');
      expect(workflowStatus.body.completed_steps).toContain('step_1');
      expect(workflowStatus.body.next_execution).toBeDefined();
    });
  });

  describe('Emergency and Priority Communication', () => {
    test('should handle emergency communication with immediate escalation', async () => {
      // Step 1: Create emergency communication protocol
      const emergencyProtocol = {
        wedding_id: testWeddingId,
        emergency_contacts: [
          { role: 'couple_primary', contact: '+1555123456', method: 'sms' },
          { role: 'couple_secondary', contact: 'jane@test.com', method: 'email' },
          { role: 'emergency_coordinator', contact: '+1555789012', method: 'call' },
          { role: 'venue_manager', contact: '+1555345678', method: 'sms' }
        ],
        escalation_rules: {
          response_timeout: '15_minutes',
          escalation_levels: ['sms', 'call', 'multiple_contacts'],
          emergency_keywords: ['emergency', 'urgent', 'problem', 'cancel', 'accident']
        }
      };

      const protocolResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/emergency-protocol`, emergencyProtocol);

      expect(protocolResponse.status).toBe(201);
      const protocolId = protocolResponse.body.id;
      createdResourceIds.push(protocolId);

      // Step 2: Trigger emergency communication
      const emergencyMessage = {
        subject: 'EMERGENCY: Venue Flooding Issue',
        content: `EMERGENCY SITUATION:

The venue has experienced significant flooding in the main reception area due to a burst pipe. This affects the ceremony and reception spaces.

IMMEDIATE ACTION REQUIRED:
- Need to activate backup venue plan
- Guest notification needed ASAP  
- Vendor coordination for equipment relocation
- Transportation updates for guests

TIMELINE:
- Water damage assessment: 30 minutes
- Backup venue confirmation needed: 1 hour
- Guest notifications must go out: 2 hours max

This is time-sensitive. Please respond immediately.

Venue Manager Mike: (555) 111-2222
Emergency coordinator on-site.

Details:
- Incident time: 2:30 PM
- Affected areas: Main reception hall, bridal suite
- Unaffected: Garden ceremony area (backup available)
- Alternative venues contacted: Riverside Pavilion, Downtown Hotel

URGENT RESPONSE REQUIRED.`,
        priority: 'emergency',
        message_type: 'emergency_alert',
        emergency_level: 'critical',
        requires_immediate_response: true,
        notification_methods: ['sms', 'call', 'email', 'push'],
        auto_escalate: true,
        wedding_id: testWeddingId
      };

      const emergencyResponse = await wedSyncClient
        .withAuth(supplierToken)
        .post(`/communications/emergency`, emergencyMessage);

      expect(emergencyResponse.status).toBe(201);
      const emergencyMessageId = emergencyResponse.body.id;
      createdResourceIds.push(emergencyMessageId);

      // Step 3: Verify immediate multi-channel delivery
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check couple receives emergency via multiple channels
      const emergencyNotifications = await wedMeClient
        .withAuth(coupleToken)
        .get(`/notifications?type=emergency&message_id=${emergencyMessageId}`);

      expect(emergencyNotifications.status).toBe(200);
      expect(emergencyNotifications.body.length).toBeGreaterThanOrEqual(2);
      
      const channels = emergencyNotifications.body.map((n: any) => n.channel);
      expect(channels).toContain('sms');
      expect(channels).toContain('push');

      // Step 4: Verify emergency appears in WedMe with high priority
      const emergencyInbox = await wedMeClient
        .withAuth(coupleToken)
        .get(`/communications/inbox?priority=emergency`);

      expect(emergencyInbox.status).toBe(200);
      expect(emergencyInbox.body).toHaveLength(1);
      expect(emergencyInbox.body[0].id).toBe(emergencyMessageId);
      expect(emergencyInbox.body[0].emergency_level).toBe('critical');

      // Step 5: Couple responds to emergency
      const emergencyResponseData = {
        content: `Received! We're on our way to the venue.

DECISIONS:
✓ Activate Riverside Pavilion backup (already reserved)
✓ Move ceremony to covered garden area  
✓ Send guest notifications with new location
✓ Update vendor delivery addresses

ACTIONS TAKEN:
- Called Riverside Pavilion: CONFIRMED available
- Contacted transportation: updating pickup locations
- Emergency coordinator has our cell: (555) 987-6543

ETA to venue: 20 minutes

Keep us updated on damage assessment.

John & Jane`,
        reply_to_message_id: emergencyMessageId,
        message_type: 'emergency_response',
        emergency_decisions: [
          'activate_backup_venue',
          'move_ceremony_location', 
          'notify_guests',
          'update_vendor_locations'
        ],
        eta_to_venue: '20_minutes',
        backup_venue_confirmed: true
      };

      const coupleEmergencyResponse = await wedMeClient
        .withAuth(coupleToken)
        .post(`/communications/emergency/respond`, emergencyResponseData);

      expect(coupleEmergencyResponse.status).toBe(201);

      // Step 6: Verify emergency response reaches supplier immediately
      await new Promise(resolve => setTimeout(resolve, 500));

      const supplierEmergencyInbox = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/inbox?type=emergency_response`);

      expect(supplierEmergencyInbox.status).toBe(200);
      const emergencyResponseMsg = supplierEmergencyInbox.body.find(
        (m: any) => m.reply_to_message_id === emergencyMessageId
      );
      expect(emergencyResponseMsg).toBeDefined();
      expect(emergencyResponseMsg.backup_venue_confirmed).toBe(true);

      // Step 7: Verify emergency escalation was cancelled due to response
      const escalationStatus = await wedSyncClient
        .withAuth(supplierToken)
        .get(`/communications/emergency/${emergencyMessageId}/escalation-status`);

      expect(escalationStatus.status).toBe(200);
      expect(escalationStatus.body.escalation_cancelled).toBe(true);
      expect(escalationStatus.body.response_time_minutes).toBeLessThan(15);
    });
  });

  describe('Communication Audit Trail and Analytics', () => {
    test('should maintain comprehensive communication audit trail', async () => {
      // Step 1: Generate various communication activities
      const activities = [
        // Supplier message
        await wedSyncClient.withAuth(supplierToken).post('/communications/send', {
          subject: 'Audit Test Message 1',
          content: 'Test message for audit trail',
          recipient_type: 'couple',
          wedding_id: testWeddingId
        }),
        // Couple response  
        await wedMeClient.withAuth(coupleToken).post('/communications/send', {
          subject: 'Audit Test Response 1',
          content: 'Response for audit trail',
          recipient_type: 'supplier',
          wedding_id: testWeddingId
        }),
        // Form creation
        await wedSyncClient.withAuth(supplierToken).post('/forms', {
          title: 'Audit Test Form',
          description: 'Test form for audit',
          fields: [{ type: 'text', label: 'Name', required: true }],
          target_wedding_id: testWeddingId
        })
      ];

      // Collect resource IDs for cleanup
      activities.forEach(activity => {
        if (activity.status === 201) {
          createdResourceIds.push(activity.body.id);
        }
      });

      // Step 2: Wait for audit log processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Retrieve comprehensive audit trail
      const auditTrail = await adminClient
        .withAuth(adminToken)
        .get(`/admin/communications/audit-trail?wedding_id=${testWeddingId}&include_forms=true`);

      expect(auditTrail.status).toBe(200);
      expect(auditTrail.body.activities.length).toBeGreaterThanOrEqual(3);

      // Step 4: Verify audit trail structure and completeness
      const auditEntries = auditTrail.body.activities;
      
      // Check supplier message audit entry
      const supplierMessageAudit = auditEntries.find(
        (entry: any) => entry.activity_type === 'message_sent' && 
                      entry.sender_type === 'supplier'
      );
      expect(supplierMessageAudit).toBeDefined();
      expect(supplierMessageAudit.sender_id).toBeDefined();
      expect(supplierMessageAudit.recipient_id).toBeDefined();
      expect(supplierMessageAudit.timestamp).toBeDefined();
      expect(supplierMessageAudit.content_summary).toBe('Audit Test Message 1');

      // Check couple response audit entry
      const coupleResponseAudit = auditEntries.find(
        (entry: any) => entry.activity_type === 'message_sent' && 
                      entry.sender_type === 'couple'
      );
      expect(coupleResponseAudit).toBeDefined();
      expect(coupleResponseAudit.platform).toBe('wedme');

      // Check form creation audit entry
      const formCreationAudit = auditEntries.find(
        (entry: any) => entry.activity_type === 'form_created'
      );
      expect(formCreationAudit).toBeDefined();
      expect(formCreationAudit.form_title).toBe('Audit Test Form');

      // Step 5: Verify cross-platform activity correlation
      const correlationReport = await adminClient
        .withAuth(adminToken)
        .get(`/admin/communications/correlation-report?wedding_id=${testWeddingId}`);

      expect(correlationReport.status).toBe(200);
      expect(correlationReport.body.cross_platform_exchanges).toBeGreaterThan(0);
      expect(correlationReport.body.response_times).toBeDefined();
      expect(correlationReport.body.platform_usage.wedsync).toBeGreaterThan(0);
      expect(correlationReport.body.platform_usage.wedme).toBeGreaterThan(0);

      // Step 6: Verify data privacy compliance in audit
      const privacyCompliance = await adminClient
        .withAuth(adminToken)
        .get(`/admin/communications/privacy-compliance?wedding_id=${testWeddingId}`);

      expect(privacyCompliance.status).toBe(200);
      expect(privacyCompliance.body.pii_handling_compliant).toBe(true);
      expect(privacyCompliance.body.retention_policy_applied).toBe(true);
      expect(privacyCompliance.body.audit_trail_encrypted).toBe(true);
    });

    test('should provide communication analytics and insights', async () => {
      // Step 1: Retrieve communication analytics
      const analytics = await adminClient
        .withAuth(adminToken)
        .get(`/admin/communications/analytics?wedding_id=${testWeddingId}&period=30_days`);

      expect(analytics.status).toBe(200);

      // Step 2: Verify analytics structure
      const analyticsData = analytics.body;
      
      expect(analyticsData.summary).toBeDefined();
      expect(analyticsData.summary.total_messages).toBeGreaterThan(0);
      expect(analyticsData.summary.cross_platform_exchanges).toBeGreaterThan(0);
      expect(analyticsData.summary.response_rate).toBeGreaterThan(0);

      // Step 3: Verify platform-specific metrics
      expect(analyticsData.platform_breakdown).toBeDefined();
      expect(analyticsData.platform_breakdown.wedsync_messages).toBeGreaterThan(0);
      expect(analyticsData.platform_breakdown.wedme_messages).toBeGreaterThan(0);

      // Step 4: Verify communication patterns
      expect(analyticsData.patterns).toBeDefined();
      expect(analyticsData.patterns.peak_communication_hours).toBeDefined();
      expect(analyticsData.patterns.most_active_communication_types).toBeDefined();

      // Step 5: Verify response time analytics
      expect(analyticsData.response_times).toBeDefined();
      expect(analyticsData.response_times.average_supplier_response).toBeGreaterThan(0);
      expect(analyticsData.response_times.average_couple_response).toBeGreaterThan(0);

      // Step 6: Check communication effectiveness metrics
      expect(analyticsData.effectiveness).toBeDefined();
      expect(analyticsData.effectiveness.successful_coordination_rate).toBeGreaterThan(0);
      expect(analyticsData.effectiveness.issue_resolution_rate).toBeGreaterThan(0);
    });
  });
});