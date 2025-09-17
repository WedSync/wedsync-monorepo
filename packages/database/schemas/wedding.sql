-- Wedding entity schema for WedSync platform
-- Central entity representing a wedding event
-- This file defines the weddings table and related wedding data

-- Create custom types for wedding management
DO $$ BEGIN
    CREATE TYPE wedding_status AS ENUM (
        'planning', 'confirmed', 'in_progress', 'completed', 'cancelled', 'postponed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM (
        'planned', 'confirmed', 'in_progress', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM (
        'inquiry', 'proposal', 'negotiating', 'contracted', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Weddings table - Central entity for wedding events
CREATE TABLE IF NOT EXISTS weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES couple_profiles(id) ON DELETE CASCADE,
    
    -- Basic wedding information
    title TEXT,
    wedding_date DATE NOT NULL,
    ceremony_venue JSONB,
    reception_venue JSONB,
    
    -- Guest and budget information
    guest_count_estimated INTEGER DEFAULT 0,
    guest_count_confirmed INTEGER DEFAULT 0,
    budget_total DECIMAL(12, 2),
    budget_allocated DECIMAL(12, 2) DEFAULT 0.00,
    budget_spent DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Wedding details
    theme TEXT,
    color_scheme TEXT[],
    dress_code TEXT,
    wedding_style TEXT,
    cultural_traditions TEXT[],
    
    -- Status and timeline
    status wedding_status NOT NULL DEFAULT 'planning',
    timeline JSONB DEFAULT '[]',
    checklist JSONB DEFAULT '[]',
    
    -- Completion tracking
    core_details_complete BOOLEAN DEFAULT FALSE,
    venue_booked BOOLEAN DEFAULT FALSE,
    vendors_booked BOOLEAN DEFAULT FALSE,
    invitations_sent BOOLEAN DEFAULT FALSE,
    
    -- Emergency and special requirements
    emergency_contacts JSONB DEFAULT '[]',
    special_requirements TEXT,
    accessibility_needs TEXT,
    dietary_restrictions_summary JSONB DEFAULT '{}',
    
    -- Settings and preferences
    settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT weddings_guest_count_valid CHECK (
        guest_count_estimated >= 0 AND 
        guest_count_confirmed >= 0 AND 
        guest_count_confirmed <= guest_count_estimated
    ),
    CONSTRAINT weddings_budget_valid CHECK (
        (budget_total IS NULL OR budget_total >= 0) AND
        budget_allocated >= 0 AND
        budget_spent >= 0 AND
        (budget_total IS NULL OR budget_allocated <= budget_total) AND
        budget_spent <= COALESCE(budget_total, budget_spent)
    ),
    CONSTRAINT weddings_title_length CHECK (
        title IS NULL OR LENGTH(title) >= 1
    )
);

-- Wedding timelines - Detailed timeline management
CREATE TABLE IF NOT EXISTS wedding_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main Timeline',
    description TEXT,
    events JSONB DEFAULT '[]',
    is_primary BOOLEAN DEFAULT TRUE,
    is_day_of_timeline BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wedding_timelines_name_length CHECK (LENGTH(name) >= 1)
);

-- Supplier wedding relationships - Many-to-many between suppliers and weddings
CREATE TABLE IF NOT EXISTS supplier_weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    
    -- Service details
    service_type TEXT NOT NULL,
    service_description TEXT,
    contract_status contract_status DEFAULT 'inquiry',
    contract_value DECIMAL(10, 2),
    deposit_amount DECIMAL(10, 2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    final_payment_due DATE,
    
    -- Timeline and scheduling
    booking_confirmed_at TIMESTAMPTZ,
    service_date DATE,
    service_start_time TIME,
    service_end_time TIME,
    setup_time TIME,
    breakdown_time TIME,
    
    -- Collaboration and performance
    timeline_items JSONB DEFAULT '[]',
    shared_documents JSONB DEFAULT '[]',
    collaboration_score INTEGER DEFAULT 0,
    communication_frequency TEXT DEFAULT 'weekly',
    
    -- Notes and requirements
    special_requirements TEXT,
    vendor_notes TEXT,
    couple_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(supplier_id, wedding_id, service_type),
    CONSTRAINT supplier_weddings_service_type_length CHECK (LENGTH(service_type) >= 1),
    CONSTRAINT supplier_weddings_amounts_positive CHECK (
        (contract_value IS NULL OR contract_value >= 0) AND
        (deposit_amount IS NULL OR deposit_amount >= 0)
    ),
    CONSTRAINT supplier_weddings_deposit_valid CHECK (
        deposit_amount IS NULL OR contract_value IS NULL OR 
        deposit_amount <= contract_value
    ),
    CONSTRAINT supplier_weddings_time_order CHECK (
        service_start_time IS NULL OR service_end_time IS NULL OR 
        service_start_time <= service_end_time
    ),
    CONSTRAINT supplier_weddings_collaboration_score_range CHECK (
        collaboration_score >= 0 AND collaboration_score <= 100
    )
);

-- Wedding documents - File storage and sharing
CREATE TABLE IF NOT EXISTS wedding_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File information
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Document categorization
    document_type TEXT DEFAULT 'other',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    
    -- Sharing and permissions
    is_shared_with_couple BOOLEAN DEFAULT FALSE,
    is_shared_with_suppliers BOOLEAN DEFAULT FALSE,
    access_permissions JSONB DEFAULT '{}',
    
    -- Version control
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES wedding_documents(id),
    is_current_version BOOLEAN DEFAULT TRUE,
    
    -- Legal and signatures
    signature_required BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wedding_documents_filename_length CHECK (LENGTH(filename) >= 1),
    CONSTRAINT wedding_documents_file_size_positive CHECK (file_size > 0),
    CONSTRAINT wedding_documents_version_positive CHECK (version > 0)
);

-- Wedding tasks - Task management for wedding planning
CREATE TABLE IF NOT EXISTS wedding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    
    -- Timeline and deadlines
    due_date DATE,
    estimated_duration INTEGER, -- in minutes
    is_day_of_task BOOLEAN DEFAULT FALSE,
    is_milestone BOOLEAN DEFAULT FALSE,
    
    -- Location and requirements
    location TEXT,
    requirements TEXT,
    dependencies UUID[] DEFAULT '{}',
    
    -- Completion tracking
    progress_percentage INTEGER DEFAULT 0,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wedding_tasks_title_length CHECK (LENGTH(title) >= 1),
    CONSTRAINT wedding_tasks_progress_range CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    CONSTRAINT wedding_tasks_duration_positive CHECK (
        estimated_duration IS NULL OR estimated_duration > 0
    ),
    CONSTRAINT wedding_tasks_priority_valid CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    CONSTRAINT wedding_tasks_status_valid CHECK (
        status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weddings_couple_id ON weddings(couple_id);
CREATE INDEX IF NOT EXISTS idx_weddings_date ON weddings(wedding_date);
CREATE INDEX IF NOT EXISTS idx_weddings_status ON weddings(status);
CREATE INDEX IF NOT EXISTS idx_weddings_core_details ON weddings(core_details_complete);

CREATE INDEX IF NOT EXISTS idx_wedding_timelines_wedding_id ON wedding_timelines(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_timelines_primary ON wedding_timelines(is_primary);

CREATE INDEX IF NOT EXISTS idx_supplier_weddings_supplier_id ON supplier_weddings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_weddings_wedding_id ON supplier_weddings(wedding_id);
CREATE INDEX IF NOT EXISTS idx_supplier_weddings_contract_status ON supplier_weddings(contract_status);
CREATE INDEX IF NOT EXISTS idx_supplier_weddings_service_date ON supplier_weddings(service_date);

CREATE INDEX IF NOT EXISTS idx_wedding_documents_wedding_id ON wedding_documents(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_documents_uploaded_by ON wedding_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_wedding_documents_type ON wedding_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_wedding_documents_current ON wedding_documents(is_current_version);

CREATE INDEX IF NOT EXISTS idx_wedding_tasks_wedding_id ON wedding_tasks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_assigned_to ON wedding_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_due_date ON wedding_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_status ON wedding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_day_of ON wedding_tasks(is_day_of_task);

-- Enable Row Level Security
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Weddings
DROP POLICY IF EXISTS "Couples can access their weddings" ON weddings;
CREATE POLICY "Couples can access their weddings" ON weddings
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couple_profiles 
            WHERE partner_one_id = auth.uid() OR partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Suppliers can view their contracted weddings" ON weddings;
CREATE POLICY "Suppliers can view their contracted weddings" ON weddings
    FOR SELECT USING (
        id IN (
            SELECT sw.wedding_id FROM supplier_weddings sw
            JOIN supplier_profiles sp ON sw.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- RLS Policies for Wedding Timelines
DROP POLICY IF EXISTS "Wedding participants can access timelines" ON wedding_timelines;
CREATE POLICY "Wedding participants can access timelines" ON wedding_timelines
    FOR ALL USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        wedding_id IN (
            SELECT sw.wedding_id FROM supplier_weddings sw
            JOIN supplier_profiles sp ON sw.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- RLS Policies for Supplier Weddings
DROP POLICY IF EXISTS "Suppliers can manage their wedding relationships" ON supplier_weddings;
CREATE POLICY "Suppliers can manage their wedding relationships" ON supplier_weddings
    FOR ALL USING (
        supplier_id IN (
            SELECT id FROM supplier_profiles WHERE user_id = auth.uid()
        ) OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_weddings_updated_at ON weddings;
CREATE TRIGGER update_weddings_updated_at 
    BEFORE UPDATE ON weddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wedding_timelines_updated_at ON wedding_timelines;
CREATE TRIGGER update_wedding_timelines_updated_at 
    BEFORE UPDATE ON wedding_timelines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_weddings_updated_at ON supplier_weddings;
CREATE TRIGGER update_supplier_weddings_updated_at 
    BEFORE UPDATE ON supplier_weddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wedding_documents_updated_at ON wedding_documents;
CREATE TRIGGER update_wedding_documents_updated_at 
    BEFORE UPDATE ON wedding_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wedding_tasks_updated_at ON wedding_tasks;
CREATE TRIGGER update_wedding_tasks_updated_at 
    BEFORE UPDATE ON wedding_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE weddings IS 'Central entity representing a wedding event';
COMMENT ON COLUMN weddings.couple_id IS 'Reference to the couple planning this wedding';
COMMENT ON COLUMN weddings.wedding_date IS 'Date of the ceremony';
COMMENT ON COLUMN weddings.ceremony_venue IS 'JSONB object containing ceremony venue details';
COMMENT ON COLUMN weddings.reception_venue IS 'JSONB object containing reception venue details';
COMMENT ON COLUMN weddings.timeline IS 'JSONB array of timeline events';

COMMENT ON TABLE wedding_timelines IS 'Detailed timeline management for weddings';
COMMENT ON TABLE supplier_weddings IS 'Many-to-many relationship between suppliers and weddings';
COMMENT ON TABLE wedding_documents IS 'File storage and sharing for wedding-related documents';
COMMENT ON TABLE wedding_tasks IS 'Task management for wedding planning';