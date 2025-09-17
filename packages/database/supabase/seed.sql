-- Development seed data for WedSync platform
-- This file contains comprehensive test data for development and testing

-- Clear existing data (for reset scenarios)
TRUNCATE TABLE 
  attachments,
  contact_segments,
  campaigns,
  templates,
  messages,
  conversations,
  journey_executions,
  journeys,
  form_submissions,
  forms,
  guests,
  wedding_timelines,
  weddings,
  couple_profiles,
  supplier_profiles,
  users
CASCADE;

-- Insert seed users
INSERT INTO users (id, email, first_name, last_name, phone_number, role, status, email_verified_at, created_at) VALUES
-- Admin users
('00000000-0000-0000-0000-000000000001', 'admin@wedsync.com', 'Admin', 'User', '+1234567890', 'admin', 'active', NOW(), NOW()),

-- Supplier users
('00000000-0000-0000-0000-000000000002', 'sarah@dreamweddings.com', 'Sarah', 'Johnson', '+1234567891', 'supplier', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'mike@capturedmoments.com', 'Mike', 'Chen', '+1234567892', 'supplier', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000004', 'lisa@floralbliss.com', 'Lisa', 'Rodriguez', '+1234567893', 'supplier', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000005', 'david@grandballroom.com', 'David', 'Thompson', '+1234567894', 'supplier', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000006', 'emma@deliciousdelights.com', 'Emma', 'Williams', '+1234567895', 'supplier', 'active', NOW(), NOW()),

-- Couple users
('00000000-0000-0000-0000-000000000007', 'alice@example.com', 'Alice', 'Smith', '+1234567896', 'couple', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000008', 'bob@example.com', 'Bob', 'Johnson', '+1234567897', 'couple', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000009', 'carol@example.com', 'Carol', 'Davis', '+1234567898', 'couple', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000010', 'daniel@example.com', 'Daniel', 'Wilson', '+1234567899', 'couple', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000011', 'emily@example.com', 'Emily', 'Brown', '+1234567800', 'couple', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000012', 'frank@example.com', 'Frank', 'Miller', '+1234567801', 'couple', 'active', NOW(), NOW()),

-- Guest users
('00000000-0000-0000-0000-000000000013', 'guest1@example.com', 'John', 'Guest', '+1234567802', 'guest', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000014', 'guest2@example.com', 'Jane', 'Guest', '+1234567803', 'guest', 'active', NOW(), NOW()),
('00000000-0000-0000-0000-000000000015', 'guest3@example.com', 'Mark', 'Friend', '+1234567804', 'guest', 'active', NOW(), NOW());

-- Insert supplier profiles
INSERT INTO supplier_profiles (id, user_id, business_name, specialization, description, website, subscription_tier, created_at) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Dream Weddings Planning', 'planner', 'Full-service wedding planning with 15+ years of experience creating magical moments.', 'https://dreamweddings.com', 'professional', NOW()),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Captured Moments Photography', 'photographer', 'Award-winning wedding photography specializing in candid, emotional storytelling.', 'https://capturedmoments.com', 'starter', NOW()),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Floral Bliss', 'florist', 'Luxury floral designs for weddings and special events. Fresh, seasonal arrangements.', 'https://floralbliss.com', 'professional', NOW()),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Grand Ballroom Venue', 'venue', 'Elegant ballroom venue accommodating 50-300 guests with full catering services.', 'https://grandballroom.com', 'scale', NOW()),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Delicious Delights Catering', 'caterer', 'Gourmet catering services with farm-to-table ingredients and customizable menus.', 'https://deliciousdelights.com', 'professional', NOW());

-- Insert couple profiles
INSERT INTO couple_profiles (id, partner_one_id, partner_two_id, relationship_status, shared_email, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'engaged', 'alice.bob@example.com', NOW()),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010', 'engaged', 'carol.daniel@example.com', NOW()),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012', 'engaged', 'emily.frank@example.com', NOW());

-- Insert weddings
INSERT INTO weddings (id, couple_id, wedding_date, ceremony_venue, reception_venue, guest_count, estimated_budget, theme, color_scheme, status, created_at) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2024-06-15', 
  '{"name": "Garden Chapel", "address": "123 Rose Lane, City, State", "capacity": 100}',
  '{"name": "Grand Ballroom", "address": "456 Oak Street, City, State", "capacity": 150}',
  120, 25000.00, 'Garden Romance', ARRAY['blush', 'ivory', 'gold'], 'planning', NOW()),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2024-08-20', 
  '{"name": "Seaside Chapel", "address": "789 Ocean Drive, City, State", "capacity": 80}',
  '{"name": "Beachside Pavilion", "address": "789 Ocean Drive, City, State", "capacity": 120}',
  90, 18000.00, 'Beach Elegance', ARRAY['navy', 'coral', 'gold'], 'confirmed', NOW()),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '2024-10-12', 
  '{"name": "Mountain View Lodge", "address": "321 Pine Ridge, City, State", "capacity": 60}',
  '{"name": "Mountain View Lodge", "address": "321 Pine Ridge, City, State", "capacity": 80}',
  65, 22000.00, 'Rustic Chic', ARRAY['burgundy', 'champagne', 'greenery'], 'planning', NOW());

-- Insert wedding timelines
INSERT INTO wedding_timelines (id, wedding_id, events, created_at) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 
  '[
    {"time": "14:00", "event": "Ceremony begins", "location": "Garden Chapel"},
    {"time": "14:30", "event": "Cocktail hour", "location": "Garden terrace"},
    {"time": "16:00", "event": "Reception dinner", "location": "Grand Ballroom"},
    {"time": "19:00", "event": "First dance", "location": "Dance floor"},
    {"time": "22:00", "event": "Reception ends", "location": "Grand Ballroom"}
  ]', NOW()),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 
  '[
    {"time": "16:00", "event": "Ceremony begins", "location": "Seaside Chapel"},
    {"time": "16:30", "event": "Beach photos", "location": "Beach"},
    {"time": "17:30", "event": "Reception dinner", "location": "Beachside Pavilion"},
    {"time": "20:00", "event": "First dance", "location": "Pavilion deck"},
    {"time": "23:00", "event": "Reception ends", "location": "Beachside Pavilion"}
  ]', NOW());

-- Insert guests
INSERT INTO guests (id, wedding_id, first_name, last_name, email, phone_number, relationship, rsvp_status, plus_one_allowed, dietary_requirements, created_at) VALUES
-- Wedding 1 guests
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'John', 'Guest', 'guest1@example.com', '+1234567802', 'Friend', 'accepted', true, '[{"type": "vegetarian", "severity": "mild"}]', NOW()),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Jane', 'Guest', 'guest2@example.com', '+1234567803', 'Family', 'accepted', false, '[]', NOW()),
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Mark', 'Friend', 'guest3@example.com', '+1234567804', 'Friend', 'pending', true, '[{"type": "gluten_free", "severity": "moderate"}]', NOW()),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'Sarah', 'Wilson', 'sarah.wilson@example.com', '+1234567805', 'Family', 'accepted', false, '[]', NOW()),
('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'Michael', 'Brown', 'michael.brown@example.com', '+1234567806', 'Friend', 'declined', true, '[]', NOW()),

-- Wedding 2 guests
('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'Lisa', 'Anderson', 'lisa.anderson@example.com', '+1234567807', 'Family', 'accepted', true, '[{"type": "dairy_free", "severity": "severe"}]', NOW()),
('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'Tom', 'Garcia', 'tom.garcia@example.com', '+1234567808', 'Friend', 'maybe', false, '[]', NOW()),
('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000002', 'Rachel', 'Martinez', 'rachel.martinez@example.com', '+1234567809', 'Work colleague', 'pending', true, '[{"type": "nut_allergy", "severity": "severe"}]', NOW());

-- Insert forms
INSERT INTO forms (id, supplier_id, name, description, status, fields, created_at) VALUES
('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Wedding Planning Consultation', 'Initial consultation form for wedding planning services', 'published', 
  '[
    {"id": "wedding_date", "type": "date", "label": "Wedding Date", "required": true},
    {"id": "venue_preference", "type": "select", "label": "Venue Preference", "options": ["Indoor", "Outdoor", "Beach", "Garden"], "required": true},
    {"id": "guest_count", "type": "number", "label": "Expected Guest Count", "required": true},
    {"id": "budget_range", "type": "select", "label": "Budget Range", "options": ["Under $15k", "$15k-$25k", "$25k-$50k", "$50k+"], "required": true},
    {"id": "special_requests", "type": "textarea", "label": "Special Requests or Requirements", "required": false}
  ]', NOW()),
('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Photography Preferences', 'Photo session preferences and requirements', 'published',
  '[
    {"id": "photo_style", "type": "multiselect", "label": "Photography Style", "options": ["Traditional", "Candid", "Artistic", "Vintage"], "required": true},
    {"id": "must_have_shots", "type": "textarea", "label": "Must-Have Photo Shots", "required": false},
    {"id": "special_moments", "type": "textarea", "label": "Special Moments to Capture", "required": false},
    {"id": "photo_restrictions", "type": "textarea", "label": "Any Photo Restrictions", "required": false}
  ]', NOW()),
('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Floral Design Consultation', 'Floral arrangement preferences and requirements', 'published',
  '[
    {"id": "flower_preferences", "type": "multiselect", "label": "Preferred Flowers", "options": ["Roses", "Peonies", "Hydrangeas", "Lilies", "Tulips", "Orchids"], "required": true},
    {"id": "color_scheme", "type": "text", "label": "Wedding Color Scheme", "required": true},
    {"id": "arrangements_needed", "type": "multiselect", "label": "Arrangements Needed", "options": ["Bridal bouquet", "Bridesmaids bouquets", "Boutonnieres", "Centerpieces", "Ceremony arch", "Aisle petals"], "required": true},
    {"id": "allergies", "type": "text", "label": "Flower Allergies", "required": false}
  ]', NOW());

-- Insert form submissions
INSERT INTO form_submissions (id, form_id, wedding_id, respondent_email, responses, status, completed_at, created_at) VALUES
('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'alice@example.com',
  '[
    {"field_id": "wedding_date", "value": "2024-06-15"},
    {"field_id": "venue_preference", "value": "Garden"},
    {"field_id": "guest_count", "value": "120"},
    {"field_id": "budget_range", "value": "$25k-$50k"},
    {"field_id": "special_requests", "value": "We would like an outdoor ceremony if weather permits"}
  ]', 'completed', NOW(), NOW()),
('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'alice@example.com',
  '[
    {"field_id": "photo_style", "value": ["Candid", "Artistic"]},
    {"field_id": "must_have_shots", "value": "First dance, cake cutting, bouquet toss"},
    {"field_id": "special_moments", "value": "Groom seeing bride for first time"},
    {"field_id": "photo_restrictions", "value": "No photos during ceremony vows"}
  ]', 'completed', NOW(), NOW());

-- Insert journeys
INSERT INTO journeys (id, supplier_id, name, description, status, trigger, nodes, created_at) VALUES
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Welcome New Couples', 'Automated welcome sequence for new couple inquiries', 'active',
  '{"type": "form_submission", "form_id": "60000000-0000-0000-0000-000000000001"}',
  '[
    {"id": "welcome_email", "type": "email", "delay": "0", "template": "welcome_couples"},
    {"id": "follow_up", "type": "email", "delay": "3d", "template": "planning_tips"},
    {"id": "consultation_booking", "type": "email", "delay": "7d", "template": "book_consultation"}
  ]', NOW()),
('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Photography Follow-up', 'Follow-up sequence for photography inquiries', 'active',
  '{"type": "form_submission", "form_id": "60000000-0000-0000-0000-000000000002"}',
  '[
    {"id": "photo_welcome", "type": "email", "delay": "0", "template": "photography_welcome"},
    {"id": "portfolio_share", "type": "email", "delay": "1d", "template": "portfolio_showcase"},
    {"id": "booking_reminder", "type": "email", "delay": "5d", "template": "booking_reminder"}
  ]', NOW());

-- Insert journey executions
INSERT INTO journey_executions (id, journey_id, contact_id, wedding_id, status, current_node_id, started_at, created_at) VALUES
('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 'running', 'follow_up', NOW() - INTERVAL '2 days', NOW()),
('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', 'completed', NULL, NOW() - INTERVAL '1 week', NOW());

-- Insert conversations
INSERT INTO conversations (id, participants, supplier_id, wedding_id, subject, status, priority, last_message_at, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', ARRAY['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007']::UUID[], '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Wedding Planning Consultation', 'open', 'normal', NOW(), NOW()),
('a0000000-0000-0000-0000-000000000002', ARRAY['00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007']::UUID[], '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Photography Session Details', 'open', 'normal', NOW(), NOW());

-- Insert messages
INSERT INTO messages (id, conversation_id, sender_id, recipient_id, type, content, status, sent_at, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 'email',
  '{"subject": "Welcome to Dream Weddings!", "body": "Thank you for your interest in our wedding planning services. We are excited to help make your special day perfect!"}',
  'sent', NOW() - INTERVAL '1 day', NOW()),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'email',
  '{"subject": "Re: Welcome to Dream Weddings!", "body": "Hi Sarah, thank you for the warm welcome! We are looking forward to discussing our June wedding plans with you."}',
  'sent', NOW() - INTERVAL '6 hours', NOW());

-- Insert templates
INSERT INTO templates (id, supplier_id, name, description, type, category, subject, content, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Welcome New Couples', 'Welcome email for new couple inquiries', 'email', 'welcome', 'Welcome to Dream Weddings Planning!', 
  'Dear {{couple_names}},

Thank you for considering Dream Weddings Planning for your special day! We are thrilled that you have chosen us to help create magical memories that will last a lifetime.

Our team of experienced wedding planners is here to guide you through every step of the planning process, from the initial consultation to your wedding day coordination.

Next steps:
1. Review your consultation form responses
2. Schedule a complimentary planning consultation
3. Discuss your vision and budget

We will be in touch within 24 hours to schedule your consultation.

Warm regards,
The Dream Weddings Team', NOW()),
('c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Photography Welcome', 'Welcome email for photography inquiries', 'email', 'welcome', 'Captured Moments - Let''s Create Magic Together!',
  'Hello {{bride_name}} and {{groom_name}},

Thank you for your interest in Captured Moments Photography! Your wedding day will be filled with precious moments, and I am honored that you are considering me to capture them.

I specialize in candid, emotional storytelling through photography, ensuring that every laugh, tear, and tender moment is beautifully preserved.

What''s next:
- Portfolio review (attached)
- Engagement session discussion
- Wedding day timeline planning
- Package customization

I would love to schedule a call to discuss your vision and how we can bring it to life through stunning photography.

Best regards,
Mike Chen
Captured Moments Photography', NOW());

-- Insert campaigns
INSERT INTO campaigns (id, supplier_id, name, description, type, template_id, audience, schedule, status, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Spring Wedding Promotion', 'Promotional campaign for spring wedding bookings', 'email', 'c0000000-0000-0000-0000-000000000001',
  '{"segment": "engaged_couples", "filters": {"wedding_date": {"after": "2024-03-01", "before": "2024-06-30"}}}',
  '{"type": "immediate", "send_at": "2024-02-01T10:00:00Z"}', 'draft', NOW());

-- Insert contact segments
INSERT INTO contact_segments (id, supplier_id, name, description, filters, contact_count, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Spring 2024 Couples', 'Couples with weddings planned for spring 2024', 
  '{"wedding_date": {"after": "2024-03-01", "before": "2024-06-30"}, "status": ["planning", "confirmed"]}', 2, NOW()),
('e0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Photography Leads', 'Couples who have shown interest in photography services',
  '{"form_submissions": {"form_id": "60000000-0000-0000-0000-000000000002"}, "status": ["completed"]}', 1, NOW());

-- Update sequences to ensure proper foreign key relationships
SELECT setval('users_id_seq', 20, true);
SELECT setval('supplier_profiles_id_seq', 10, true);
SELECT setval('couple_profiles_id_seq', 10, true);
SELECT setval('weddings_id_seq', 10, true);

-- Add some additional realistic data variations
UPDATE users SET last_login_at = NOW() - INTERVAL '1 day' WHERE role = 'supplier';
UPDATE users SET last_login_at = NOW() - INTERVAL '2 hours' WHERE role = 'couple';
UPDATE supplier_profiles SET subscription_expires_at = NOW() + INTERVAL '1 year' WHERE subscription_tier != 'free';

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Seed data has been successfully inserted!';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- % users', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '- % suppliers', (SELECT COUNT(*) FROM supplier_profiles);
    RAISE NOTICE '- % couples', (SELECT COUNT(*) FROM couple_profiles);
    RAISE NOTICE '- % weddings', (SELECT COUNT(*) FROM weddings);
    RAISE NOTICE '- % guests', (SELECT COUNT(*) FROM guests);
    RAISE NOTICE '- % forms', (SELECT COUNT(*) FROM forms);
    RAISE NOTICE '- % form submissions', (SELECT COUNT(*) FROM form_submissions);
    RAISE NOTICE '- % journeys', (SELECT COUNT(*) FROM journeys);
    RAISE NOTICE '- % conversations', (SELECT COUNT(*) FROM conversations);
    RAISE NOTICE '- % messages', (SELECT COUNT(*) FROM messages);
    RAISE NOTICE '- % templates', (SELECT COUNT(*) FROM templates);
    RAISE NOTICE 'Seed data setup complete!';
END $$;