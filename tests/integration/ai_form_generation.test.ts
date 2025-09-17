/**
 * T048: Integration test AI form generation in tests/integration/ai_form_generation.test.ts
 * 
 * This integration test validates the AI-powered form generation workflow
 * on the WedSync platform. It tests the end-to-end process of suppliers
 * using AI to create customized consultation forms.
 * 
 * Workflow being tested:
 * 1. Supplier requests AI form generation with business context
 * 2. AI analyzes supplier specialization and generates relevant fields
 * 3. Supplier reviews and customizes AI-generated form
 * 4. Form is saved and ready for client collaboration
 * 5. Generated form integrates with existing workflow
 */

import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { validSupplierCredentials } from '../contract/helpers/fixtures';

describe('AI Form Generation Integration', () => {
  let apiClient: ApiClient;
  let supplierId: string;

  beforeAll(async () => {
    apiClient = new ApiClient('https://api.wedsync.app/v1');
  });

  beforeEach(async () => {
    await apiClient.authenticate(validSupplierCredentials);
    
    // Get supplier profile for tests
    const profileResponse = await apiClient.get('/profile');
    if (profileResponse.status === 200) {
      supplierId = profileResponse.data.id;
    }
  });

  describe('AI Form Generation Workflow', () => {
    test('should generate photography consultation form with AI', async () => {
      console.log('Testing AI form generation for photography services');
      
      // Step 1: Request AI form generation
      const aiFormRequest = {
        service_type: 'photography',
        business_context: {
          specialization: 'wedding_photography',
          experience_years: 8,
          style_preferences: ['photojournalistic', 'fine_art'],
          typical_package_size: 'full_day',
          special_offerings: ['engagement_sessions', 'album_design', 'online_gallery']
        },
        client_focus: {
          target_couples: 'luxury_weddings',
          average_guest_count: 150,
          common_venues: ['hotels', 'outdoor', 'historic_venues']
        },
        form_preferences: {
          length: 'comprehensive',
          include_pricing: true,
          include_timeline: true,
          include_preferences: true
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', aiFormRequest);
      expect(generationResponse.status).toBe(201);
      expect(generationResponse.data).toHaveProperty('form_id');
      expect(generationResponse.data).toHaveProperty('generated_fields');
      expect(generationResponse.data).toHaveProperty('ai_confidence_score');
      
      const formId = generationResponse.data.form_id;
      const generatedFields = generationResponse.data.generated_fields;
      const confidenceScore = generationResponse.data.ai_confidence_score;
      
      // Validate AI generation quality
      expect(typeof confidenceScore).toBe('number');
      expect(confidenceScore).toBeGreaterThan(0.7); // High confidence threshold
      expect(Array.isArray(generatedFields)).toBe(true);
      expect(generatedFields.length).toBeGreaterThan(5); // Should generate substantial form
      
      // Step 2: Validate generated field types and relevance
      console.log('Validating AI-generated field relevance');
      
      const expectedFieldTypes = [
        'photography_style',
        'budget_range',
        'event_timeline',
        'guest_count',
        'venue_details',
        'special_requests',
        'contact_preferences'
      ];
      
      const generatedFieldIds = generatedFields.map((field: any) => field.id);
      
      // Check for photography-specific fields
      expect(generatedFieldIds.some((id: string) => 
        id.includes('style') || id.includes('photography')
      )).toBe(true);
      
      expect(generatedFieldIds.some((id: string) => 
        id.includes('budget') || id.includes('price')
      )).toBe(true);
      
      expect(generatedFieldIds.some((id: string) => 
        id.includes('timeline') || id.includes('schedule')
      )).toBe(true);
      
      // Validate field structure
      generatedFields.forEach((field: any) => {
        expect(field).toHaveProperty('id');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('required');
        
        // Validate field types are appropriate
        const validTypes = ['text', 'textarea', 'select', 'number', 'date', 'time', 'checkbox', 'radio', 'object'];
        expect(validTypes).toContain(field.type);
        
        // Labels should be human-readable
        expect(field.label.length).toBeGreaterThan(5);
        expect(field.label).toMatch(/^[A-Z]/); // Should start with capital letter
      });
      
      // Step 3: Retrieve and validate the generated form
      console.log('Retrieving complete AI-generated form');
      
      const formResponse = await apiClient.get(`/forms/${formId}`);
      expect(formResponse.status).toBe(200);
      expect(formResponse.data.name).toContain('Photography');
      expect(formResponse.data.ai_generated).toBe(true);
      expect(formResponse.data.fields_schema.fields).toEqual(generatedFields);
      
      // Step 4: Test form customization after AI generation
      console.log('Testing form customization capabilities');
      
      const customizations = {
        name: 'Custom Photography Consultation Form',
        description: 'Personalized consultation form for luxury wedding photography',
        fields_schema: {
          fields: [
            ...generatedFields.slice(0, 3), // Keep first 3 AI fields
            {
              id: 'custom_portfolio_preference',
              type: 'select',
              label: 'Which portfolio style resonates with you most?',
              required: true,
              options: ['Classic Elegance', 'Modern Romance', 'Artistic Vision', 'Documentary Style']
            },
            ...generatedFields.slice(3) // Add remaining AI fields
          ]
        }
      };
      
      const customizationResponse = await apiClient.put(`/forms/${formId}`, customizations);
      expect(customizationResponse.status).toBe(200);
      expect(customizationResponse.data.name).toBe(customizations.name);
      
      // Verify custom field was added
      const updatedFields = customizationResponse.data.fields_schema.fields;
      const customField = updatedFields.find((field: any) => field.id === 'custom_portfolio_preference');
      expect(customField).toBeDefined();
      expect(customField.label).toContain('portfolio style');
      
      // Step 5: Test AI form performance with client interaction
      console.log('Testing AI form in client workflow');
      
      // Simulate sharing the AI-generated form
      const shareResponse = await apiClient.post(`/forms/${formId}/share`, {
        wedding_id: 'test-wedding-id',
        message: 'Please complete this consultation form created specifically for your photography needs.'
      });
      expect([200, 201]).toContain(shareResponse.status);
      
      console.log('✅ AI form generation workflow completed successfully');
      
    }, 30000); // 30 second timeout for AI operations

    test('should generate catering consultation form with AI', async () => {
      console.log('Testing AI form generation for catering services');
      
      const cateringFormRequest = {
        service_type: 'catering',
        business_context: {
          specialization: 'wedding_catering',
          experience_years: 12,
          cuisine_types: ['modern_american', 'mediterranean', 'fusion'],
          service_styles: ['plated', 'buffet', 'family_style', 'cocktail'],
          dietary_accommodations: ['vegetarian', 'vegan', 'gluten_free', 'kosher']
        },
        client_focus: {
          target_couples: 'mid_to_luxury',
          average_guest_count: 120,
          common_venues: ['banquet_halls', 'outdoor_venues', 'private_estates']
        },
        form_preferences: {
          length: 'detailed',
          include_pricing: true,
          include_menu_preferences: true,
          include_dietary_restrictions: true
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', cateringFormRequest);
      expect(generationResponse.status).toBe(201);
      
      const generatedFields = generationResponse.data.generated_fields;
      const confidenceScore = generationResponse.data.ai_confidence_score;
      
      expect(confidenceScore).toBeGreaterThan(0.7);
      expect(generatedFields.length).toBeGreaterThan(8); // Catering forms should be comprehensive
      
      // Validate catering-specific fields
      const fieldIds = generatedFields.map((field: any) => field.id);
      
      expect(fieldIds.some((id: string) => 
        id.includes('menu') || id.includes('cuisine') || id.includes('food')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('dietary') || id.includes('allerg') || id.includes('restriction')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('guest') || id.includes('headcount') || id.includes('count')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('service') || id.includes('style')
      )).toBe(true);
      
      // Check for complex field types appropriate for catering
      const menuField = generatedFields.find((field: any) => 
        field.id.includes('menu') || field.label.toLowerCase().includes('menu')
      );
      expect(menuField).toBeDefined();
      expect(['select', 'checkbox', 'object', 'textarea']).toContain(menuField.type);
    });

    test('should generate venue consultation form with AI', async () => {
      console.log('Testing AI form generation for venue services');
      
      const venueFormRequest = {
        service_type: 'venue',
        business_context: {
          specialization: 'wedding_venue',
          venue_type: 'historic_estate',
          capacity_range: { min: 50, max: 300 },
          outdoor_space: true,
          indoor_space: true,
          catering_options: ['in_house', 'preferred_vendors', 'open_vendor']
        },
        client_focus: {
          target_couples: 'luxury_and_destination',
          peak_seasons: ['spring', 'fall'],
          typical_events: ['weddings', 'receptions', 'rehearsal_dinners']
        },
        form_preferences: {
          length: 'comprehensive',
          include_availability: true,
          include_packages: true,
          include_restrictions: true
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', venueFormRequest);
      expect(generationResponse.status).toBe(201);
      
      const generatedFields = generationResponse.data.generated_fields;
      const confidenceScore = generationResponse.data.ai_confidence_score;
      
      expect(confidenceScore).toBeGreaterThan(0.7);
      
      // Validate venue-specific fields
      const fieldIds = generatedFields.map((field: any) => field.id);
      
      expect(fieldIds.some((id: string) => 
        id.includes('guest') || id.includes('capacity') || id.includes('headcount')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('date') || id.includes('availability')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('setup') || id.includes('layout') || id.includes('space')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('catering') || id.includes('vendor')
      )).toBe(true);
    });
  });

  describe('AI Form Quality and Validation', () => {
    test('should ensure AI-generated forms meet quality standards', async () => {
      const qualityTestRequest = {
        service_type: 'photography',
        business_context: {
          specialization: 'wedding_photography',
          experience_years: 5
        },
        form_preferences: {
          length: 'standard'
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', qualityTestRequest);
      expect(generationResponse.status).toBe(201);
      
      const fields = generationResponse.data.generated_fields;
      const confidenceScore = generationResponse.data.ai_confidence_score;
      
      // Quality checks
      expect(confidenceScore).toBeGreaterThan(0.6); // Minimum acceptable confidence
      expect(fields.length).toBeGreaterThan(3); // Minimum field count
      expect(fields.length).toBeLessThan(25); // Maximum to prevent overwhelming forms
      
      // Check for required business-critical fields
      const hasContactField = fields.some((field: any) => 
        field.id.includes('contact') || field.id.includes('email') || field.id.includes('phone')
      );
      expect(hasContactField).toBe(true);
      
      const hasBudgetField = fields.some((field: any) => 
        field.id.includes('budget') || field.id.includes('price') || field.id.includes('cost')
      );
      expect(hasBudgetField).toBe(true);
      
      // Validate field labels are professional
      fields.forEach((field: any) => {
        expect(field.label).not.toContain('TODO');
        expect(field.label).not.toContain('placeholder');
        expect(field.label).not.toMatch(/^test/i);
        expect(field.label.length).toBeGreaterThan(10); // Descriptive labels
      });
      
      // Check for logical field ordering
      const contactFields = fields.filter((field: any) => 
        field.id.includes('contact') || field.id.includes('email')
      );
      if (contactFields.length > 0) {
        const contactIndex = fields.findIndex((field: any) => field === contactFields[0]);
        expect(contactIndex).toBeLessThan(fields.length / 2); // Contact info should be early
      }
    });

    test('should handle edge cases in AI generation', async () => {
      // Test with minimal context
      const minimalRequest = {
        service_type: 'other',
        business_context: {},
        form_preferences: {}
      };
      
      const minimalResponse = await apiClient.post('/ai/generate-form', minimalRequest);
      expect([201, 400]).toContain(minimalResponse.status);
      
      if (minimalResponse.status === 201) {
        expect(minimalResponse.data.generated_fields.length).toBeGreaterThan(2);
        expect(minimalResponse.data.ai_confidence_score).toBeGreaterThan(0.3);
      }
      
      // Test with conflicting context
      const conflictingRequest = {
        service_type: 'photography',
        business_context: {
          specialization: 'catering', // Mismatch
          experience_years: -5 // Invalid
        }
      };
      
      const conflictingResponse = await apiClient.post('/ai/generate-form', conflictingRequest);
      expect([201, 400, 422]).toContain(conflictingResponse.status);
      
      // Test with very specific context
      const specificRequest = {
        service_type: 'photography',
        business_context: {
          specialization: 'drone_aerial_photography',
          experience_years: 15,
          equipment: ['professional_drones', '4k_cameras', 'gimbals'],
          certifications: ['part_107', 'insurance_certified'],
          flight_restrictions: ['no_fly_zones', 'weather_dependent']
        },
        form_preferences: {
          include_technical_requirements: true,
          include_weather_backup: true,
          include_permit_handling: true
        }
      };
      
      const specificResponse = await apiClient.post('/ai/generate-form', specificRequest);
      expect(specificResponse.status).toBe(201);
      
      const specificFields = specificResponse.data.generated_fields;
      
      // Should include drone-specific fields
      const fieldIds = specificFields.map((field: any) => field.id);
      expect(fieldIds.some((id: string) => 
        id.includes('weather') || id.includes('backup') || id.includes('rain')
      )).toBe(true);
      
      expect(fieldIds.some((id: string) => 
        id.includes('permit') || id.includes('restrictions') || id.includes('flight')
      )).toBe(true);
    });

    test('should support iterative AI improvement', async () => {
      // Generate initial form
      const initialRequest = {
        service_type: 'videography',
        business_context: {
          specialization: 'wedding_videography',
          experience_years: 6
        }
      };
      
      const initialResponse = await apiClient.post('/ai/generate-form', initialRequest);
      expect(initialResponse.status).toBe(201);
      
      const initialFormId = initialResponse.data.form_id;
      const initialConfidence = initialResponse.data.ai_confidence_score;
      
      // Request improvement based on feedback
      const improvementRequest = {
        form_id: initialFormId,
        feedback: {
          missing_fields: ['video_style_preferences', 'delivery_timeline', 'raw_footage_access'],
          field_improvements: [
            {
              field_id: 'budget',
              suggestion: 'Break down into ceremony and reception budgets'
            }
          ],
          overall_feedback: 'Need more specific videography technical questions'
        },
        regenerate_sections: ['technical_requirements', 'delivery_options']
      };
      
      const improvementResponse = await apiClient.post('/ai/improve-form', improvementRequest);
      expect([200, 201]).toContain(improvementResponse.status);
      
      if (improvementResponse.status === 200 || improvementResponse.status === 201) {
        const improvedFields = improvementResponse.data.generated_fields;
        const improvedConfidence = improvementResponse.data.ai_confidence_score;
        
        // Improved version should be better
        expect(improvedConfidence).toBeGreaterThanOrEqual(initialConfidence);
        
        // Should include requested missing fields
        const improvedFieldIds = improvedFields.map((field: any) => field.id);
        expect(improvedFieldIds.some((id: string) => 
          id.includes('style') || id.includes('video')
        )).toBe(true);
        
        expect(improvedFieldIds.some((id: string) => 
          id.includes('delivery') || id.includes('timeline')
        )).toBe(true);
      }
    });
  });

  describe('AI Integration with Business Logic', () => {
    test('should integrate AI forms with existing workflow', async () => {
      // Generate form with AI
      const workflowRequest = {
        service_type: 'planning',
        business_context: {
          specialization: 'full_service_wedding_planning',
          experience_years: 10,
          team_size: 'medium',
          planning_phases: ['initial_consultation', 'vendor_selection', 'day_of_coordination']
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', workflowRequest);
      expect(generationResponse.status).toBe(201);
      
      const formId = generationResponse.data.form_id;
      
      // Test form sharing capability
      const shareResponse = await apiClient.post(`/forms/${formId}/share`, {
        wedding_id: 'workflow-test-wedding',
        message: 'AI-generated comprehensive planning consultation form'
      });
      expect([200, 201]).toContain(shareResponse.status);
      
      // Test form analytics
      const analyticsResponse = await apiClient.get(`/forms/${formId}/analytics`);
      expect([200, 404]).toContain(analyticsResponse.status);
      
      if (analyticsResponse.status === 200) {
        expect(analyticsResponse.data).toHaveProperty('ai_generated');
        expect(analyticsResponse.data.ai_generated).toBe(true);
      }
      
      // Test form duplication
      const duplicateResponse = await apiClient.post(`/forms/${formId}/duplicate`, {
        name: 'Copy of AI Planning Form'
      });
      expect([200, 201]).toContain(duplicateResponse.status);
      
      if (duplicateResponse.status === 201) {
        expect(duplicateResponse.data.name).toContain('Copy of AI Planning Form');
        expect(duplicateResponse.data.ai_generated).toBe(true);
      }
    });

    test('should handle AI form version control', async () => {
      const versionRequest = {
        service_type: 'flowers',
        business_context: {
          specialization: 'bridal_florals',
          style_preferences: ['romantic', 'garden', 'modern']
        }
      };
      
      const generationResponse = await apiClient.post('/ai/generate-form', versionRequest);
      expect(generationResponse.status).toBe(201);
      
      const formId = generationResponse.data.form_id;
      
      // Get form version info
      const versionResponse = await apiClient.get(`/forms/${formId}/versions`);
      expect([200, 404]).toContain(versionResponse.status);
      
      if (versionResponse.status === 200) {
        expect(versionResponse.data.current_version).toBeDefined();
        expect(versionResponse.data.versions[0].ai_generated).toBe(true);
      }
      
      // Update form and check versioning
      const updateResponse = await apiClient.put(`/forms/${formId}`, {
        name: 'Updated AI Floral Form',
        description: 'Enhanced with custom fields'
      });
      expect(updateResponse.status).toBe(200);
      
      // Check that version history is maintained
      const updatedVersionResponse = await apiClient.get(`/forms/${formId}/versions`);
      if (updatedVersionResponse.status === 200) {
        expect(updatedVersionResponse.data.versions.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle AI generation under load', async () => {
      const loadRequests = Array(3).fill(null).map((_, i) => ({
        service_type: 'photography',
        business_context: {
          specialization: `specialty_${i}`,
          experience_years: 5 + i
        },
        form_preferences: {
          length: 'standard'
        }
      }));
      
      const startTime = Date.now();
      const generationPromises = loadRequests.map(request =>
        apiClient.post('/ai/generate-form', request)
      );
      
      const results = await Promise.allSettled(generationPromises);
      const endTime = Date.now();
      
      // Check that most requests succeeded
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      expect(successful.length).toBeGreaterThan(1);
      
      // Check reasonable response time
      const averageTime = (endTime - startTime) / loadRequests.length;
      expect(averageTime).toBeLessThan(15000); // 15 seconds per form generation
    });

    test('should gracefully handle AI service failures', async () => {
      // Test with potentially problematic input
      const problematicRequest = {
        service_type: 'unknown_service_type_that_should_not_exist',
        business_context: {
          specialization: 'undefined',
          experience_years: 'invalid'
        }
      };
      
      const problematicResponse = await apiClient.post('/ai/generate-form', problematicRequest);
      expect([400, 422, 500]).toContain(problematicResponse.status);
      
      // System should still be operational
      const validRequest = {
        service_type: 'photography',
        business_context: {
          specialization: 'wedding_photography',
          experience_years: 5
        }
      };
      
      const recoveryResponse = await apiClient.post('/ai/generate-form', validRequest);
      expect(recoveryResponse.status).toBe(201);
    });
  });
});