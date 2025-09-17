// Test fixtures for WedSync API contract tests

export const validSupplierCredentials = {
  email: 'supplier@test.com',
  password: 'password123'
};

export const invalidSupplierCredentials = {
  email: 'invalid@test.com',
  password: 'wrongpassword'
};

export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'supplier@test.com',
  role: 'supplier' as const,
  created_at: '2024-01-01T00:00:00Z',
  last_login_at: '2024-01-01T00:00:00Z'
};

export const mockSupplier = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  business_name: 'Test Photography Studio',
  specialization: 'photographer' as const,
  description: 'Professional wedding photography',
  website: 'https://testphotography.com',
  phone: '+1234567890',
  address: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TC',
    zip: '12345',
    country: 'US'
  },
  pricing_tier: 'professional' as const,
  verification_status: 'verified' as const
};

export const mockWedding = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  title: 'John & Jane Wedding',
  wedding_date: '2024-06-15',
  ceremony_venue: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Beautiful Garden Venue',
    address: {
      street: '456 Garden Ave',
      city: 'Test City',
      state: 'TC',
      zip: '12345',
      country: 'US'
    },
    contact_info: {
      phone: '+1234567891',
      email: 'venue@test.com'
    },
    capacity_max: 150,
    restrictions: {}
  },
  reception_venue: null,
  guest_count_estimated: 100,
  guest_count_confirmed: 85,
  budget_total: 25000.00,
  theme: 'Garden Party',
  status: 'confirmed' as const,
  core_details_complete: true
};

export const mockForm = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  supplier_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Photography Consultation Form',
  description: 'Initial consultation form for photography services',
  fields_schema: {
    fields: [
      {
        id: 'preferred_style',
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
        id: 'special_requests',
        type: 'textarea',
        label: 'Special Requests or Requirements',
        required: false
      }
    ]
  },
  conditional_logic: {},
  is_active: true,
  submission_count: 5,
  completion_rate: 0.85,
  ai_generated: false,
  created_at: '2024-01-01T00:00:00Z'
};

export const validFormData = {
  name: 'New Test Form',
  description: 'A test form for validation',
  wedding_id: '123e4567-e89b-12d3-a456-426614174002',
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

export const invalidFormData = {
  name: '', // Invalid: empty name
  fields_schema: {} // Invalid: empty schema
};

export const mockAuthResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: mockUser,
  supplier: mockSupplier
};

export const mockTodayResponse = {
  wedding: mockWedding,
  weather: {
    temperature: 75,
    condition: 'Sunny',
    precipitation: 0,
    wind_speed: 5
  },
  directions: {
    distance: '15.2 miles',
    duration: '25 minutes',
    route_url: 'https://maps.google.com/directions?...'
  },
  contacts: [
    {
      name: 'John Smith',
      role: 'Groom',
      phone: '+1234567892',
      email: 'john@test.com'
    },
    {
      name: 'Jane Doe',
      role: 'Bride',
      phone: '+1234567893',
      email: 'jane@test.com'
    }
  ]
};

export const mockFormsListResponse = {
  forms: [mockForm],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    total_pages: 1
  }
};

// WedMe-specific fixtures
export const validCoupleCredentials = {
  email: 'couple@test.com',
  password: 'password123'
};

export const invalidCoupleCredentials = {
  email: 'invalid@test.com', 
  password: 'wrongpassword'
};

export const mockCoupleUser = {
  id: '123e4567-e89b-12d3-a456-426614174010',
  email: 'couple@test.com',
  role: 'couple' as const,
  created_at: '2024-01-01T00:00:00Z'
};

export const mockCoupleWedding = {
  id: '123e4567-e89b-12d3-a456-426614174011',
  title: 'Our Beautiful Wedding',
  wedding_date: '2024-08-15',
  ceremony_venue: {
    id: '123e4567-e89b-12d3-a456-426614174012',
    name: 'Beautiful Church',
    address: {
      street: '789 Church Lane',
      city: 'Wedding City',
      state: 'WC',
      zip: '54321',
      country: 'US'
    }
  },
  reception_venue: {
    id: '123e4567-e89b-12d3-a456-426614174013',
    name: 'Grand Ballroom',
    address: {
      street: '101 Reception Ave',
      city: 'Wedding City', 
      state: 'WC',
      zip: '54321',
      country: 'US'
    }
  },
  guest_count_estimated: 150,
  guest_count_confirmed: 120,
  budget_total: 50000,
  theme: 'Garden Romance',
  status: 'planning' as const,
  core_details_complete: false
};

export const mockWedMeAuthResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.wedme...',
  user: mockCoupleUser,
  weddings: [mockCoupleWedding]
};

// Guest-related fixtures
export const mockGuest = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@test.com',
  phone: '+1234567894',
  relationship: 'Friend',
  rsvp_status: 'pending' as const,
  rsvp_responded_at: null,
  dietary_requirements: {
    vegetarian: true,
    allergies: ['nuts']
  },
  plus_one_allowed: true,
  plus_one_name: null,
  photo_groups: ['friends'],
  is_helper: false,
  helper_role: null
};

export const validGuestData = {
  first_name: 'Bob',
  last_name: 'Smith',
  email: 'bob@test.com',
  phone: '+1234567895',
  relationship: 'Colleague',
  plus_one_allowed: false,
  dietary_requirements: {},
  is_helper: false,
  helper_role: null
};

export const validBulkGuestData = {
  guests: [
    {
      first_name: 'Carol',
      last_name: 'Davis',
      email: 'carol@test.com',
      relationship: 'Family',
      plus_one_allowed: true
    },
    {
      first_name: 'David',
      last_name: 'Wilson',
      email: 'david@test.com',
      relationship: 'Friend',
      plus_one_allowed: false
    }
  ]
};

export const mockGuestUpdate = {
  first_name: 'Alice Updated',
  email: 'alice.updated@test.com',
  relationship: 'Close Friend',
  plus_one_allowed: false,
  photo_groups: ['friends', 'college']
};

// RSVP-related fixtures
export const validRsvpData = {
  rsvp_status: 'attending' as const
};

export const mockRsvpWithPlusOne = {
  rsvp_status: 'attending' as const,
  plus_one_name: 'John Doe',
  dietary_requirements: {
    vegetarian: false,
    allergies: []
  }
};

export const mockRsvpDecline = {
  rsvp_status: 'not_attending' as const,
  special_notes: 'Unfortunately cannot attend due to prior commitment'
};

// Task-related fixtures
export const mockTask = {
  id: '123e4567-e89b-12d3-a456-426614174030',
  title: 'Book wedding cake',
  description: 'Find and book the wedding cake for the reception',
  priority: 'high' as const,
  status: 'pending' as const,
  category: 'catering',
  due_date: '2024-07-15',
  assignees: [],
  is_day_of_task: false,
  completed_at: null
};

export const validTaskData = {
  title: 'Send invitations',
  description: 'Mail out wedding invitations to all guests',
  priority: 'medium' as const,
  category: 'invitations',
  due_date: '2024-06-01',
  is_day_of_task: false
};

export const mockTaskUpdate = {
  title: 'Updated Task Title',
  description: 'Updated task description',
  priority: 'urgent' as const,
  status: 'in_progress' as const,
  due_date: '2024-07-20'
};

export const mockDayOfTask = {
  title: 'Set up ceremony chairs',
  description: 'Arrange chairs for the wedding ceremony',
  priority: 'high' as const,
  category: 'day_of',
  is_day_of_task: true
};

// Timeline-related fixtures
export const mockTimeline = {
  timeline: {
    '10:00': {
      events: [
        {
          title: 'Ceremony',
          duration: 60,
          location: 'Main Hall',
          suppliers: []
        }
      ]
    },
    '11:30': {
      events: [
        {
          title: 'Photography Session',
          duration: 45,
          location: 'Garden',
          suppliers: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              role: 'photographer'
            }
          ]
        }
      ]
    },
    '17:00': {
      events: [
        {
          title: 'Reception',
          duration: 240,
          location: 'Ballroom',
          suppliers: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              role: 'caterer'
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              role: 'dj'
            }
          ]
        }
      ]
    }
  },
  supplier_schedules: [
    {
      supplier_id: '123e4567-e89b-12d3-a456-426614174001',
      schedule: {
        arrival_time: '10:30',
        setup_duration: 30,
        active_periods: ['11:30-12:15'],
        breakdown_duration: 15
      }
    }
  ]
};

export const validTimelineUpdate = {
  timeline: {
    '09:00': {
      events: [
        {
          title: 'Hair and Makeup',
          duration: 120,
          location: 'Bridal Suite'
        }
      ]
    },
    '14:00': {
      events: [
        {
          title: 'Ceremony',
          duration: 45,
          location: 'Chapel'
        }
      ]
    }
  },
  notify_suppliers: true
};

export const mockTimelineWithSuppliers = {
  timeline: {
    '13:00': {
      events: [
        {
          title: 'Pre-ceremony Setup',
          duration: 60,
          location: 'Ceremony Venue',
          suppliers: [
            {
              id: '123e4567-e89b-12d3-a456-426614174004',
              role: 'florist'
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174005',
              role: 'coordinator'
            }
          ]
        }
      ]
    },
    '14:00': {
      events: [
        {
          title: 'Wedding Ceremony',
          duration: 45,
          location: 'Main Altar',
          suppliers: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              role: 'photographer'
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174006',
              role: 'videographer'
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174007',
              role: 'musician'
            }
          ]
        }
      ]
    }
  },
  notify_suppliers: true
};

// Supplier-related fixtures
export const mockWeddingSupplier = {
  supplier: {
    id: '123e4567-e89b-12d3-a456-426614174040',
    business_name: 'Amazing Photography Studio',
    specialization: 'photography',
    description: 'Professional wedding photography with 10+ years experience',
    website: 'https://amazingphotography.com',
    verification_status: 'verified'
  },
  service_type: 'photography',
  contract_status: 'contracted' as const,
  booking_confirmed_at: '2024-02-15T10:00:00Z',
  timeline_items: {
    arrival: '10:30',
    setup: 30,
    active_shooting: ['11:30-12:15', '17:00-22:00'],
    breakdown: 15
  }
};

export const validSupplierInvitation = {
  supplier_email: 'photographer@example.com',
  service_type: 'photography',
  message: 'We would love to have you photograph our wedding!'
};

export const mockSupplierInviteResponse = {
  invitation_id: '123e4567-e89b-12d3-a456-426614174041',
  status: 'sent'
};

// Form submission fixtures
export const validFormSubmission = {
  responses: {
    preferred_style: 'Photojournalistic',
    budget: 3500,
    special_requests: 'We would like natural lighting and candid shots'
  },
  status: 'submitted'
};

export const mockFormSubmissionResponse = {
  id: '123e4567-e89b-12d3-a456-426614174050',
  form_id: '123e4567-e89b-12d3-a456-426614174004',
  responses: {
    preferred_style: 'Photojournalistic',
    budget: 3500,
    special_requests: 'We would like natural lighting and candid shots'
  },
  status: 'submitted' as const,
  submitted_at: '2024-03-01T14:30:00Z'
};

export const mockDraftSubmission = {
  responses: {
    budget: 4000,
    preferred_style: 'Traditional'
  },
  status: 'draft' as const
};