-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'supplier', 'couple', 'guest');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'scale', 'enterprise');
CREATE TYPE supplier_specialization AS ENUM ('photographer', 'videographer', 'caterer', 'florist', 'venue', 'dj', 'band', 'planner', 'decorator', 'transportation', 'other');
CREATE TYPE wedding_status AS ENUM ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE event_status AS ENUM ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined', 'maybe');
CREATE TYPE dietary_type AS ENUM ('vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy', 'shellfish_allergy', 'kosher', 'halal', 'keto', 'other');
CREATE TYPE dietary_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE form_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE field_type AS ENUM ('text', 'textarea', 'email', 'phone', 'number', 'date', 'time', 'datetime', 'select', 'multiselect', 'radio', 'checkbox', 'file', 'image', 'address', 'photogroup', 'musiclist', 'dietarymatrix', 'signature');
CREATE TYPE submission_status AS ENUM ('draft', 'completed', 'archived');
CREATE TYPE journey_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE node_type AS ENUM ('email', 'sms', 'whatsapp', 'form', 'meeting', 'wait', 'condition', 'webhook', 'tag', 'end');
CREATE TYPE execution_status AS ENUM ('running', 'completed', 'failed', 'paused', 'cancelled');
CREATE TYPE message_type AS ENUM ('email', 'sms', 'whatsapp', 'internal');
CREATE TYPE message_status AS ENUM ('draft', 'scheduled', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'bounced', 'spam');
CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE message_source AS ENUM ('manual', 'journey', 'campaign', 'system', 'api');
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'archived', 'spam');
CREATE TYPE template_category AS ENUM ('welcome', 'follow_up', 'reminder', 'confirmation', 'thank_you', 'promotional', 'informational', 'emergency', 'other');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'couple',
    status user_status NOT NULL DEFAULT 'pending',
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier profiles
CREATE TABLE supplier_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    specialization supplier_specialization NOT NULL,
    description TEXT,
    website TEXT,
    logo TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couple profiles
CREATE TABLE couple_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_status TEXT NOT NULL DEFAULT 'engaged',
    shared_email TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partner_one_id, partner_two_id)
);

-- Weddings table
CREATE TABLE weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
    wedding_date DATE NOT NULL,
    ceremony_venue JSONB,
    reception_venue JSONB,
    guest_count INTEGER NOT NULL DEFAULT 0,
    estimated_budget DECIMAL(12, 2),
    actual_budget DECIMAL(12, 2),
    theme TEXT,
    color_scheme TEXT[],
    status wedding_status NOT NULL DEFAULT 'planning',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wedding timelines
CREATE TABLE wedding_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    events JSONB DEFAULT '[]',
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    address JSONB,
    relationship TEXT,
    is_child BOOLEAN DEFAULT FALSE,
    dietary_requirements JSONB DEFAULT '[]',
    rsvp_status rsvp_status DEFAULT 'pending',
    rsvp_date TIMESTAMPTZ,
    plus_one_allowed BOOLEAN DEFAULT FALSE,
    plus_one_details JSONB,
    photo_group TEXT,
    table_assignment TEXT,
    notes TEXT,
    invitation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms table
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    status form_status DEFAULT 'draft',
    fields JSONB DEFAULT '[]',
    logic JSONB DEFAULT '[]',
    branding JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form submissions
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    respondent_email TEXT,
    responses JSONB DEFAULT '[]',
    status submission_status DEFAULT 'draft',
    completed_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journeys table
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status journey_status DEFAULT 'draft',
    trigger JSONB NOT NULL,
    nodes JSONB DEFAULT '[]',
    connections JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey executions
CREATE TABLE journey_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    status execution_status DEFAULT 'running',
    current_node_id UUID,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_executions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX idx_supplier_profiles_specialization ON supplier_profiles(specialization);
CREATE INDEX idx_couple_profiles_partner_one ON couple_profiles(partner_one_id);
CREATE INDEX idx_couple_profiles_partner_two ON couple_profiles(partner_two_id);
CREATE INDEX idx_weddings_couple_id ON weddings(couple_id);
CREATE INDEX idx_weddings_date ON weddings(wedding_date);
CREATE INDEX idx_wedding_timelines_wedding_id ON wedding_timelines(wedding_id);
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX idx_forms_supplier_id ON forms(supplier_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_wedding_id ON form_submissions(wedding_id);
CREATE INDEX idx_journeys_supplier_id ON journeys(supplier_id);
CREATE INDEX idx_journey_executions_journey_id ON journey_executions(journey_id);
CREATE INDEX idx_journey_executions_contact_id ON journey_executions(contact_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_profiles_updated_at BEFORE UPDATE ON supplier_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_couple_profiles_updated_at BEFORE UPDATE ON couple_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weddings_updated_at BEFORE UPDATE ON weddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wedding_timelines_updated_at BEFORE UPDATE ON wedding_timelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_submissions_updated_at BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journey_executions_updated_at BEFORE UPDATE ON journey_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();