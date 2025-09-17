-- Supplier entity schema for WedSync platform
-- Business entity representing wedding service providers
-- This file defines the supplier_profiles table and related supplier data

-- Create custom types for supplier management
DO $$ BEGIN
    CREATE TYPE supplier_specialization AS ENUM (
        'photographer', 'videographer', 'caterer', 'florist', 'venue', 
        'dj', 'band', 'planner', 'decorator', 'transportation', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM (
        'free', 'starter', 'professional', 'scale', 'enterprise'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'unverified', 'pending', 'verified', 'premium', 'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Supplier profiles table
CREATE TABLE IF NOT EXISTS supplier_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    specialization supplier_specialization NOT NULL,
    description TEXT,
    website TEXT,
    logo TEXT,
    
    -- Address information
    street TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Subscription and verification
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    verified_at TIMESTAMPTZ,
    
    -- Business settings and configuration
    settings JSONB DEFAULT '{}',
    business_hours JSONB DEFAULT '{}',
    service_areas TEXT[] DEFAULT '{}',
    pricing_info JSONB DEFAULT '{}',
    
    -- Analytics and performance
    total_weddings INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_time_hours INTEGER DEFAULT 24,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT supplier_profiles_unique_user UNIQUE(user_id),
    CONSTRAINT supplier_profiles_business_name_length CHECK (LENGTH(business_name) >= 2),
    CONSTRAINT supplier_profiles_website_format CHECK (
        website IS NULL OR 
        website ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    ),
    CONSTRAINT supplier_profiles_rating_range CHECK (
        average_rating >= 0.00 AND average_rating <= 5.00
    ),
    CONSTRAINT supplier_profiles_latitude_range CHECK (
        latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
    ),
    CONSTRAINT supplier_profiles_longitude_range CHECK (
        longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
    ),
    CONSTRAINT supplier_profiles_positive_counts CHECK (
        total_weddings >= 0 AND total_reviews >= 0 AND response_time_hours >= 0
    )
);

-- Supplier portfolio items
CREATE TABLE IF NOT EXISTS supplier_portfolio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT,
    wedding_date DATE,
    featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT supplier_portfolio_title_length CHECK (LENGTH(title) >= 1),
    CONSTRAINT supplier_portfolio_image_url_format CHECK (
        image_url ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    )
);

-- Supplier reviews and ratings
CREATE TABLE IF NOT EXISTS supplier_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    title TEXT,
    review_text TEXT,
    response_text TEXT,
    responded_at TIMESTAMPTZ,
    verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT supplier_reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT supplier_reviews_helpful_count_positive CHECK (helpful_count >= 0),
    CONSTRAINT supplier_reviews_unique_wedding_reviewer UNIQUE(supplier_id, wedding_id, reviewer_id)
);

-- Supplier service packages
CREATE TABLE IF NOT EXISTS supplier_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_from DECIMAL(10, 2),
    price_to DECIMAL(10, 2),
    duration_hours INTEGER,
    max_guests INTEGER,
    included_services TEXT[],
    addon_services JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT supplier_packages_name_length CHECK (LENGTH(name) >= 1),
    CONSTRAINT supplier_packages_price_positive CHECK (
        (price_from IS NULL OR price_from >= 0) AND 
        (price_to IS NULL OR price_to >= 0)
    ),
    CONSTRAINT supplier_packages_price_order CHECK (
        price_from IS NULL OR price_to IS NULL OR price_from <= price_to
    ),
    CONSTRAINT supplier_packages_duration_positive CHECK (
        duration_hours IS NULL OR duration_hours > 0
    ),
    CONSTRAINT supplier_packages_guests_positive CHECK (
        max_guests IS NULL OR max_guests > 0
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_specialization ON supplier_profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_subscription_tier ON supplier_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_verification_status ON supplier_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_location ON supplier_profiles(city, state, country);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_rating ON supplier_profiles(average_rating DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_portfolio_supplier_id ON supplier_portfolio(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_portfolio_featured ON supplier_portfolio(featured, sort_order);

CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_wedding_id ON supplier_reviews(wedding_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_reviewer_id ON supplier_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_rating ON supplier_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_supplier_packages_supplier_id ON supplier_packages(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_packages_active ON supplier_packages(is_active);

-- Enable Row Level Security
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Supplier Profiles
DROP POLICY IF EXISTS "Suppliers can view their own profile" ON supplier_profiles;
CREATE POLICY "Suppliers can view their own profile" ON supplier_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can update their own profile" ON supplier_profiles;
CREATE POLICY "Suppliers can update their own profile" ON supplier_profiles
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view verified suppliers" ON supplier_profiles;
CREATE POLICY "Public can view verified suppliers" ON supplier_profiles
    FOR SELECT USING (verification_status IN ('verified', 'premium'));

-- RLS Policies for Supplier Portfolio
DROP POLICY IF EXISTS "Suppliers can manage their portfolio" ON supplier_portfolio;
CREATE POLICY "Suppliers can manage their portfolio" ON supplier_portfolio
    FOR ALL USING (
        supplier_id IN (
            SELECT id FROM supplier_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can view portfolio" ON supplier_portfolio;
CREATE POLICY "Public can view portfolio" ON supplier_portfolio
    FOR SELECT USING (TRUE);

-- RLS Policies for Supplier Reviews
DROP POLICY IF EXISTS "Users can view reviews" ON supplier_reviews;
CREATE POLICY "Users can view reviews" ON supplier_reviews
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create reviews for their weddings" ON supplier_reviews;
CREATE POLICY "Users can create reviews for their weddings" ON supplier_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- RLS Policies for Supplier Packages
DROP POLICY IF EXISTS "Suppliers can manage their packages" ON supplier_packages;
CREATE POLICY "Suppliers can manage their packages" ON supplier_packages
    FOR ALL USING (
        supplier_id IN (
            SELECT id FROM supplier_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can view active packages" ON supplier_packages;
CREATE POLICY "Public can view active packages" ON supplier_packages
    FOR SELECT USING (is_active = TRUE);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_supplier_profiles_updated_at ON supplier_profiles;
CREATE TRIGGER update_supplier_profiles_updated_at 
    BEFORE UPDATE ON supplier_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_portfolio_updated_at ON supplier_portfolio;
CREATE TRIGGER update_supplier_portfolio_updated_at 
    BEFORE UPDATE ON supplier_portfolio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_reviews_updated_at ON supplier_reviews;
CREATE TRIGGER update_supplier_reviews_updated_at 
    BEFORE UPDATE ON supplier_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_packages_updated_at ON supplier_packages;
CREATE TRIGGER update_supplier_packages_updated_at 
    BEFORE UPDATE ON supplier_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE supplier_profiles IS 'Business entity representing wedding service providers';
COMMENT ON COLUMN supplier_profiles.business_name IS 'Public business name';
COMMENT ON COLUMN supplier_profiles.specialization IS 'Type of wedding service provided';
COMMENT ON COLUMN supplier_profiles.subscription_tier IS 'Current subscription level';
COMMENT ON COLUMN supplier_profiles.verification_status IS 'Business verification status';
COMMENT ON COLUMN supplier_profiles.settings IS 'JSONB object storing supplier preferences';

COMMENT ON TABLE supplier_portfolio IS 'Portfolio items showcasing supplier work';
COMMENT ON TABLE supplier_reviews IS 'Customer reviews and ratings for suppliers';
COMMENT ON TABLE supplier_packages IS 'Service packages offered by suppliers';