-- Guest entity schema for WedSync platform
-- Individual attendee of a wedding
-- This file defines the guests table and related guest management data

-- Create custom types for guest management
DO $$ BEGIN
    CREATE TYPE rsvp_status AS ENUM (
        'pending', 'accepted', 'declined', 'maybe'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dietary_type AS ENUM (
        'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy', 
        'shellfish_allergy', 'kosher', 'halal', 'keto', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dietary_severity AS ENUM (
        'mild', 'moderate', 'severe'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE guest_role AS ENUM (
        'guest', 'wedding_party', 'family', 'vendor', 'coordinator', 'photographer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Guests table - Individual wedding attendees
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    
    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Contact and address information
    address JSONB,
    emergency_contact JSONB,
    
    -- Relationship and role
    relationship TEXT,
    guest_role guest_role DEFAULT 'guest',
    is_child BOOLEAN DEFAULT FALSE,
    is_wedding_party BOOLEAN DEFAULT FALSE,
    wedding_party_role TEXT,
    
    -- RSVP information
    rsvp_status rsvp_status DEFAULT 'pending',
    rsvp_date TIMESTAMPTZ,
    rsvp_notes TEXT,
    attendance_ceremony BOOLEAN,
    attendance_reception BOOLEAN,
    attendance_other_events JSONB DEFAULT '{}',
    
    -- Plus one information
    plus_one_allowed BOOLEAN DEFAULT FALSE,
    plus_one_name TEXT,
    plus_one_email TEXT,
    plus_one_rsvp_status rsvp_status,
    plus_one_dietary_requirements JSONB DEFAULT '[]',
    
    -- Dietary and accessibility requirements
    dietary_requirements JSONB DEFAULT '[]',
    allergies TEXT,
    accessibility_needs TEXT,
    special_assistance_required BOOLEAN DEFAULT FALSE,
    mobility_assistance BOOLEAN DEFAULT FALSE,
    
    -- Seating and logistics
    table_assignment TEXT,
    seat_number TEXT,
    photo_group TEXT,
    transportation_needed BOOLEAN DEFAULT FALSE,
    accommodation_needed BOOLEAN DEFAULT FALSE,
    accommodation_details JSONB,
    
    -- Communication preferences
    preferred_communication TEXT DEFAULT 'email',
    language_preference TEXT DEFAULT 'en',
    timezone TEXT,
    
    -- Event participation
    gift_given BOOLEAN DEFAULT FALSE,
    gift_description TEXT,
    thank_you_sent BOOLEAN DEFAULT FALSE,
    thank_you_sent_at TIMESTAMPTZ,
    
    -- Invitations and reminders
    save_the_date_sent BOOLEAN DEFAULT FALSE,
    save_the_date_sent_at TIMESTAMPTZ,
    invitation_sent BOOLEAN DEFAULT FALSE,
    invitation_sent_at TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Additional notes and tags
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Import and data source
    import_source TEXT,
    external_id TEXT,
    last_updated_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT guests_name_length CHECK (
        LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1
    ),
    CONSTRAINT guests_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT guests_phone_format CHECK (
        phone_number IS NULL OR 
        phone_number ~* '^\+?[1-9]\d{1,14}$'
    ),
    CONSTRAINT guests_plus_one_email_format CHECK (
        plus_one_email IS NULL OR 
        plus_one_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT guests_plus_one_name_required CHECK (
        NOT plus_one_allowed OR plus_one_name IS NOT NULL
    ),
    CONSTRAINT guests_rsvp_date_required CHECK (
        rsvp_status = 'pending' OR rsvp_date IS NOT NULL
    ),
    CONSTRAINT guests_wedding_party_role_required CHECK (
        NOT is_wedding_party OR wedding_party_role IS NOT NULL
    ),
    CONSTRAINT guests_communication_preference_valid CHECK (
        preferred_communication IN ('email', 'phone', 'sms', 'mail', 'none')
    )
);

-- Guest groups - For organizing guests into groups
CREATE TABLE IF NOT EXISTS guest_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    group_type TEXT DEFAULT 'custom',
    is_auto_group BOOLEAN DEFAULT FALSE,
    auto_criteria JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT guest_groups_name_length CHECK (LENGTH(name) >= 1),
    CONSTRAINT guest_groups_type_valid CHECK (
        group_type IN ('family', 'friends', 'work', 'wedding_party', 'vendors', 'custom')
    )
);

-- Guest group memberships - Many-to-many between guests and groups
CREATE TABLE IF NOT EXISTS guest_group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(guest_id, group_id)
);

-- Guest dietary restrictions - Detailed dietary tracking
CREATE TABLE IF NOT EXISTS guest_dietary_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    dietary_type dietary_type NOT NULL,
    severity dietary_severity DEFAULT 'moderate',
    description TEXT,
    special_instructions TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(guest_id, dietary_type)
);

-- Guest event responses - Responses to specific wedding events
CREATE TABLE IF NOT EXISTS guest_event_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- Reference to timeline event
    event_name TEXT NOT NULL,
    response rsvp_status DEFAULT 'pending',
    response_date TIMESTAMPTZ,
    plus_one_response rsvp_status,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(guest_id, event_id)
);

-- Guest check-in - Track guest arrival and check-in
CREATE TABLE IF NOT EXISTS guest_checkin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'ceremony',
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES users(id),
    plus_one_checked_in BOOLEAN DEFAULT FALSE,
    plus_one_checked_in_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT guest_checkin_event_type_valid CHECK (
        event_type IN ('ceremony', 'reception', 'rehearsal', 'other')
    ),
    CONSTRAINT guest_checkin_times_valid CHECK (
        NOT checked_in OR checked_in_at IS NOT NULL
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone_number);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_guests_table_assignment ON guests(table_assignment);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_party ON guests(is_wedding_party);
CREATE INDEX IF NOT EXISTS idx_guests_plus_one ON guests(plus_one_allowed);
CREATE INDEX IF NOT EXISTS idx_guests_dietary ON guests USING GIN(dietary_requirements);

CREATE INDEX IF NOT EXISTS idx_guest_groups_wedding_id ON guest_groups(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_groups_type ON guest_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_guest_groups_auto ON guest_groups(is_auto_group);

CREATE INDEX IF NOT EXISTS idx_guest_group_memberships_guest_id ON guest_group_memberships(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_group_memberships_group_id ON guest_group_memberships(group_id);

CREATE INDEX IF NOT EXISTS idx_guest_dietary_restrictions_guest_id ON guest_dietary_restrictions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_dietary_restrictions_type ON guest_dietary_restrictions(dietary_type);
CREATE INDEX IF NOT EXISTS idx_guest_dietary_restrictions_severity ON guest_dietary_restrictions(severity);

CREATE INDEX IF NOT EXISTS idx_guest_event_responses_guest_id ON guest_event_responses(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_event_responses_event_id ON guest_event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_event_responses_response ON guest_event_responses(response);

CREATE INDEX IF NOT EXISTS idx_guest_checkin_guest_id ON guest_checkin(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_checkin_event_type ON guest_checkin(event_type);
CREATE INDEX IF NOT EXISTS idx_guest_checkin_status ON guest_checkin(checked_in);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_dietary_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_checkin ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Guests
DROP POLICY IF EXISTS "Couples can manage their wedding guests" ON guests;
CREATE POLICY "Couples can manage their wedding guests" ON guests
    FOR ALL USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Suppliers can view contracted wedding guests" ON guests;
CREATE POLICY "Suppliers can view contracted wedding guests" ON guests
    FOR SELECT USING (
        wedding_id IN (
            SELECT sw.wedding_id FROM supplier_weddings sw
            JOIN supplier_profiles sp ON sw.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- RLS Policies for Guest Groups
DROP POLICY IF EXISTS "Wedding participants can manage guest groups" ON guest_groups;
CREATE POLICY "Wedding participants can manage guest groups" ON guest_groups
    FOR ALL USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- RLS Policies for related tables follow the same pattern as guests
DROP POLICY IF EXISTS "Wedding participants can manage guest group memberships" ON guest_group_memberships;
CREATE POLICY "Wedding participants can manage guest group memberships" ON guest_group_memberships
    FOR ALL USING (
        guest_id IN (
            SELECT g.id FROM guests g
            JOIN weddings w ON g.wedding_id = w.id
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at 
    BEFORE UPDATE ON guests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_groups_updated_at ON guest_groups;
CREATE TRIGGER update_guest_groups_updated_at 
    BEFORE UPDATE ON guest_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_dietary_restrictions_updated_at ON guest_dietary_restrictions;
CREATE TRIGGER update_guest_dietary_restrictions_updated_at 
    BEFORE UPDATE ON guest_dietary_restrictions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_event_responses_updated_at ON guest_event_responses;
CREATE TRIGGER update_guest_event_responses_updated_at 
    BEFORE UPDATE ON guest_event_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE guests IS 'Individual attendee of a wedding';
COMMENT ON COLUMN guests.wedding_id IS 'Reference to the wedding this guest is attending';
COMMENT ON COLUMN guests.relationship IS 'Relationship to the couple (e.g., "bride''s sister")';
COMMENT ON COLUMN guests.rsvp_status IS 'Current RSVP status for this guest';
COMMENT ON COLUMN guests.dietary_requirements IS 'JSONB array of dietary restrictions and requirements';
COMMENT ON COLUMN guests.plus_one_allowed IS 'Whether this guest is allowed to bring a plus one';
COMMENT ON COLUMN guests.table_assignment IS 'Reception table assignment';

COMMENT ON TABLE guest_groups IS 'Groups for organizing guests (family, friends, etc.)';
COMMENT ON TABLE guest_group_memberships IS 'Many-to-many relationship between guests and groups';
COMMENT ON TABLE guest_dietary_restrictions IS 'Detailed dietary restrictions with severity levels';
COMMENT ON TABLE guest_event_responses IS 'RSVP responses to specific wedding events';
COMMENT ON TABLE guest_checkin IS 'Track guest arrival and check-in at events';