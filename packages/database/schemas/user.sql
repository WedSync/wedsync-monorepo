-- User entity schema for WedSync platform
-- Primary authentication entity for all platform users
-- This file defines the users table and related user profile tables

-- Create custom types for user management
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'supplier', 'couple', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table - Primary authentication entity
CREATE TABLE IF NOT EXISTS users (
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_format CHECK (phone_number IS NULL OR phone_number ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT users_name_length CHECK (LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1)
);

-- Couple profiles - Links two users as a couple
CREATE TABLE IF NOT EXISTS couple_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_status TEXT NOT NULL DEFAULT 'engaged',
    shared_email TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(partner_one_id, partner_two_id),
    CONSTRAINT couple_profiles_different_partners CHECK (partner_one_id != partner_two_id),
    CONSTRAINT couple_profiles_shared_email_format CHECK (
        shared_email IS NULL OR 
        shared_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE INDEX IF NOT EXISTS idx_couple_profiles_partner_one ON couple_profiles(partner_one_id);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_partner_two ON couple_profiles(partner_two_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for Couple Profiles
DROP POLICY IF EXISTS "Couples can view their own profile" ON couple_profiles;
CREATE POLICY "Couples can view their own profile" ON couple_profiles
    FOR SELECT USING (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id
    );

DROP POLICY IF EXISTS "Couples can update their own profile" ON couple_profiles;
CREATE POLICY "Couples can update their own profile" ON couple_profiles
    FOR UPDATE USING (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id
    );

DROP POLICY IF EXISTS "Users can create couple profiles" ON couple_profiles;
CREATE POLICY "Users can create couple profiles" ON couple_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id
    );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_couple_profiles_updated_at ON couple_profiles;
CREATE TRIGGER update_couple_profiles_updated_at 
    BEFORE UPDATE ON couple_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Primary authentication entity for all platform users';
COMMENT ON COLUMN users.id IS 'Primary key, references Supabase auth.users';
COMMENT ON COLUMN users.email IS 'User email address, must be unique';
COMMENT ON COLUMN users.role IS 'User type: admin, supplier, couple, or guest';
COMMENT ON COLUMN users.status IS 'Account status: active, inactive, suspended, or pending';

COMMENT ON TABLE couple_profiles IS 'Links two users as a couple for wedding planning';
COMMENT ON COLUMN couple_profiles.partner_one_id IS 'First partner in the couple';
COMMENT ON COLUMN couple_profiles.partner_two_id IS 'Second partner in the couple';
COMMENT ON COLUMN couple_profiles.preferences IS 'JSONB object storing couple preferences';