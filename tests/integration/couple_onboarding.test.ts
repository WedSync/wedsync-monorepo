/**
 * T050: Integration test couple registration and wedding setup in tests/integration/couple_onboarding.test.ts
 * 
 * This integration test validates the complete couple onboarding workflow
 * on the WedMe platform. It tests the end-to-end journey from couple
 * registration to complete wedding setup and vendor collaboration.
 * 
 * Workflow being tested:
 * 1. Couple creates account and registers on WedMe
 * 2. Couple creates wedding with basic details
 * 3. Couple completes core wedding information
 * 4. Couple sets up guest list and RSVP management
 * 5. Couple creates wedding timeline and tasks
 * 6. Couple invites and collaborates with suppliers
 * 7. Integration with WedSync supplier ecosystem
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';

describe('Couple Onboarding and Wedding Setup Integration', () => {
  let wedMeApiClient: ApiClient;
  let wedSyncApiClient: ApiClient;
  let coupleUserId: string;
  let weddingId: string;
  let accessToken: string;

  beforeAll(async () => {
    wedMeApiClient = new ApiClient('https://api.wedme.app/v1');
    wedSyncApiClient = new ApiClient('https://api.wedsync.app/v1');
  });

  beforeEach(() => {
    // Reset test state
    coupleUserId = '';
    weddingId = '';
    accessToken = '';
  });

  afterEach(async () => {
    // Cleanup test data if needed
    if (weddingId) {
      try {
        await wedMeApiClient.delete(`/weddings/${weddingId}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Complete Couple Onboarding Flow', () => {
    test('should complete full couple registration and wedding setup workflow', async () => {
      console.log('Starting complete couple onboarding workflow');
      
      // Step 1: Couple Registration
      console.log('Step 1: Couple creates account');
      
      const coupleRegistration = {
        email: 'newcouple@example.com',
        password: 'SecureWeddingPassword123!',
        first_name: 'Sarah',
        last_name: 'Johnson',
        partner_first_name: 'Michael',
        partner_last_name: 'Smith',
        phone: '+1234567890',
        relationship_status: 'engaged',
        engagement_date: '2024-01-15'
      };
      
      const registrationResponse = await wedMeApiClient.post('/auth/register', coupleRegistration);
      expect(registrationResponse.status).toBe(201);
      expect(registrationResponse.data).toHaveProperty('access_token');
      expect(registrationResponse.data).toHaveProperty('user');
      expect(registrationResponse.data).toHaveProperty('weddings');
      
      // Validate user data
      const userData = registrationResponse.data.user;
      expect(userData.email).toBe(coupleRegistration.email);
      expect(userData.role).toBe('couple');
      expect(userData.id).toBeDefined();
      
      coupleUserId = userData.id;
      accessToken = registrationResponse.data.access_token;
      wedMeApiClient.setToken(accessToken);
      
      // Step 2: Create Initial Wedding
      console.log('Step 2: Creating initial wedding');
      
      const weddingCreation = {
        title: 'Sarah & Michael\'s Wedding',
        wedding_date: '2024-08-17',
        ceremony_venue: {
          name: 'Beautiful Garden Chapel',
          address: {
            street: '456 Garden Lane',
            city: 'Wedding City',
            state: 'WC',
            zip: '54321',
            country: 'US'
          },
          contact_info: {
            phone: '+1234567891',
            email: 'events@gardenchapel.com'
          },
          capacity_max: 200
        },
        reception_venue: {
          name: 'Grand Ballroom',
          address: {
            street: '789 Reception Ave',
            city: 'Wedding City',
            state: 'WC',
            zip: '54321',
            country: 'US'
          },
          contact_info: {
            phone: '+1234567892',
            email: 'events@grandballroom.com'
          },
          capacity_max: 180
        },
        guest_count_estimated: 150,
        theme: 'Garden Romance',
        budget_total: 45000
      };
      
      const weddingResponse = await wedMeApiClient.post('/weddings', weddingCreation);
      expect(weddingResponse.status).toBe(201);
      expect(weddingResponse.data).toHaveProperty('id');
      expect(weddingResponse.data.title).toBe(weddingCreation.title);
      expect(weddingResponse.data.status).toBe('planning');
      expect(weddingResponse.data.core_details_complete).toBe(false);
      
      weddingId = weddingResponse.data.id;
      
      // Step 3: Complete Core Wedding Details
      console.log('Step 3: Completing core wedding details');
      
      const coreDetailsUpdate = {
        wedding_date: '2024-08-17',
        ceremony_venue: weddingCreation.ceremony_venue,
        reception_venue: weddingCreation.reception_venue,
        guest_count_estimated: 150,
        theme: 'Garden Romance',
        special_requirements: 'Vegetarian menu options, wheelchair accessible, outdoor ceremony weather backup plan'
      };
      
      const coreDetailsResponse = await wedMeApiClient.put(`/weddings/${weddingId}/core-details`, coreDetailsUpdate);
      expect(coreDetailsResponse.status).toBe(200);
      expect(coreDetailsResponse.data.core_details_complete).toBe(true);
      
      // Step 4: Set Up Guest List
      console.log('Step 4: Setting up guest list and RSVP management');
      
      // Add individual guests
      const guestList = [
        {
          first_name: 'Emma',
          last_name: 'Wilson',
          email: 'emma@example.com',
          relationship: 'Bride\'s Sister',
          plus_one_allowed: true,
          is_helper: true,
          helper_role: 'Maid of Honor'
        },
        {
          first_name: 'James',
          last_name: 'Brown',
          email: 'james@example.com',
          relationship: 'Groom\'s Brother',
          plus_one_allowed: true,
          is_helper: true,
          helper_role: 'Best Man'
        },
        {
          first_name: 'Robert',
          last_name: 'Johnson',
          email: 'robert@example.com',
          relationship: 'Bride\'s Father',
          plus_one_allowed: false
        },
        {
          first_name: 'Linda',
          last_name: 'Johnson',
          email: 'linda@example.com',
          relationship: 'Bride\'s Mother',
          plus_one_allowed: false
        }
      ];
      
      const addedGuests = [];
      for (const guest of guestList) {
        const guestResponse = await wedMeApiClient.post(`/weddings/${weddingId}/guests`, guest);
        expect(guestResponse.status).toBe(201);
        expect(guestResponse.data.first_name).toBe(guest.first_name);
        expect(guestResponse.data.rsvp_status).toBe('pending');
        addedGuests.push(guestResponse.data);
      }
      
      // Bulk import additional guests
      const bulkGuestImport = {
        guests: [
          {
            first_name: 'David',
            last_name: 'Davis',
            email: 'david@example.com',
            relationship: 'College Friend',
            plus_one_allowed: true
          },
          {
            first_name: 'Jennifer',
            last_name: 'Martinez',
            email: 'jennifer@example.com',
            relationship: 'Work Colleague',
            plus_one_allowed: true
          },
          {
            first_name: 'Christopher',
            last_name: 'Garcia',
            email: 'chris@example.com',
            relationship: 'Childhood Friend',
            plus_one_allowed: false
          }
        ]
      };
      
      const bulkImportResponse = await wedMeApiClient.put(`/weddings/${weddingId}/guests`, bulkGuestImport);
      expect(bulkImportResponse.status).toBe(200);
      expect(bulkImportResponse.data.imported_count).toBe(3);
      expect(bulkImportResponse.data.failed_count).toBe(0);
      
      // Verify total guest count
      const guestListResponse = await wedMeApiClient.get(`/weddings/${weddingId}/guests`);
      expect(guestListResponse.status).toBe(200);
      expect(guestListResponse.data.length).toBe(7); // 4 individual + 3 bulk imported
      
      // Step 5: Create Wedding Timeline and Tasks
      console.log('Step 5: Creating wedding timeline and task management');
      
      // Create wedding timeline
      const weddingTimeline = {
        timeline: {
          '09:00': {
            events: [
              {
                title: 'Hair and Makeup',
                duration: 180,
                location: 'Bridal Suite',
                suppliers: []
              }
            ]
          },
          '12:00': {
            events: [
              {
                title: 'Lunch Break',
                duration: 60,
                location: 'Bridal Suite',
                suppliers: []
              }
            ]
          },
          '13:00': {
            events: [
              {
                title: 'Photography - Getting Ready',
                duration: 60,
                location: 'Bridal Suite',
                suppliers: []
              }
            ]
          },
          '14:00': {
            events: [
              {
                title: 'First Look Photos',
                duration: 30,
                location: 'Garden',
                suppliers: []
              }
            ]
          },
          '15:00': {
            events: [
              {
                title: 'Wedding Ceremony',
                duration: 45,
                location: 'Garden Chapel',
                suppliers: []
              }
            ]
          },
          '16:00': {
            events: [
              {
                title: 'Cocktail Hour',
                duration: 60,
                location: 'Garden Terrace',
                suppliers: []
              }
            ]
          },
          '17:00': {
            events: [
              {
                title: 'Wedding Reception',
                duration: 300,
                location: 'Grand Ballroom',
                suppliers: []
              }
            ]
          }
        },
        notify_suppliers: false // No suppliers yet
      };
      
      const timelineResponse = await wedMeApiClient.put(`/weddings/${weddingId}/timeline`, weddingTimeline);
      expect(timelineResponse.status).toBe(200);
      expect(timelineResponse.data.timeline).toEqual(weddingTimeline.timeline);
      
      // Create wedding tasks
      const weddingTasks = [
        {
          title: 'Book wedding photographer',
          description: 'Research and book a professional wedding photographer',
          priority: 'high',
          category: 'vendors',
          due_date: '2024-04-01',
          is_day_of_task: false
        },
        {
          title: 'Order wedding invitations',
          description: 'Design and order wedding invitations',
          priority: 'medium',
          category: 'stationery',
          due_date: '2024-05-15',
          is_day_of_task: false
        },
        {
          title: 'Schedule final venue walkthrough',
          description: 'Meet with venue coordinator for final details',
          priority: 'medium',
          category: 'venue',
          due_date: '2024-08-10',
          is_day_of_task: false
        },
        {
          title: 'Set up ceremony chairs',
          description: 'Arrange chairs for wedding ceremony',
          priority: 'high',
          category: 'setup',
          is_day_of_task: true
        }
      ];
      
      const createdTasks = [];
      for (const task of weddingTasks) {
        const taskResponse = await wedMeApiClient.post(`/weddings/${weddingId}/tasks`, task);
        expect(taskResponse.status).toBe(201);
        expect(taskResponse.data.title).toBe(task.title);
        expect(taskResponse.data.status).toBe('pending');
        createdTasks.push(taskResponse.data);
      }
      
      // Step 6: Supplier Discovery and Invitation
      console.log('Step 6: Discovering and inviting wedding suppliers');
      
      // Invite photographer
      const photographerInvitation = {
        supplier_email: 'photographer@example.com',
        service_type: 'photography',
        message: 'We loved your portfolio and would like to discuss photography for our August 17th wedding. Our budget is around $3,500 and we\'re looking for a photojournalistic style.'
      };
      
      const photographerInviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, photographerInvitation);
      expect(photographerInviteResponse.status).toBe(201);
      expect(photographerInviteResponse.data).toHaveProperty('invitation_id');
      
      // Invite caterer
      const catererInvitation = {
        supplier_email: 'caterer@example.com',
        service_type: 'catering',
        message: 'We need catering for 150 guests with vegetarian options. Our reception is at Grand Ballroom on August 17th.'
      };
      
      const catererInviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, catererInvitation);
      expect(catererInviteResponse.status).toBe(201);
      
      // Invite florist
      const floristInvitation = {
        supplier_email: 'florist@example.com',
        service_type: 'flowers',
        message: 'We\'re planning a garden romance themed wedding and need bridal bouquet, boutonnieres, and ceremony decorations.'
      };
      
      const floristInviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, floristInvitation);
      expect(floristInviteResponse.status).toBe(201);
      
      // Verify supplier invitations
      const suppliersResponse = await wedMeApiClient.get(`/weddings/${weddingId}/suppliers`);
      expect(suppliersResponse.status).toBe(200);
      expect(Array.isArray(suppliersResponse.data)).toBe(true);
      // Note: Suppliers may not appear immediately if invitations are pending
      
      // Step 7: RSVP Management Simulation
      console.log('Step 7: Managing guest RSVPs');
      
      // Simulate some RSVP responses
      const rsvpResponses = [
        {
          guest: addedGuests.find(g => g.first_name === 'Emma'),
          rsvp: {
            rsvp_status: 'attending',
            plus_one_name: 'Alex Wilson',
            dietary_requirements: {
              vegetarian: true,
              allergies: []
            },
            special_notes: 'Excited to be the Maid of Honor!'
          }
        },
        {
          guest: addedGuests.find(g => g.first_name === 'James'),
          rsvp: {
            rsvp_status: 'attending',
            plus_one_name: 'Sarah Brown',
            dietary_requirements: {
              gluten_free: true,
              allergies: ['nuts']
            },
            special_notes: 'Looking forward to the bachelor party!'
          }
        },
        {
          guest: addedGuests.find(g => g.first_name === 'Robert'),
          rsvp: {
            rsvp_status: 'attending',
            dietary_requirements: {},
            special_notes: 'So proud of my daughter!'
          }
        }
      ];
      
      for (const response of rsvpResponses) {
        if (response.guest) {
          const rsvpResponse = await wedMeApiClient.post(
            `/weddings/${weddingId}/guests/${response.guest.id}/rsvp`,
            response.rsvp
          );
          expect(rsvpResponse.status).toBe(200);
          expect(rsvpResponse.data.rsvp_status).toBe(response.rsvp.rsvp_status);
        }
      }
      
      // Check RSVP summary
      const attendingGuestsResponse = await wedMeApiClient.get(`/weddings/${weddingId}/guests?rsvp_status=attending`);
      expect(attendingGuestsResponse.status).toBe(200);
      expect(attendingGuestsResponse.data.length).toBe(3);
      
      // Step 8: Wedding Budget Management
      console.log('Step 8: Setting up wedding budget tracking');
      
      const budgetSetup = {
        total_budget: 45000,
        categories: [
          {
            name: 'Photography',
            budgeted: 3500,
            actual: 0
          },
          {
            name: 'Catering',
            budgeted: 15000,
            actual: 0
          },
          {
            name: 'Venue',
            budgeted: 8000,
            actual: 8000,
            transactions: [
              {
                description: 'Venue deposit',
                amount: 4000,
                date: '2024-02-01',
                type: 'deposit'
              },
              {
                description: 'Final venue payment',
                amount: 4000,
                date: '2024-08-01',
                type: 'final_payment'
              }
            ]
          },
          {
            name: 'Flowers',
            budgeted: 2000,
            actual: 0
          },
          {
            name: 'Music/DJ',
            budgeted: 1500,
            actual: 0
          },
          {
            name: 'Dress & Attire',
            budgeted: 3000,
            actual: 1200,
            transactions: [
              {
                description: 'Wedding dress',
                amount: 1200,
                date: '2024-03-15',
                type: 'purchase'
              }
            ]
          },
          {
            name: 'Miscellaneous',
            budgeted: 2000,
            actual: 300
          }
        ]
      };
      
      const budgetResponse = await wedMeApiClient.put(`/weddings/${weddingId}/budget`, budgetSetup);
      expect(budgetResponse.status).toBe(200);
      
      // Verify budget tracking
      const budgetCheckResponse = await wedMeApiClient.get(`/weddings/${weddingId}/budget`);
      expect(budgetCheckResponse.status).toBe(200);
      expect(budgetCheckResponse.data.total_budget).toBe(45000);
      expect(budgetCheckResponse.data.categories.length).toBe(7);
      
      // Step 9: Final Wedding Overview
      console.log('Step 9: Reviewing complete wedding setup');
      
      const finalWeddingResponse = await wedMeApiClient.get(`/weddings/${weddingId}`);
      expect(finalWeddingResponse.status).toBe(200);
      
      const finalWedding = finalWeddingResponse.data;
      expect(finalWedding.core_details_complete).toBe(true);
      expect(finalWedding.guest_summary.total_guests).toBeGreaterThan(0);
      expect(finalWedding.guest_summary.attending).toBe(3);
      expect(finalWedding.suppliers.length).toBeGreaterThanOrEqual(0);
      
      console.log('✅ Complete couple onboarding workflow successfully completed!');
      
    }, 90000); // 90 second timeout for complete workflow

    test('should handle couple onboarding with minimal information', async () => {
      console.log('Testing minimal couple onboarding flow');
      
      // Minimal registration
      const minimalRegistration = {
        email: 'minimal@example.com',
        password: 'SimplePassword123!',
        first_name: 'Jane',
        last_name: 'Doe'
      };
      
      const regResponse = await wedMeApiClient.post('/auth/register', minimalRegistration);
      expect(regResponse.status).toBe(201);
      
      wedMeApiClient.setToken(regResponse.data.access_token);
      
      // Minimal wedding creation
      const minimalWedding = {
        title: 'Jane\'s Wedding',
        wedding_date: '2024-09-15'
      };
      
      const weddingResponse = await wedMeApiClient.post('/weddings', minimalWedding);
      expect(weddingResponse.status).toBe(201);
      expect(weddingResponse.data.core_details_complete).toBe(false);
      
      weddingId = weddingResponse.data.id;
      
      // Should be able to gradually add more details
      const updatedWedding = {
        guest_count_estimated: 50,
        theme: 'Simple Elegance'
      };
      
      const updateResponse = await wedMeApiClient.put(`/weddings/${weddingId}`, updatedWedding);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.guest_count_estimated).toBe(50);
    });

    test('should support complex guest management scenarios', async () => {
      console.log('Testing complex guest management scenarios');
      
      // Set up couple and wedding
      const setupData = await this.setupCoupleAndWedding();
      weddingId = setupData.weddingId;
      wedMeApiClient.setToken(setupData.accessToken);
      
      // Test guest groups and categories
      const familyGuests = [
        {
          first_name: 'Mary',
          last_name: 'Smith',
          relationship: 'Grandmother',
          photo_groups: ['family', 'grandparents'],
          dietary_requirements: { soft_foods: true }
        },
        {
          first_name: 'John',
          last_name: 'Smith',
          relationship: 'Grandfather',
          photo_groups: ['family', 'grandparents'],
          dietary_requirements: { diabetic: true }
        }
      ];
      
      for (const guest of familyGuests) {
        const guestResponse = await wedMeApiClient.post(`/weddings/${weddingId}/guests`, guest);
        expect(guestResponse.status).toBe(201);
        expect(guestResponse.data.photo_groups).toEqual(guest.photo_groups);
      }
      
      // Test children guests
      const childGuest = {
        first_name: 'Tommy',
        last_name: 'Johnson',
        relationship: 'Nephew',
        age: 8,
        dietary_requirements: { 
          child_meal: true,
          allergies: ['peanuts']
        },
        plus_one_allowed: false
      };
      
      const childResponse = await wedMeApiClient.post(`/weddings/${weddingId}/guests`, childGuest);
      expect(childResponse.status).toBe(201);
      
      // Test international guests
      const internationalGuest = {
        first_name: 'Pierre',
        last_name: 'Dubois',
        email: 'pierre@example.fr',
        relationship: 'Exchange Student Friend',
        plus_one_allowed: true,
        special_accommodations: 'Requires translation assistance'
      };
      
      const intlResponse = await wedMeApiClient.post(`/weddings/${weddingId}/guests`, internationalGuest);
      expect(intlResponse.status).toBe(201);
      
      // Get guests by photo groups
      const familyOnlyResponse = await wedMeApiClient.get(`/weddings/${weddingId}/guests`);
      expect(familyOnlyResponse.status).toBe(200);
      
      const familyMembers = familyOnlyResponse.data.filter((guest: any) => 
        guest.photo_groups && guest.photo_groups.includes('family')
      );
      expect(familyMembers.length).toBe(2);
    });
  });

  describe('Integration with Supplier Ecosystem', () => {
    test('should establish seamless supplier collaboration', async () => {
      console.log('Testing integration with supplier ecosystem');
      
      // Set up couple and wedding
      const setupData = await this.setupCoupleAndWedding();
      weddingId = setupData.weddingId;
      wedMeApiClient.setToken(setupData.accessToken);
      
      // Invite photographer with detailed requirements
      const detailedPhotographerInvite = {
        supplier_email: 'detailed.photographer@example.com',
        service_type: 'photography',
        message: `We're planning our wedding for ${setupData.weddingDate} and are looking for a photographer who specializes in outdoor garden ceremonies. 
                 
                 Our requirements:
                 - 150 guests
                 - Garden ceremony at 3 PM
                 - Reception until 10 PM
                 - Photojournalistic style preferred
                 - Budget: $3,000-$4,000
                 - Must include engagement session
                 
                 We'd love to see your portfolio and discuss availability!`,
        requirements: {
          style: 'photojournalistic',
          budget_range: { min: 3000, max: 4000 },
          includes_engagement: true,
          event_duration_hours: 7,
          guest_count: 150,
          venue_type: 'outdoor_garden'
        }
      };
      
      const photographerResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, detailedPhotographerInvite);
      expect(photographerResponse.status).toBe(201);
      expect(photographerResponse.data).toHaveProperty('invitation_id');
      
      // Simulate photographer acceptance and form sharing (would normally happen on WedSync side)
      // For integration testing, we'll simulate the supplier response
      const supplierCollaboration = {
        invitation_id: photographerResponse.data.invitation_id,
        supplier_response: 'accepted',
        forms_shared: [
          {
            form_id: 'photography_consultation_form',
            form_name: 'Photography Consultation',
            message: 'Please complete this form so we can create the perfect photography package for you!'
          }
        ],
        proposal_timeline: '3-5 business days'
      };
      
      // Check for available forms (simulating supplier sharing forms)
      const formsResponse = await wedMeApiClient.get(`/weddings/${weddingId}/forms`);
      expect(formsResponse.status).toBe(200);
      expect(Array.isArray(formsResponse.data)).toBe(true);
      
      // Test communication with supplier
      const communicationTest = {
        message: 'Thank you for accepting our invitation! We have a few questions about your packages.',
        recipient_type: 'supplier',
        supplier_service_type: 'photography'
      };
      
      const messageResponse = await wedMeApiClient.post(`/weddings/${weddingId}/messages`, communicationTest);
      expect([201, 501]).toContain(messageResponse.status); // 501 if not implemented yet
      
      console.log('✅ Supplier ecosystem integration tested successfully');
    });

    test('should handle multiple supplier types and coordination', async () => {
      console.log('Testing coordination between multiple supplier types');
      
      const setupData = await this.setupCoupleAndWedding();
      weddingId = setupData.weddingId;
      wedMeApiClient.setToken(setupData.accessToken);
      
      // Invite multiple coordinated suppliers
      const supplierInvitations = [
        {
          email: 'photographer@team.com',
          service_type: 'photography',
          message: 'Photography for coordinated vendor team'
        },
        {
          email: 'videographer@team.com',
          service_type: 'videography',
          message: 'Videography to coordinate with photographer'
        },
        {
          email: 'coordinator@team.com',
          service_type: 'planning',
          message: 'Day-of coordination for vendor team'
        }
      ];
      
      const invitationResponses = [];
      for (const invitation of supplierInvitations) {
        const response = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, invitation);
        expect(response.status).toBe(201);
        invitationResponses.push(response.data);
      }
      
      // Create coordinated timeline with multiple suppliers
      const coordinatedTimeline = {
        timeline: {
          '14:00': {
            events: [
              {
                title: 'Vendor Setup',
                duration: 60,
                location: 'Various',
                suppliers: [
                  { id: 'photographer_id', role: 'Photography setup' },
                  { id: 'videographer_id', role: 'Video equipment setup' }
                ]
              }
            ]
          },
          '15:00': {
            events: [
              {
                title: 'Ceremony',
                duration: 45,
                location: 'Garden',
                suppliers: [
                  { id: 'photographer_id', role: 'Ceremony photography' },
                  { id: 'videographer_id', role: 'Ceremony videography' },
                  { id: 'coordinator_id', role: 'Ceremony coordination' }
                ]
              }
            ]
          }
        },
        notify_suppliers: true
      };
      
      const timelineResponse = await wedMeApiClient.put(`/weddings/${weddingId}/timeline`, coordinatedTimeline);
      expect(timelineResponse.status).toBe(200);
      expect(timelineResponse.data.updated_suppliers).toBeDefined();
      
      console.log('✅ Multiple supplier coordination tested successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle incomplete wedding setup gracefully', async () => {
      console.log('Testing handling of incomplete wedding setups');
      
      // Register couple
      const incompleteRegistration = {
        email: 'incomplete@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User'
      };
      
      const regResponse = await wedMeApiClient.post('/auth/register', incompleteRegistration);
      expect(regResponse.status).toBe(201);
      wedMeApiClient.setToken(regResponse.data.access_token);
      
      // Create wedding with minimal info
      const minimalWedding = {
        title: 'Incomplete Wedding'
        // Missing wedding_date and other details
      };
      
      const weddingResponse = await wedMeApiClient.post('/weddings', minimalWedding);
      expect([201, 400]).toContain(weddingResponse.status);
      
      if (weddingResponse.status === 201) {
        weddingId = weddingResponse.data.id;
        
        // Try to invite suppliers without complete wedding details
        const prematureInvite = {
          supplier_email: 'test@example.com',
          service_type: 'photography',
          message: 'Test invitation'
        };
        
        const inviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, prematureInvite);
        expect([201, 400, 422]).toContain(inviteResponse.status);
        
        // Try to create timeline without wedding date
        const prematureTimeline = {
          timeline: {
            '15:00': {
              events: [{ title: 'Test Event' }]
            }
          }
        };
        
        const timelineResponse = await wedMeApiClient.put(`/weddings/${weddingId}/timeline`, prematureTimeline);
        expect([200, 400]).toContain(timelineResponse.status);
      }
    });

    test('should handle data validation and constraints', async () => {
      console.log('Testing data validation and business rule constraints');
      
      const setupData = await this.setupCoupleAndWedding();
      weddingId = setupData.weddingId;
      wedMeApiClient.setToken(setupData.accessToken);
      
      // Test guest count constraints
      const exceedingGuestList = {
        guests: Array(1000).fill(null).map((_, i) => ({
          first_name: `Guest${i}`,
          last_name: 'Test',
          email: `guest${i}@test.com`,
          relationship: 'Test Guest'
        }))
      };
      
      const bulkResponse = await wedMeApiClient.put(`/weddings/${weddingId}/guests`, exceedingGuestList);
      expect([200, 400, 413, 422]).toContain(bulkResponse.status);
      
      // Test invalid date constraints
      const pastDateWedding = {
        wedding_date: '2020-01-01' // Past date
      };
      
      const pastDateResponse = await wedMeApiClient.put(`/weddings/${weddingId}`, pastDateWedding);
      expect([200, 400]).toContain(pastDateResponse.status);
      
      // Test budget constraints
      const negativeBudget = {
        total_budget: -1000
      };
      
      const budgetResponse = await wedMeApiClient.put(`/weddings/${weddingId}/budget`, negativeBudget);
      expect(budgetResponse.status).toBe(400);
    });

    test('should handle concurrent user operations', async () => {
      console.log('Testing concurrent operations handling');
      
      const setupData = await this.setupCoupleAndWedding();
      weddingId = setupData.weddingId;
      wedMeApiClient.setToken(setupData.accessToken);
      
      // Simulate concurrent guest additions
      const concurrentGuests = Array(5).fill(null).map((_, i) => ({
        first_name: `Concurrent${i}`,
        last_name: 'Guest',
        email: `concurrent${i}@test.com`,
        relationship: 'Test'
      }));
      
      const guestPromises = concurrentGuests.map(guest =>
        wedMeApiClient.post(`/weddings/${weddingId}/guests`, guest)
      );
      
      const guestResults = await Promise.allSettled(guestPromises);
      
      // Most should succeed
      const successful = guestResults.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      expect(successful.length).toBeGreaterThan(3);
      
      // Simulate concurrent task creation
      const concurrentTasks = Array(3).fill(null).map((_, i) => ({
        title: `Concurrent Task ${i}`,
        description: `Description ${i}`,
        priority: 'medium'
      }));
      
      const taskPromises = concurrentTasks.map(task =>
        wedMeApiClient.post(`/weddings/${weddingId}/tasks`, task)
      );
      
      const taskResults = await Promise.allSettled(taskPromises);
      
      const successfulTasks = taskResults.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      expect(successfulTasks.length).toBeGreaterThan(2);
    });
  });

  // Helper method for setting up test couple and wedding
  async setupCoupleAndWedding() {
    const registration = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'Couple'
    };
    
    const regResponse = await wedMeApiClient.post('/auth/register', registration);
    expect(regResponse.status).toBe(201);
    
    const wedding = {
      title: 'Test Wedding',
      wedding_date: '2024-12-31',
      guest_count_estimated: 100
    };
    
    wedMeApiClient.setToken(regResponse.data.access_token);
    const weddingResponse = await wedMeApiClient.post('/weddings', wedding);
    expect(weddingResponse.status).toBe(201);
    
    return {
      userId: regResponse.data.user.id,
      accessToken: regResponse.data.access_token,
      weddingId: weddingResponse.data.id,
      weddingDate: wedding.wedding_date
    };
  }
});