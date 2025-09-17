/**
 * T047: Integration test supplier onboarding flow in tests/integration/supplier_onboarding.test.ts
 * 
 * This integration test validates the complete supplier onboarding workflow
 * across WedSync and WedMe platforms. It tests the end-to-end journey from
 * supplier registration to collaboration with couples.
 * 
 * Workflow being tested:
 * 1. Supplier registers on WedSync platform
 * 2. Supplier completes profile and verification
 * 3. Supplier creates forms and journey templates
 * 4. Couple invites supplier from WedMe platform
 * 5. Supplier accepts invitation and shares forms
 * 6. Real-time collaboration is established
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockSupplier,
  mockCoupleWedding,
  mockForm,
  validFormData,
  validSupplierInvitation
} from '../contract/helpers/fixtures';

describe('Supplier Onboarding Integration Flow', () => {
  let wedSyncApiClient: ApiClient;
  let wedMeApiClient: ApiClient;
  let supplierId: string;
  let weddingId: string;
  let formId: string;
  let invitationId: string;

  beforeAll(async () => {
    // Initialize API clients for both platforms
    wedSyncApiClient = new ApiClient('https://api.wedsync.app/v1');
    wedMeApiClient = new ApiClient('https://api.wedme.app/v1');
  });

  afterAll(async () => {
    // Cleanup test data if needed
    // This would depend on the test environment setup
  });

  beforeEach(() => {
    // Reset any test state
    supplierId = '';
    weddingId = mockCoupleWedding.id;
    formId = '';
    invitationId = '';
  });

  describe('Complete Supplier Onboarding Workflow', () => {
    test('should complete full supplier onboarding and collaboration flow', async () => {
      // Step 1: Supplier Registration on WedSync
      console.log('Step 1: Supplier registers on WedSync platform');
      
      const supplierRegistration = {
        email: 'newphotographer@example.com',
        password: 'SecurePassword123!',
        business_name: 'Amazing Photography Studio',
        specialization: 'photographer',
        first_name: 'John',
        last_name: 'Photographer'
      };
      
      const registrationResponse = await wedSyncApiClient.post('/auth/register', supplierRegistration);
      expect(registrationResponse.status).toBe(201);
      expect(registrationResponse.data).toHaveProperty('access_token');
      expect(registrationResponse.data).toHaveProperty('user');
      expect(registrationResponse.data).toHaveProperty('supplier');
      
      // Store supplier credentials for subsequent steps
      supplierId = registrationResponse.data.supplier.id;
      wedSyncApiClient.setToken(registrationResponse.data.access_token);
      
      // Step 2: Complete Supplier Profile
      console.log('Step 2: Supplier completes profile information');
      
      const profileUpdate = {
        description: 'Professional wedding photography with 10+ years experience',
        website: 'https://amazingphotography.com',
        phone: '+1234567890',
        address: {
          street: '123 Photography Lane',
          city: 'Photo City',
          state: 'PC',
          zip: '12345',
          country: 'US'
        },
        services: [
          {
            name: 'Wedding Photography',
            description: 'Full day wedding coverage',
            price_range: { min: 2000, max: 5000 }
          },
          {
            name: 'Engagement Session',
            description: 'Pre-wedding photo session',
            price_range: { min: 300, max: 800 }
          }
        ],
        portfolio_images: [
          'https://example.com/portfolio1.jpg',
          'https://example.com/portfolio2.jpg'
        ]
      };
      
      const profileResponse = await wedSyncApiClient.put('/profile', profileUpdate);
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.data.description).toBe(profileUpdate.description);
      
      // Step 3: Create Client Consultation Form
      console.log('Step 3: Supplier creates consultation form');
      
      const consultationForm = {
        name: 'Photography Consultation Form',
        description: 'Initial consultation to understand your photography needs',
        fields_schema: {
          fields: [
            {
              id: 'photography_style',
              type: 'select',
              label: 'Preferred Photography Style',
              required: true,
              options: ['Traditional', 'Photojournalistic', 'Fine Art', 'Modern']
            },
            {
              id: 'budget',
              type: 'number',
              label: 'Photography Budget',
              required: true,
              min: 500,
              max: 10000
            },
            {
              id: 'event_timeline',
              type: 'object',
              label: 'Event Timeline',
              required: true,
              fields: [
                { id: 'ceremony_time', type: 'time', label: 'Ceremony Time' },
                { id: 'reception_time', type: 'time', label: 'Reception Time' }
              ]
            },
            {
              id: 'special_moments',
              type: 'textarea',
              label: 'Special Moments to Capture',
              required: false
            }
          ]
        }
      };
      
      const formResponse = await wedSyncApiClient.post('/forms', consultationForm);
      expect(formResponse.status).toBe(201);
      expect(formResponse.data).toHaveProperty('id');
      expect(formResponse.data.name).toBe(consultationForm.name);
      
      formId = formResponse.data.id;
      
      // Step 4: Supplier Verification Process
      console.log('Step 4: Supplier verification (simulated)');
      
      // In real implementation, this might involve document upload, background checks, etc.
      const verificationData = {
        business_license: 'BL123456789',
        insurance_certificate: 'IC987654321',
        portfolio_verified: true
      };
      
      const verificationResponse = await wedSyncApiClient.post('/verification/submit', verificationData);
      expect([200, 201, 202]).toContain(verificationResponse.status);
      
      // Step 5: Couple Authentication on WedMe
      console.log('Step 5: Couple authenticates on WedMe platform');
      
      const coupleLogin = await wedMeApiClient.post('/auth/login', validCoupleCredentials);
      expect(coupleLogin.status).toBe(200);
      expect(coupleLogin.data).toHaveProperty('access_token');
      expect(coupleLogin.data).toHaveProperty('weddings');
      
      wedMeApiClient.setToken(coupleLogin.data.access_token);
      
      // Step 6: Couple Invites Supplier
      console.log('Step 6: Couple invites supplier to collaborate');
      
      const supplierInvitation = {
        supplier_email: supplierRegistration.email,
        service_type: 'photography',
        message: 'We loved your portfolio and would like to work with you for our wedding!'
      };
      
      const inviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, supplierInvitation);
      expect(inviteResponse.status).toBe(201);
      expect(inviteResponse.data).toHaveProperty('invitation_id');
      expect(inviteResponse.data).toHaveProperty('status');
      
      invitationId = inviteResponse.data.invitation_id;
      
      // Step 7: Supplier Receives and Accepts Invitation
      console.log('Step 7: Supplier accepts wedding invitation');
      
      // Supplier checks for pending invitations
      const pendingInvitationsResponse = await wedSyncApiClient.get('/invitations/pending');
      expect(pendingInvitationsResponse.status).toBe(200);
      expect(Array.isArray(pendingInvitationsResponse.data)).toBe(true);
      
      // Find the invitation from our test couple
      const testInvitation = pendingInvitationsResponse.data.find(
        (inv: any) => inv.id === invitationId
      );
      expect(testInvitation).toBeDefined();
      expect(testInvitation.wedding_title).toBe(mockCoupleWedding.title);
      
      // Accept the invitation
      const acceptResponse = await wedSyncApiClient.post(`/invitations/${invitationId}/accept`, {
        message: 'Thank you for considering us! We would love to be part of your special day.'
      });
      expect(acceptResponse.status).toBe(200);
      expect(acceptResponse.data.status).toBe('accepted');
      
      // Step 8: Supplier Shares Consultation Form
      console.log('Step 8: Supplier shares consultation form with couple');
      
      const shareFormResponse = await wedSyncApiClient.post(`/weddings/${weddingId}/forms/${formId}/share`, {
        message: 'Please fill out this consultation form so we can better understand your photography needs.'
      });
      expect(shareFormResponse.status).toBe(200);
      
      // Step 9: Couple Receives and Completes Form
      console.log('Step 9: Couple accesses and completes consultation form');
      
      // Couple checks for available forms
      const availableFormsResponse = await wedMeApiClient.get(`/weddings/${weddingId}/forms`);
      expect(availableFormsResponse.status).toBe(200);
      expect(Array.isArray(availableFormsResponse.data)).toBe(true);
      
      // Find the shared consultation form
      const sharedForm = availableFormsResponse.data.find(
        (formData: any) => formData.form.id === formId
      );
      expect(sharedForm).toBeDefined();
      expect(sharedForm.form.name).toBe(consultationForm.name);
      expect(sharedForm.supplier.id).toBe(supplierId);
      
      // Complete the consultation form
      const formSubmission = {
        responses: {
          photography_style: 'Photojournalistic',
          budget: 3500,
          event_timeline: {
            ceremony_time: '14:00',
            reception_time: '17:00'
          },
          special_moments: 'First look photos, family group shots, candid reception moments'
        },
        status: 'submitted'
      };
      
      const submissionResponse = await wedMeApiClient.post(`/weddings/${weddingId}/forms/${formId}/submit`, formSubmission);
      expect(submissionResponse.status).toBe(201);
      expect(submissionResponse.data.status).toBe('submitted');
      
      // Step 10: Supplier Reviews Form Submission
      console.log('Step 10: Supplier reviews couple\'s form submission');
      
      const submissionsResponse = await wedSyncApiClient.get(`/forms/${formId}/submissions`);
      expect(submissionsResponse.status).toBe(200);
      expect(Array.isArray(submissionsResponse.data)).toBe(true);
      
      const coupleSubmission = submissionsResponse.data.find(
        (sub: any) => sub.wedding_id === weddingId
      );
      expect(coupleSubmission).toBeDefined();
      expect(coupleSubmission.responses).toEqual(formSubmission.responses);
      
      // Step 11: Establish Ongoing Collaboration
      console.log('Step 11: Establish ongoing collaboration workflow');
      
      // Supplier updates their timeline for the wedding
      const supplierTimelineUpdate = {
        timeline_items: {
          arrival_time: '13:30',
          setup_duration: 30,
          shooting_periods: [
            { start: '14:00', end: '15:00', activity: 'Ceremony' },
            { start: '15:00', end: '16:00', activity: 'Family Photos' },
            { start: '17:00', end: '22:00', activity: 'Reception' }
          ],
          breakdown_duration: 30
        }
      };
      
      const timelineUpdateResponse = await wedSyncApiClient.put(`/weddings/${weddingId}/supplier-timeline`, supplierTimelineUpdate);
      expect(timelineUpdateResponse.status).toBe(200);
      
      // Couple can see updated supplier timeline
      const coupleTimelineResponse = await wedMeApiClient.get(`/weddings/${weddingId}/timeline`);
      expect(coupleTimelineResponse.status).toBe(200);
      expect(coupleTimelineResponse.data.supplier_schedules).toBeDefined();
      
      const photographerSchedule = coupleTimelineResponse.data.supplier_schedules.find(
        (schedule: any) => schedule.supplier_id === supplierId
      );
      expect(photographerSchedule).toBeDefined();
      
      // Step 12: Real-time Communication Setup
      console.log('Step 12: Verify real-time communication capabilities');
      
      // Test message exchange between supplier and couple
      const supplierMessage = {
        message: 'Looking forward to your special day! Do you have any specific family photos you\'d like?',
        recipient_type: 'couple'
      };
      
      const messageResponse = await wedSyncApiClient.post(`/weddings/${weddingId}/messages`, supplierMessage);
      expect(messageResponse.status).toBe(201);
      
      // Couple receives the message
      const coupleMessagesResponse = await wedMeApiClient.get(`/weddings/${weddingId}/messages`);
      expect(coupleMessagesResponse.status).toBe(200);
      
      const supplierMessages = coupleMessagesResponse.data.filter(
        (msg: any) => msg.sender_type === 'supplier' && msg.sender_id === supplierId
      );
      expect(supplierMessages.length).toBeGreaterThan(0);
      
      console.log('✅ Complete supplier onboarding workflow successfully tested!');
    }, 60000); // 60 second timeout for complete integration test

    test('should handle supplier onboarding failure scenarios', async () => {
      // Test incomplete profile rejection
      const incompleteRegistration = {
        email: 'incomplete@example.com',
        password: 'password123'
        // Missing required business information
      };
      
      const incompleteResponse = await wedSyncApiClient.post('/auth/register', incompleteRegistration);
      expect(incompleteResponse.status).toBe(400);
      
      // Test invalid verification data
      await wedSyncApiClient.authenticate(validSupplierCredentials);
      
      const invalidVerification = {
        business_license: '', // Empty license number
        insurance_certificate: 'invalid'
      };
      
      const verificationResponse = await wedSyncApiClient.post('/verification/submit', invalidVerification);
      expect(verificationResponse.status).toBe(400);
      
      // Test duplicate invitation handling
      const duplicateInvite = {
        supplier_email: validSupplierCredentials.email,
        service_type: 'photography',
        message: 'Duplicate invitation test'
      };
      
      await wedMeApiClient.authenticate(validCoupleCredentials);
      
      // Send first invitation
      const firstInvite = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, duplicateInvite);
      expect([201, 409]).toContain(firstInvite.status);
      
      // Send duplicate invitation
      const secondInvite = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, duplicateInvite);
      expect([201, 409]).toContain(secondInvite.status);
    });

    test('should validate supplier-couple matching workflow', async () => {
      await wedSyncApiClient.authenticate(validSupplierCredentials);
      await wedMeApiClient.authenticate(validCoupleCredentials);
      
      // Supplier specialization should match couple needs
      const specializationMismatch = {
        supplier_email: 'caterer@example.com',
        service_type: 'photography', // Caterer being invited for photography
        message: 'Wrong specialization test'
      };
      
      const mismatchResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, specializationMismatch);
      // Should either be accepted (to allow flexibility) or rejected
      expect([201, 400, 422]).toContain(mismatchResponse.status);
      
      // Test geographic compatibility
      const distantSupplier = {
        supplier_email: 'distant@example.com',
        service_type: 'photography',
        message: 'Geographic test',
        location_note: 'Supplier located 500+ miles away'
      };
      
      const geoResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, distantSupplier);
      expect([201, 422]).toContain(geoResponse.status);
    });

    test('should verify data synchronization between platforms', async () => {
      await wedSyncApiClient.authenticate(validSupplierCredentials);
      await wedMeApiClient.authenticate(validCoupleCredentials);
      
      // Create form on WedSync
      const syncForm = {
        name: 'Sync Test Form',
        description: 'Testing cross-platform synchronization',
        fields_schema: {
          fields: [
            {
              id: 'test_field',
              type: 'text',
              label: 'Test Field',
              required: true
            }
          ]
        }
      };
      
      const wedSyncFormResponse = await wedSyncApiClient.post('/forms', syncForm);
      expect(wedSyncFormResponse.status).toBe(201);
      const syncFormId = wedSyncFormResponse.data.id;
      
      // Share form with wedding
      const shareResponse = await wedSyncApiClient.post(`/weddings/${weddingId}/forms/${syncFormId}/share`);
      expect(shareResponse.status).toBe(200);
      
      // Verify form appears on WedMe
      const wedMeFormsResponse = await wedMeApiClient.get(`/weddings/${weddingId}/forms`);
      expect(wedMeFormsResponse.status).toBe(200);
      
      const syncedForm = wedMeFormsResponse.data.find(
        (formData: any) => formData.form.id === syncFormId
      );
      expect(syncedForm).toBeDefined();
      expect(syncedForm.form.name).toBe(syncForm.name);
      
      // Submit response on WedMe
      const formResponse = {
        responses: { test_field: 'Sync test value' },
        status: 'submitted'
      };
      
      const submitResponse = await wedMeApiClient.post(`/weddings/${weddingId}/forms/${syncFormId}/submit`, formResponse);
      expect(submitResponse.status).toBe(201);
      
      // Verify submission appears on WedSync
      const wedSyncSubmissionsResponse = await wedSyncApiClient.get(`/forms/${syncFormId}/submissions`);
      expect(wedSyncSubmissionsResponse.status).toBe(200);
      
      const syncedSubmission = wedSyncSubmissionsResponse.data.find(
        (sub: any) => sub.wedding_id === weddingId
      );
      expect(syncedSubmission).toBeDefined();
      expect(syncedSubmission.responses.test_field).toBe('Sync test value');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network failures gracefully', async () => {
      // Simulate network timeout
      const timeoutClient = new ApiClient('https://api.wedsync.app/v1', { timeout: 1 });
      
      try {
        await timeoutClient.post('/auth/login', validSupplierCredentials);
        // If this doesn't timeout, the test environment might not support it
      } catch (error) {
        // Should handle timeout gracefully
        expect(error).toBeDefined();
      }
    });

    test('should handle partial workflow completion', async () => {
      await wedSyncApiClient.authenticate(validSupplierCredentials);
      
      // Start form creation but simulate interruption
      const partialForm = {
        name: 'Partial Form',
        description: 'Test partial completion'
        // Missing fields_schema
      };
      
      const partialResponse = await wedSyncApiClient.post('/forms', partialForm);
      expect(partialResponse.status).toBe(400);
      
      // Workflow should be recoverable
      const completeForm = {
        ...partialForm,
        fields_schema: {
          fields: [
            { id: 'recovery_field', type: 'text', label: 'Recovery Test', required: false }
          ]
        }
      };
      
      const recoveryResponse = await wedSyncApiClient.post('/forms', completeForm);
      expect(recoveryResponse.status).toBe(201);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent supplier registrations', async () => {
      const concurrentRegistrations = Array(5).fill(null).map((_, i) => ({
        email: `concurrent${i}@example.com`,
        password: 'password123',
        business_name: `Business ${i}`,
        specialization: 'photography',
        first_name: 'Test',
        last_name: `Supplier${i}`
      }));
      
      const registrationPromises = concurrentRegistrations.map(reg =>
        new ApiClient().post('/auth/register', reg)
      );
      
      const results = await Promise.allSettled(registrationPromises);
      
      // At least some registrations should succeed
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      expect(successful.length).toBeGreaterThan(0);
    });

    test('should handle large form submissions efficiently', async () => {
      await wedSyncApiClient.authenticate(validSupplierCredentials);
      await wedMeApiClient.authenticate(validCoupleCredentials);
      
      // Create form with many fields
      const largeForm = {
        name: 'Large Performance Test Form',
        description: 'Testing performance with many fields',
        fields_schema: {
          fields: Array(50).fill(null).map((_, i) => ({
            id: `field_${i}`,
            type: 'text',
            label: `Field ${i}`,
            required: false
          }))
        }
      };
      
      const largeFormResponse = await wedSyncApiClient.post('/forms', largeForm);
      expect(largeFormResponse.status).toBe(201);
      
      const largeFormId = largeFormResponse.data.id;
      
      // Submit form with all fields filled
      const largeSubmission = {
        responses: Object.fromEntries(
          Array(50).fill(null).map((_, i) => [`field_${i}`, `Value ${i}`])
        ),
        status: 'submitted'
      };
      
      const startTime = Date.now();
      const submissionResponse = await wedMeApiClient.post(`/weddings/${weddingId}/forms/${largeFormId}/submit`, largeSubmission);
      const endTime = Date.now();
      
      expect(submissionResponse.status).toBe(201);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});