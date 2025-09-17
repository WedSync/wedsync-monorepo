/**
 * T049: Integration test customer journey automation in tests/integration/journey_automation.test.ts
 * 
 * This integration test validates the automated customer journey workflow
 * on the WedSync platform. It tests the end-to-end process of suppliers
 * creating automated client engagement sequences and their execution.
 * 
 * Workflow being tested:
 * 1. Supplier creates automated journey with triggers and actions
 * 2. Client interactions trigger journey enrollment
 * 3. Automated tasks, communications, and form sharing execute
 * 4. Journey adapts based on client responses and behavior
 * 5. Analytics and optimization feedback loop
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockCoupleWedding
} from '../contract/helpers/fixtures';

describe('Customer Journey Automation Integration', () => {
  let wedSyncApiClient: ApiClient;
  let wedMeApiClient: ApiClient;
  let supplierId: string;
  let weddingId: string;
  let journeyId: string;

  beforeAll(async () => {
    wedSyncApiClient = new ApiClient('https://api.wedsync.app/v1');
    wedMeApiClient = new ApiClient('https://api.wedme.app/v1');
  });

  beforeEach(async () => {
    await wedSyncApiClient.authenticate(validSupplierCredentials);
    await wedMeApiClient.authenticate(validCoupleCredentials);
    
    weddingId = mockCoupleWedding.id;
    
    // Get supplier ID for tests
    const profileResponse = await wedSyncApiClient.get('/profile');
    if (profileResponse.status === 200) {
      supplierId = profileResponse.data.id;
    }
  });

  afterEach(async () => {
    // Cleanup any active journeys
    if (journeyId) {
      await wedSyncApiClient.delete(`/journeys/${journeyId}`);
    }
  });

  describe('Journey Creation and Setup', () => {
    test('should create comprehensive automated customer journey', async () => {
      console.log('Creating automated customer journey for photography services');
      
      // Step 1: Create a comprehensive journey template
      const journeyTemplate = {
        name: 'Wedding Photography Client Journey',
        description: 'Automated engagement sequence for wedding photography clients',
        service_type: 'photography',
        triggers: [
          {
            type: 'form_submission',
            form_type: 'initial_inquiry',
            conditions: {
              budget_range: { min: 2000 },
              wedding_date: { days_from_now: { min: 60 } }
            }
          },
          {
            type: 'invitation_accepted',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Welcome & Introduction',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'welcome_new_client',
                subject: 'Welcome! Let\'s create beautiful memories together',
                personalizations: ['client_name', 'wedding_date', 'venue_name']
              },
              {
                type: 'share_form',
                form_template: 'detailed_consultation',
                message: 'Please complete this consultation form so we can understand your vision'
              },
              {
                type: 'schedule_task',
                task: {
                  title: 'Follow up with new client',
                  description: 'Check if client has any immediate questions',
                  due_hours: 24,
                  priority: 'medium'
                }
              }
            ]
          },
          {
            name: 'Consultation & Portfolio Review',
            sequence: 2,
            delay_hours: 48,
            conditions: {
              form_completed: 'detailed_consultation'
            },
            actions: [
              {
                type: 'send_email',
                template: 'portfolio_showcase',
                subject: 'Your personalized portfolio selection',
                attachments: ['portfolio_pdf', 'pricing_guide']
              },
              {
                type: 'schedule_meeting',
                meeting_type: 'consultation_call',
                duration_minutes: 45,
                available_times: ['weekday_evenings', 'weekend_mornings']
              }
            ]
          },
          {
            name: 'Proposal & Contract',
            sequence: 3,
            delay_hours: 72,
            conditions: {
              meeting_completed: 'consultation_call',
              client_interest_level: 'high'
            },
            actions: [
              {
                type: 'generate_proposal',
                template: 'photography_proposal',
                include_packages: true,
                custom_pricing: true
              },
              {
                type: 'share_contract',
                contract_template: 'photography_agreement',
                signature_required: true
              },
              {
                type: 'send_sms',
                message: 'Your personalized proposal is ready! Check your email for details.'
              }
            ]
          },
          {
            name: 'Booking Confirmation',
            sequence: 4,
            delay_hours: 0,
            conditions: {
              contract_signed: true,
              deposit_received: true
            },
            actions: [
              {
                type: 'send_email',
                template: 'booking_confirmation',
                subject: 'Congratulations! Your wedding photography is confirmed'
              },
              {
                type: 'create_timeline_entry',
                timeline_items: [
                  {
                    time: 'ceremony_start_minus_30min',
                    activity: 'Photography setup and preparation'
                  },
                  {
                    time: 'ceremony_start',
                    activity: 'Ceremony photography begins'
                  }
                ]
              },
              {
                type: 'schedule_followup_journey',
                journey_template: 'pre_wedding_preparation',
                trigger_days_before_wedding: 30
              }
            ]
          }
        ],
        conditions: {
          enrollment_criteria: {
            service_type: 'photography',
            min_budget: 2000,
            min_days_to_wedding: 60
          },
          exit_criteria: {
            contract_declined: true,
            budget_mismatch: true,
            timeline_conflict: true
          }
        },
        analytics: {
          track_engagement: true,
          track_conversion: true,
          track_response_times: true,
          optimization_enabled: true
        }
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', journeyTemplate);
      expect(journeyResponse.status).toBe(201);
      expect(journeyResponse.data).toHaveProperty('id');
      expect(journeyResponse.data).toHaveProperty('name');
      expect(journeyResponse.data).toHaveProperty('stages');
      
      journeyId = journeyResponse.data.id;
      
      // Validate journey structure
      expect(journeyResponse.data.name).toBe(journeyTemplate.name);
      expect(journeyResponse.data.stages.length).toBe(4);
      expect(journeyResponse.data.triggers.length).toBe(2);
      
      // Validate stages are properly ordered
      journeyResponse.data.stages.forEach((stage: any, index: number) => {
        expect(stage.sequence).toBe(index + 1);
        expect(stage.actions.length).toBeGreaterThan(0);
      });
      
      console.log('✅ Journey template created successfully');
    });

    test('should activate and test journey triggers', async () => {
      console.log('Testing journey trigger activation');
      
      // Create a simpler journey for trigger testing
      const triggerJourney = {
        name: 'Trigger Test Journey',
        description: 'Testing journey trigger mechanisms',
        service_type: 'photography',
        triggers: [
          {
            type: 'invitation_accepted',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Immediate Welcome',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'trigger_test_welcome',
                subject: 'Welcome! Your journey has begun'
              },
              {
                type: 'create_task',
                task: {
                  title: 'Journey triggered successfully',
                  description: 'Automated task created by journey trigger',
                  priority: 'low'
                }
              }
            ]
          }
        ]
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', triggerJourney);
      expect(journeyResponse.status).toBe(201);
      journeyId = journeyResponse.data.id;
      
      // Activate the journey
      const activationResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      expect(activationResponse.status).toBe(200);
      expect(activationResponse.data.status).toBe('active');
      
      // Simulate invitation acceptance to trigger journey
      const invitationData = {
        supplier_email: validSupplierCredentials.email,
        service_type: 'photography',
        message: 'Test invitation for journey automation'
      };
      
      const inviteResponse = await wedMeApiClient.post(`/weddings/${weddingId}/suppliers`, invitationData);
      expect(inviteResponse.status).toBe(201);
      
      const invitationId = inviteResponse.data.invitation_id;
      
      // Accept invitation (this should trigger the journey)
      const acceptResponse = await wedSyncApiClient.post(`/invitations/${invitationId}/accept`, {
        message: 'Accepted for journey testing'
      });
      expect(acceptResponse.status).toBe(200);
      
      // Wait a moment for journey processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if journey was triggered
      const enrollmentResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/enrollments`);
      expect(enrollmentResponse.status).toBe(200);
      expect(Array.isArray(enrollmentResponse.data)).toBe(true);
      
      if (enrollmentResponse.data.length > 0) {
        const enrollment = enrollmentResponse.data.find((e: any) => e.wedding_id === weddingId);
        expect(enrollment).toBeDefined();
        expect(enrollment.status).toBe('active');
        expect(enrollment.current_stage).toBe(1);
      }
      
      console.log('✅ Journey trigger tested successfully');
    });
  });

  describe('Journey Execution and Automation', () => {
    test('should execute automated journey stages progressively', async () => {
      console.log('Testing progressive journey stage execution');
      
      // Create a time-based progression journey
      const progressionJourney = {
        name: 'Progressive Engagement Journey',
        description: 'Multi-stage automated client engagement',
        service_type: 'photography',
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Stage 1: Initial Contact',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'stage1_welcome',
                subject: 'Stage 1: Welcome to our journey!'
              },
              {
                type: 'update_client_status',
                status: 'stage1_complete'
              }
            ]
          },
          {
            name: 'Stage 2: Information Gathering',
            sequence: 2,
            delay_hours: 1, // Short delay for testing
            conditions: {
              previous_stage_complete: true
            },
            actions: [
              {
                type: 'share_form',
                form_template: 'info_gathering',
                message: 'Please share more details about your vision'
              },
              {
                type: 'send_email',
                template: 'stage2_info_request',
                subject: 'Stage 2: Let\'s learn about your dream wedding'
              }
            ]
          },
          {
            name: 'Stage 3: Proposal Preparation',
            sequence: 3,
            delay_hours: 2,
            conditions: {
              form_completed: 'info_gathering'
            },
            actions: [
              {
                type: 'generate_proposal',
                template: 'custom_proposal'
              },
              {
                type: 'schedule_task',
                task: {
                  title: 'Review and send proposal',
                  priority: 'high'
                }
              }
            ]
          }
        ]
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', progressionJourney);
      expect(journeyResponse.status).toBe(201);
      journeyId = journeyResponse.data.id;
      
      // Activate journey
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Manually enroll a client
      const enrollmentData = {
        wedding_id: weddingId,
        client_email: validCoupleCredentials.email,
        enrollment_reason: 'Testing progressive execution'
      };
      
      const enrollResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, enrollmentData);
      expect(enrollResponse.status).toBe(201);
      expect(enrollResponse.data.status).toBe('enrolled');
      expect(enrollResponse.data.current_stage).toBe(1);
      
      // Check stage 1 execution
      const stage1Response = await wedSyncApiClient.get(`/journeys/${journeyId}/enrollments/${weddingId}`);
      expect(stage1Response.status).toBe(200);
      expect(stage1Response.data.current_stage).toBe(1);
      expect(stage1Response.data.stages_completed).toContain(1);
      
      // Wait for stage 2 progression (1 hour delay simulated)
      // In real testing, this would be mocked or time-accelerated
      const progressResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enrollments/${weddingId}/advance-stage`);
      expect([200, 202]).toContain(progressResponse.status);
      
      if (progressResponse.status === 200) {
        expect(progressResponse.data.current_stage).toBe(2);
        expect(progressResponse.data.stages_completed).toContain(1);
        expect(progressResponse.data.stages_completed).toContain(2);
      }
      
      console.log('✅ Progressive journey execution tested successfully');
    });

    test('should handle conditional journey branching', async () => {
      console.log('Testing conditional journey branching logic');
      
      // Create journey with branching logic
      const branchingJourney = {
        name: 'Conditional Branching Journey',
        description: 'Journey with conditional paths based on client responses',
        service_type: 'photography',
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Budget Assessment',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'share_form',
                form_template: 'budget_assessment',
                message: 'Help us understand your photography budget'
              }
            ]
          },
          {
            name: 'Premium Package Path',
            sequence: 2,
            delay_hours: 0,
            conditions: {
              form_completed: 'budget_assessment',
              form_response: {
                field: 'budget_range',
                operator: 'gte',
                value: 5000
              }
            },
            actions: [
              {
                type: 'send_email',
                template: 'premium_package_offer',
                subject: 'Exclusive Premium Photography Packages'
              },
              {
                type: 'schedule_meeting',
                meeting_type: 'premium_consultation',
                duration_minutes: 60
              }
            ]
          },
          {
            name: 'Standard Package Path',
            sequence: 2,
            delay_hours: 0,
            conditions: {
              form_completed: 'budget_assessment',
              form_response: {
                field: 'budget_range',
                operator: 'lt',
                value: 5000
              }
            },
            actions: [
              {
                type: 'send_email',
                template: 'standard_package_offer',
                subject: 'Beautiful Photography Packages Within Your Budget'
              },
              {
                type: 'share_form',
                form_template: 'standard_consultation',
                message: 'Let\'s create something amazing within your budget'
              }
            ]
          }
        ]
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', branchingJourney);
      expect(journeyResponse.status).toBe(201);
      journeyId = journeyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Test premium path
      const premiumEnrollment = {
        wedding_id: weddingId,
        client_email: validCoupleCredentials.email,
        initial_data: {
          budget_range: 7500
        }
      };
      
      const premiumEnrollResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, premiumEnrollment);
      expect(premiumEnrollResponse.status).toBe(201);
      
      // Simulate form completion with high budget
      const formCompletionData = {
        form_responses: {
          budget_range: 7500,
          premium_interest: true
        }
      };
      
      const completionResponse = await wedSyncApiClient.post(
        `/journeys/${journeyId}/enrollments/${weddingId}/complete-stage`,
        formCompletionData
      );
      expect([200, 202]).toContain(completionResponse.status);
      
      // Check that premium path was taken
      const pathResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/enrollments/${weddingId}`);
      expect(pathResponse.status).toBe(200);
      
      if (pathResponse.data.current_stage === 2) {
        expect(pathResponse.data.path_taken).toBe('premium');
      }
      
      console.log('✅ Conditional branching tested successfully');
    });

    test('should integrate with real-time communication system', async () => {
      console.log('Testing journey integration with real-time communications');
      
      // Create journey with real-time communication triggers
      const communicationJourney = {
        name: 'Real-time Communication Journey',
        description: 'Journey with real-time communication integration',
        service_type: 'photography',
        triggers: [
          {
            type: 'client_message_received',
            conditions: {
              message_keywords: ['urgent', 'question', 'help']
            }
          }
        ],
        stages: [
          {
            name: 'Immediate Response',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_auto_reply',
                message: 'Thank you for your message! We\'ll respond within 2 hours.',
                include_faq_links: true
              },
              {
                type: 'create_high_priority_task',
                task: {
                  title: 'Urgent client inquiry received',
                  description: 'Client sent message with urgent keywords',
                  priority: 'urgent',
                  due_hours: 2
                }
              },
              {
                type: 'send_internal_notification',
                recipient: 'supplier',
                message: 'Urgent client message requires immediate attention'
              }
            ]
          }
        ]
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', communicationJourney);
      expect(journeyResponse.status).toBe(201);
      journeyId = journeyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Simulate client sending urgent message
      const urgentMessage = {
        message: 'Help! I have an urgent question about our photography package',
        recipient_type: 'supplier',
        priority: 'high'
      };
      
      const messageResponse = await wedMeApiClient.post(`/weddings/${weddingId}/messages`, urgentMessage);
      expect(messageResponse.status).toBe(201);
      
      // Check if journey was triggered by message
      const triggerResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/recent-triggers`);
      expect(triggerResponse.status).toBe(200);
      
      if (triggerResponse.data.length > 0) {
        const recentTrigger = triggerResponse.data[0];
        expect(recentTrigger.trigger_type).toBe('client_message_received');
        expect(recentTrigger.wedding_id).toBe(weddingId);
      }
      
      // Verify automated response was generated
      const responseResponse = await wedMeApiClient.get(`/weddings/${weddingId}/messages`);
      expect(responseResponse.status).toBe(200);
      
      const autoReply = responseResponse.data.find((msg: any) => 
        msg.sender_type === 'system' && msg.message.includes('Thank you for your message')
      );
      expect(autoReply).toBeDefined();
      
      console.log('✅ Real-time communication integration tested successfully');
    });
  });

  describe('Journey Analytics and Optimization', () => {
    test('should track journey performance metrics', async () => {
      console.log('Testing journey analytics and performance tracking');
      
      // Create journey with analytics enabled
      const analyticsJourney = {
        name: 'Analytics Test Journey',
        description: 'Journey for testing analytics capabilities',
        service_type: 'photography',
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Email Campaign',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'analytics_test_email',
                subject: 'Test Email for Analytics',
                track_opens: true,
                track_clicks: true
              }
            ]
          },
          {
            name: 'Form Sharing',
            sequence: 2,
            delay_hours: 1,
            actions: [
              {
                type: 'share_form',
                form_template: 'analytics_test_form',
                message: 'Please complete this form',
                track_completion_time: true
              }
            ]
          }
        ],
        analytics: {
          track_engagement: true,
          track_conversion: true,
          track_response_times: true,
          track_drop_off_points: true
        }
      };
      
      const journeyResponse = await wedSyncApiClient.post('/journeys', analyticsJourney);
      expect(journeyResponse.status).toBe(201);
      journeyId = journeyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Enroll multiple test clients
      const enrollments = [
        { wedding_id: weddingId, client_email: 'test1@example.com' },
        { wedding_id: 'wedding2', client_email: 'test2@example.com' },
        { wedding_id: 'wedding3', client_email: 'test3@example.com' }
      ];
      
      for (const enrollment of enrollments) {
        const enrollResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, enrollment);
        expect([201, 409]).toContain(enrollResponse.status); // 409 for duplicate enrollments
      }
      
      // Simulate various client interactions
      await wedSyncApiClient.post(`/journeys/${journeyId}/analytics/track-event`, {
        event_type: 'email_opened',
        wedding_id: weddingId,
        timestamp: new Date().toISOString()
      });
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/analytics/track-event`, {
        event_type: 'email_clicked',
        wedding_id: weddingId,
        click_target: 'form_link',
        timestamp: new Date().toISOString()
      });
      
      // Get analytics report
      const analyticsResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/analytics`);
      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.data).toHaveProperty('enrollment_count');
      expect(analyticsResponse.data).toHaveProperty('completion_rate');
      expect(analyticsResponse.data).toHaveProperty('engagement_metrics');
      
      // Validate analytics structure
      expect(typeof analyticsResponse.data.enrollment_count).toBe('number');
      expect(typeof analyticsResponse.data.completion_rate).toBe('number');
      expect(analyticsResponse.data.completion_rate).toBeGreaterThanOrEqual(0);
      expect(analyticsResponse.data.completion_rate).toBeLessThanOrEqual(1);
      
      if (analyticsResponse.data.engagement_metrics) {
        expect(analyticsResponse.data.engagement_metrics).toHaveProperty('email_open_rate');
        expect(analyticsResponse.data.engagement_metrics).toHaveProperty('click_through_rate');
      }
      
      console.log('✅ Journey analytics tracking tested successfully');
    });

    test('should support A/B testing and optimization', async () => {
      console.log('Testing journey A/B testing capabilities');
      
      // Create A/B test variants
      const abTestJourney = {
        name: 'A/B Test Journey',
        description: 'Journey for testing A/B optimization',
        service_type: 'photography',
        ab_test: {
          enabled: true,
          test_name: 'Email Subject Line Test',
          variants: [
            {
              name: 'Variant A - Professional',
              weight: 50,
              stages: [
                {
                  name: 'Professional Email',
                  sequence: 1,
                  actions: [
                    {
                      type: 'send_email',
                      template: 'professional_style',
                      subject: 'Professional Wedding Photography Services'
                    }
                  ]
                }
              ]
            },
            {
              name: 'Variant B - Personal',
              weight: 50,
              stages: [
                {
                  name: 'Personal Email',
                  sequence: 1,
                  actions: [
                    {
                      type: 'send_email',
                      template: 'personal_style',
                      subject: 'Let\'s capture your love story together!'
                    }
                  ]
                }
              ]
            }
          ]
        },
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ]
      };
      
      const abJourneyResponse = await wedSyncApiClient.post('/journeys', abTestJourney);
      expect(abJourneyResponse.status).toBe(201);
      journeyId = abJourneyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Enroll multiple clients to test variant distribution
      const testEnrollments = Array(10).fill(null).map((_, i) => ({
        wedding_id: `ab-test-wedding-${i}`,
        client_email: `abtest${i}@example.com`
      }));
      
      const variantAssignments = [];
      for (const enrollment of testEnrollments) {
        const enrollResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, enrollment);
        if (enrollResponse.status === 201) {
          variantAssignments.push(enrollResponse.data.assigned_variant);
        }
      }
      
      // Verify variant distribution is approximately 50/50
      const variantACounts = variantAssignments.filter(v => v === 'Variant A').length;
      const variantBCounts = variantAssignments.filter(v => v === 'Variant B').length;
      
      expect(variantACounts + variantBCounts).toBe(variantAssignments.length);
      expect(Math.abs(variantACounts - variantBCounts)).toBeLessThanOrEqual(3); // Allow some variance
      
      // Get A/B test results
      const abResultsResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/ab-test-results`);
      expect(abResultsResponse.status).toBe(200);
      expect(abResultsResponse.data).toHaveProperty('variants');
      expect(abResultsResponse.data.variants).toHaveLength(2);
      
      abResultsResponse.data.variants.forEach((variant: any) => {
        expect(variant).toHaveProperty('name');
        expect(variant).toHaveProperty('enrollment_count');
        expect(variant).toHaveProperty('conversion_rate');
        expect(['Variant A - Professional', 'Variant B - Personal']).toContain(variant.name);
      });
      
      console.log('✅ A/B testing capabilities tested successfully');
    });

    test('should provide journey optimization recommendations', async () => {
      console.log('Testing journey optimization recommendations');
      
      // Create journey with optimization tracking
      const optimizationJourney = {
        name: 'Optimization Test Journey',
        description: 'Journey for testing optimization recommendations',
        service_type: 'photography',
        optimization: {
          enabled: true,
          learning_period_days: 30,
          min_sample_size: 50,
          optimization_goals: ['conversion_rate', 'engagement_rate', 'response_time']
        },
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Initial Outreach',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'initial_outreach',
                subject: 'Welcome to our photography services'
              }
            ]
          },
          {
            name: 'Follow-up',
            sequence: 2,
            delay_hours: 24,
            actions: [
              {
                type: 'send_email',
                template: 'follow_up',
                subject: 'Following up on your photography needs'
              }
            ]
          }
        ]
      };
      
      const optimizationResponse = await wedSyncApiClient.post('/journeys', optimizationJourney);
      expect(optimizationResponse.status).toBe(201);
      journeyId = optimizationResponse.data.id;
      
      // Simulate some journey data for optimization analysis
      await wedSyncApiClient.post(`/journeys/${journeyId}/optimization/simulate-data`, {
        enrollments: 100,
        conversions: 25,
        avg_response_time_hours: 18,
        stage_completion_rates: [0.85, 0.65]
      });
      
      // Get optimization recommendations
      const recommendationsResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/optimization/recommendations`);
      expect([200, 404]).toContain(recommendationsResponse.status);
      
      if (recommendationsResponse.status === 200) {
        expect(recommendationsResponse.data).toHaveProperty('recommendations');
        expect(Array.isArray(recommendationsResponse.data.recommendations)).toBe(true);
        
        recommendationsResponse.data.recommendations.forEach((recommendation: any) => {
          expect(recommendation).toHaveProperty('type');
          expect(recommendation).toHaveProperty('description');
          expect(recommendation).toHaveProperty('impact_score');
          expect(recommendation).toHaveProperty('implementation_effort');
          
          expect(typeof recommendation.impact_score).toBe('number');
          expect(recommendation.impact_score).toBeGreaterThan(0);
          expect(recommendation.impact_score).toBeLessThanOrEqual(10);
        });
      }
      
      console.log('✅ Journey optimization recommendations tested successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle journey execution failures gracefully', async () => {
      console.log('Testing journey failure handling');
      
      // Create journey with potentially failing actions
      const failureTestJourney = {
        name: 'Failure Test Journey',
        description: 'Journey for testing failure scenarios',
        service_type: 'photography',
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Failure Prone Stage',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'nonexistent_template', // This should fail
                subject: 'Test Email',
                failure_handling: 'continue'
              },
              {
                type: 'create_task',
                task: {
                  title: 'Backup task',
                  description: 'This should execute even if email fails'
                }
              }
            ]
          }
        ],
        error_handling: {
          retry_failed_actions: true,
          max_retries: 3,
          retry_delay_minutes: 5,
          continue_on_failure: true
        }
      };
      
      const failureJourneyResponse = await wedSyncApiClient.post('/journeys', failureTestJourney);
      expect(failureJourneyResponse.status).toBe(201);
      journeyId = failureJourneyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Enroll client to trigger potentially failing actions
      const enrollmentData = {
        wedding_id: weddingId,
        client_email: validCoupleCredentials.email
      };
      
      const enrollResponse = await wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, enrollmentData);
      expect(enrollResponse.status).toBe(201);
      
      // Check enrollment status and error handling
      const statusResponse = await wedSyncApiClient.get(`/journeys/${journeyId}/enrollments/${weddingId}`);
      expect(statusResponse.status).toBe(200);
      
      // Journey should continue despite failures
      expect(['active', 'completed', 'error']).toContain(statusResponse.data.status);
      
      if (statusResponse.data.errors) {
        expect(Array.isArray(statusResponse.data.errors)).toBe(true);
        statusResponse.data.errors.forEach((error: any) => {
          expect(error).toHaveProperty('action_type');
          expect(error).toHaveProperty('error_message');
          expect(error).toHaveProperty('retry_count');
        });
      }
      
      console.log('✅ Journey failure handling tested successfully');
    });

    test('should handle high-volume journey processing', async () => {
      console.log('Testing high-volume journey processing');
      
      // Create simple journey for volume testing
      const volumeJourney = {
        name: 'Volume Test Journey',
        description: 'Journey for testing high-volume processing',
        service_type: 'photography',
        triggers: [
          {
            type: 'manual_enrollment',
            conditions: {}
          }
        ],
        stages: [
          {
            name: 'Simple Email',
            sequence: 1,
            delay_hours: 0,
            actions: [
              {
                type: 'send_email',
                template: 'simple_welcome',
                subject: 'Volume Test Email'
              }
            ]
          }
        ]
      };
      
      const volumeJourneyResponse = await wedSyncApiClient.post('/journeys', volumeJourney);
      expect(volumeJourneyResponse.status).toBe(201);
      journeyId = volumeJourneyResponse.data.id;
      
      await wedSyncApiClient.post(`/journeys/${journeyId}/activate`);
      
      // Attempt to enroll many clients simultaneously
      const volumeEnrollments = Array(20).fill(null).map((_, i) => ({
        wedding_id: `volume-test-${i}`,
        client_email: `volume${i}@example.com`
      }));
      
      const enrollmentPromises = volumeEnrollments.map(enrollment =>
        wedSyncApiClient.post(`/journeys/${journeyId}/enroll`, enrollment)
      );
      
      const results = await Promise.allSettled(enrollmentPromises);
      
      // Most enrollments should succeed
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      expect(successful.length).toBeGreaterThan(15); // Allow some failures under load
      
      console.log('✅ High-volume processing tested successfully');
    });
  });
});