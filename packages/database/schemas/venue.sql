-- Venue entity schema for WedSync platform
-- Wedding venue entity for ceremony and reception locations
-- This file defines venues and venue-related data structures

-- Create custom types for venue management
DO $$ BEGIN
    CREATE TYPE venue_type AS ENUM (
        'ceremony', 'reception', 'both', 'rehearsal', 'accommodation', 'photo_location'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE venue_style AS ENUM (
        'indoor', 'outdoor', 'semi_outdoor', 'garden', 'beach', 'church', 
        'ballroom', 'barn', 'vineyard', 'historic', 'modern', 'rustic', 'elegant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM (
        'available', 'booked', 'tentative', 'unavailable', 'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Venues table - Main venue information
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic venue information
    name TEXT NOT NULL,
    venue_type venue_type NOT NULL,
    venue_style venue_style,
    description TEXT,
    website TEXT,
    
    -- Address and location
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Contact information
    contact_info JSONB DEFAULT '{}',
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    booking_email TEXT,
    booking_phone TEXT,
    
    -- Capacity and specifications
    capacity_max INTEGER,
    capacity_preferred INTEGER,
    indoor_capacity INTEGER,
    outdoor_capacity INTEGER,
    ceremony_capacity INTEGER,
    reception_capacity INTEGER,
    
    -- Venue features and amenities
    amenities TEXT[] DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    alcohol_policy TEXT,
    music_restrictions TEXT,
    decoration_restrictions TEXT,
    vendor_restrictions TEXT,
    
    -- Accessibility and special features
    accessibility_features TEXT[] DEFAULT '{}',
    parking_info JSONB DEFAULT '{}',
    public_transport_info TEXT,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    hearing_loop BOOLEAN DEFAULT FALSE,
    
    -- Weather and contingency
    weather_contingency JSONB DEFAULT '{}',
    backup_indoor_option BOOLEAN DEFAULT FALSE,
    climate_controlled BOOLEAN DEFAULT FALSE,
    
    -- Vendor and logistics information
    preferred_vendors JSONB DEFAULT '[]',
    required_vendors JSONB DEFAULT '[]',
    load_in_instructions TEXT,
    load_out_instructions TEXT,
    vendor_arrival_times JSONB DEFAULT '{}',
    security_requirements TEXT,
    
    -- Pricing and packages
    base_price DECIMAL(10, 2),
    price_per_person DECIMAL(8, 2),
    minimum_spend DECIMAL(10, 2),
    additional_fees JSONB DEFAULT '{}',
    payment_terms TEXT,
    cancellation_policy TEXT,
    
    -- Availability and booking
    booking_lead_time_days INTEGER DEFAULT 30,
    minimum_event_duration INTEGER DEFAULT 4, -- hours
    maximum_event_duration INTEGER DEFAULT 12, -- hours
    setup_time_required INTEGER DEFAULT 2, -- hours
    breakdown_time_required INTEGER DEFAULT 2, -- hours
    
    -- Media and presentation
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    virtual_tour_url TEXT,
    floor_plans JSONB DEFAULT '[]',
    
    -- Administrative
    license_number TEXT,
    insurance_info JSONB DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    last_inspection_date DATE,
    health_department_rating TEXT,
    
    -- Platform integration
    supplier_id UUID REFERENCES supplier_profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    listing_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT venues_name_length CHECK (LENGTH(name) >= 2),
    CONSTRAINT venues_capacities_positive CHECK (
        (capacity_max IS NULL OR capacity_max > 0) AND
        (capacity_preferred IS NULL OR capacity_preferred > 0) AND
        (indoor_capacity IS NULL OR indoor_capacity >= 0) AND
        (outdoor_capacity IS NULL OR outdoor_capacity >= 0)
    ),
    CONSTRAINT venues_capacity_logic CHECK (
        capacity_preferred IS NULL OR capacity_max IS NULL OR 
        capacity_preferred <= capacity_max
    ),
    CONSTRAINT venues_pricing_positive CHECK (
        (base_price IS NULL OR base_price >= 0) AND
        (price_per_person IS NULL OR price_per_person >= 0) AND
        (minimum_spend IS NULL OR minimum_spend >= 0)
    ),
    CONSTRAINT venues_timing_positive CHECK (
        booking_lead_time_days >= 0 AND
        minimum_event_duration > 0 AND
        maximum_event_duration > 0 AND
        setup_time_required >= 0 AND
        breakdown_time_required >= 0
    ),
    CONSTRAINT venues_email_format CHECK (
        (primary_contact_email IS NULL OR 
         primary_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
        (booking_email IS NULL OR 
         booking_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
    ),
    CONSTRAINT venues_website_format CHECK (
        website IS NULL OR 
        website ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    ),
    CONSTRAINT venues_latitude_range CHECK (
        latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
    ),
    CONSTRAINT venues_longitude_range CHECK (
        longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
    )
);

-- Venue availability calendar
CREATE TABLE IF NOT EXISTS venue_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status availability_status DEFAULT 'available',
    time_slots JSONB DEFAULT '[]',
    price_override DECIMAL(10, 2),
    notes TEXT,
    blocked_reason TEXT,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(venue_id, date),
    CONSTRAINT venue_availability_price_positive CHECK (
        price_override IS NULL OR price_override >= 0
    ),
    CONSTRAINT venue_availability_blocked_reason_required CHECK (
        status != 'blocked' OR blocked_reason IS NOT NULL
    )
);

-- Venue reviews and ratings
CREATE TABLE IF NOT EXISTS venue_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rating breakdown
    overall_rating INTEGER NOT NULL,
    service_rating INTEGER,
    value_rating INTEGER,
    food_rating INTEGER,
    ambiance_rating INTEGER,
    cleanliness_rating INTEGER,
    
    -- Review content
    title TEXT,
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    
    -- Event details
    event_date DATE,
    guest_count INTEGER,
    event_type TEXT DEFAULT 'wedding',
    
    -- Response and moderation
    response_text TEXT,
    response_date TIMESTAMPTZ,
    verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    
    -- Media
    photos JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT venue_reviews_ratings_range CHECK (
        overall_rating >= 1 AND overall_rating <= 5 AND
        (service_rating IS NULL OR (service_rating >= 1 AND service_rating <= 5)) AND
        (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 5)) AND
        (food_rating IS NULL OR (food_rating >= 1 AND food_rating <= 5)) AND
        (ambiance_rating IS NULL OR (ambiance_rating >= 1 AND ambiance_rating <= 5)) AND
        (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5))
    ),
    CONSTRAINT venue_reviews_guest_count_positive CHECK (
        guest_count IS NULL OR guest_count > 0
    ),
    CONSTRAINT venue_reviews_helpful_count_positive CHECK (helpful_count >= 0),
    CONSTRAINT venue_reviews_unique_wedding_reviewer UNIQUE(venue_id, wedding_id, reviewer_id)
);

-- Venue inquiries and bookings
CREATE TABLE IF NOT EXISTS venue_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    inquirer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event details
    event_date DATE NOT NULL,
    guest_count INTEGER,
    event_type TEXT DEFAULT 'wedding',
    event_duration_hours INTEGER,
    
    -- Inquiry details
    message TEXT,
    special_requirements TEXT,
    budget_range JSONB,
    preferred_packages TEXT[],
    
    -- Status and communication
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    response_deadline TIMESTAMPTZ,
    
    -- Supplier response
    response_text TEXT,
    response_date TIMESTAMPTZ,
    quote_amount DECIMAL(10, 2),
    quote_valid_until DATE,
    proposal_document_url TEXT,
    
    -- Booking progression
    site_visit_requested BOOLEAN DEFAULT FALSE,
    site_visit_scheduled_at TIMESTAMPTZ,
    contract_sent BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    deposit_paid BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT venue_inquiries_guest_count_positive CHECK (
        guest_count IS NULL OR guest_count > 0
    ),
    CONSTRAINT venue_inquiries_duration_positive CHECK (
        event_duration_hours IS NULL OR event_duration_hours > 0
    ),
    CONSTRAINT venue_inquiries_quote_positive CHECK (
        quote_amount IS NULL OR quote_amount >= 0
    ),
    CONSTRAINT venue_inquiries_status_valid CHECK (
        status IN ('pending', 'responded', 'quoted', 'booked', 'declined', 'expired')
    ),
    CONSTRAINT venue_inquiries_priority_valid CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(city, state, country);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_style ON venues(venue_style);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON venues(capacity_max);
CREATE INDEX IF NOT EXISTS idx_venues_supplier_id ON venues(supplier_id);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(listing_active);
CREATE INDEX IF NOT EXISTS idx_venues_verified ON venues(is_verified);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(featured);

CREATE INDEX IF NOT EXISTS idx_venue_availability_venue_id ON venue_availability(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_availability_date ON venue_availability(date);
CREATE INDEX IF NOT EXISTS idx_venue_availability_status ON venue_availability(status);
CREATE INDEX IF NOT EXISTS idx_venue_availability_wedding_id ON venue_availability(wedding_id);

CREATE INDEX IF NOT EXISTS idx_venue_reviews_venue_id ON venue_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_wedding_id ON venue_reviews(wedding_id);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_reviewer_id ON venue_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_rating ON venue_reviews(overall_rating DESC);

CREATE INDEX IF NOT EXISTS idx_venue_inquiries_venue_id ON venue_inquiries(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_inquiries_wedding_id ON venue_inquiries(wedding_id);
CREATE INDEX IF NOT EXISTS idx_venue_inquiries_inquirer_id ON venue_inquiries(inquirer_id);
CREATE INDEX IF NOT EXISTS idx_venue_inquiries_event_date ON venue_inquiries(event_date);
CREATE INDEX IF NOT EXISTS idx_venue_inquiries_status ON venue_inquiries(status);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Venues
DROP POLICY IF EXISTS "Public can view active venues" ON venues;
CREATE POLICY "Public can view active venues" ON venues
    FOR SELECT USING (listing_active = TRUE);

DROP POLICY IF EXISTS "Venue owners can manage their venues" ON venues;
CREATE POLICY "Venue owners can manage their venues" ON venues
    FOR ALL USING (
        supplier_id IN (
            SELECT id FROM supplier_profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for Venue Availability
DROP POLICY IF EXISTS "Public can view venue availability" ON venue_availability;
CREATE POLICY "Public can view venue availability" ON venue_availability
    FOR SELECT USING (
        venue_id IN (
            SELECT id FROM venues WHERE listing_active = TRUE
        )
    );

DROP POLICY IF EXISTS "Venue owners can manage availability" ON venue_availability;
CREATE POLICY "Venue owners can manage availability" ON venue_availability
    FOR ALL USING (
        venue_id IN (
            SELECT v.id FROM venues v
            JOIN supplier_profiles sp ON v.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- RLS Policies for Venue Reviews
DROP POLICY IF EXISTS "Public can view venue reviews" ON venue_reviews;
CREATE POLICY "Public can view venue reviews" ON venue_reviews
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create reviews for their weddings" ON venue_reviews;
CREATE POLICY "Users can create reviews for their weddings" ON venue_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- RLS Policies for Venue Inquiries
DROP POLICY IF EXISTS "Users can manage their venue inquiries" ON venue_inquiries;
CREATE POLICY "Users can manage their venue inquiries" ON venue_inquiries
    FOR ALL USING (
        inquirer_id = auth.uid() OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        venue_id IN (
            SELECT v.id FROM venues v
            JOIN supplier_profiles sp ON v.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at 
    BEFORE UPDATE ON venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_availability_updated_at ON venue_availability;
CREATE TRIGGER update_venue_availability_updated_at 
    BEFORE UPDATE ON venue_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_reviews_updated_at ON venue_reviews;
CREATE TRIGGER update_venue_reviews_updated_at 
    BEFORE UPDATE ON venue_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_inquiries_updated_at ON venue_inquiries;
CREATE TRIGGER update_venue_inquiries_updated_at 
    BEFORE UPDATE ON venue_inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE venues IS 'Wedding venue entity for ceremony and reception locations';
COMMENT ON COLUMN venues.venue_type IS 'Type of venue: ceremony, reception, both, etc.';
COMMENT ON COLUMN venues.capacity_max IS 'Maximum guest capacity for the venue';
COMMENT ON COLUMN venues.contact_info IS 'JSONB object containing contact details';
COMMENT ON COLUMN venues.amenities IS 'Array of available amenities';
COMMENT ON COLUMN venues.restrictions IS 'JSONB object containing venue restrictions';

COMMENT ON TABLE venue_availability IS 'Availability calendar for venues';
COMMENT ON TABLE venue_reviews IS 'Customer reviews and ratings for venues';
COMMENT ON TABLE venue_inquiries IS 'Inquiries and booking requests for venues';