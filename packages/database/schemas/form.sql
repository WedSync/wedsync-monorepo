-- Form entity schema for WedSync platform
-- Customizable data collection forms created by suppliers
-- This file defines forms, form submissions, and related form management data

-- Create custom types for form management
DO $$ BEGIN
    CREATE TYPE form_status AS ENUM (
        'draft', 'published', 'archived', 'template'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE field_type AS ENUM (
        'text', 'textarea', 'email', 'phone', 'number', 'date', 'time', 'datetime',
        'select', 'multiselect', 'radio', 'checkbox', 'file', 'image', 'address',
        'photogroup', 'musiclist', 'dietarymatrix', 'signature', 'rating', 'slider'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM (
        'draft', 'completed', 'archived', 'reviewed', 'approved', 'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE validation_type AS ENUM (
        'required', 'min_length', 'max_length', 'pattern', 'min_value', 'max_value',
        'file_size', 'file_type', 'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Forms table - Customizable data collection forms
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    
    -- Form metadata
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    status form_status DEFAULT 'draft',
    
    -- Form structure and logic
    fields JSONB DEFAULT '[]',
    conditional_logic JSONB DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    
    -- Form behavior
    allow_multiple_submissions BOOLEAN DEFAULT FALSE,
    require_authentication BOOLEAN DEFAULT FALSE,
    collect_ip_address BOOLEAN DEFAULT TRUE,
    auto_save_drafts BOOLEAN DEFAULT TRUE,
    submission_limit INTEGER,
    submission_deadline TIMESTAMPTZ,
    
    -- Form appearance and branding
    branding JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{}',
    custom_css TEXT,
    
    -- Form settings and notifications
    settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    confirmation_message TEXT,
    redirect_url TEXT,
    
    -- AI and automation
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT,
    ai_model_version TEXT,
    auto_categorize_responses BOOLEAN DEFAULT FALSE,
    
    -- Analytics and performance
    analytics JSONB DEFAULT '{}',
    submission_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0.00,
    average_completion_time INTEGER DEFAULT 0, -- seconds
    
    -- Template and sharing
    is_template BOOLEAN DEFAULT FALSE,
    is_public_template BOOLEAN DEFAULT FALSE,
    template_category TEXT,
    shared_with TEXT[] DEFAULT '{}',
    
    -- SEO and discovery
    slug TEXT,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Access control
    password_protected BOOLEAN DEFAULT FALSE,
    access_password TEXT,
    allowed_domains TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_submission_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT forms_name_length CHECK (LENGTH(name) >= 1),
    CONSTRAINT forms_version_positive CHECK (version > 0),
    CONSTRAINT forms_submission_limit_positive CHECK (
        submission_limit IS NULL OR submission_limit > 0
    ),
    CONSTRAINT forms_completion_rate_range CHECK (
        completion_rate >= 0.00 AND completion_rate <= 100.00
    ),
    CONSTRAINT forms_average_completion_time_positive CHECK (
        average_completion_time >= 0
    ),
    CONSTRAINT forms_slug_format CHECK (
        slug IS NULL OR slug ~* '^[a-z0-9-]+$'
    ),
    CONSTRAINT forms_redirect_url_format CHECK (
        redirect_url IS NULL OR 
        redirect_url ~* '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    )
);

-- Form submissions - Responses to supplier forms
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    wedding_id UUID REFERENCES weddings(id) ON DELETE SET NULL,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Submission identification
    submission_token TEXT UNIQUE,
    respondent_email TEXT,
    respondent_name TEXT,
    respondent_ip INET,
    user_agent TEXT,
    
    -- Form responses
    responses JSONB DEFAULT '{}',
    file_attachments JSONB DEFAULT '[]',
    calculated_fields JSONB DEFAULT '{}',
    
    -- Submission metadata
    status submission_status DEFAULT 'draft',
    submission_source TEXT DEFAULT 'web',
    language TEXT DEFAULT 'en',
    
    -- Progress and timing
    progress_percentage INTEGER DEFAULT 0,
    time_to_complete INTEGER, -- seconds
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_saved_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Review and processing
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    approval_status TEXT,
    approval_date TIMESTAMPTZ,
    
    -- Follow-up and communication
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    follow_up_date DATE,
    thank_you_sent BOOLEAN DEFAULT FALSE,
    thank_you_sent_at TIMESTAMPTZ,
    
    -- Quality and validation
    validation_errors JSONB DEFAULT '[]',
    spam_score DECIMAL(3, 2) DEFAULT 0.00,
    quality_score DECIMAL(3, 2),
    is_test_submission BOOLEAN DEFAULT FALSE,
    
    -- Analytics and scoring
    engagement_score INTEGER DEFAULT 0,
    response_quality JSONB DEFAULT '{}',
    conversion_value DECIMAL(10, 2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT form_submissions_progress_range CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    CONSTRAINT form_submissions_time_positive CHECK (
        time_to_complete IS NULL OR time_to_complete >= 0
    ),
    CONSTRAINT form_submissions_spam_score_range CHECK (
        spam_score >= 0.00 AND spam_score <= 1.00
    ),
    CONSTRAINT form_submissions_quality_score_range CHECK (
        quality_score IS NULL OR (quality_score >= 0.00 AND quality_score <= 1.00)
    ),
    CONSTRAINT form_submissions_engagement_score_range CHECK (
        engagement_score >= 0 AND engagement_score <= 100
    ),
    CONSTRAINT form_submissions_conversion_value_positive CHECK (
        conversion_value IS NULL OR conversion_value >= 0
    ),
    CONSTRAINT form_submissions_email_format CHECK (
        respondent_email IS NULL OR 
        respondent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Form fields - Detailed field definitions
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Field identification
    field_key TEXT NOT NULL,
    field_type field_type NOT NULL,
    
    -- Field display
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    help_text TEXT,
    
    -- Field behavior
    required BOOLEAN DEFAULT FALSE,
    readonly BOOLEAN DEFAULT FALSE,
    hidden BOOLEAN DEFAULT FALSE,
    
    -- Field options and configuration
    options JSONB DEFAULT '[]',
    default_value TEXT,
    validation JSONB DEFAULT '{}',
    
    -- Field layout and styling
    sort_order INTEGER DEFAULT 0,
    column_span INTEGER DEFAULT 1,
    row_span INTEGER DEFAULT 1,
    css_classes TEXT[] DEFAULT '{}',
    
    -- Conditional logic
    conditional_logic JSONB DEFAULT '{}',
    depends_on TEXT[] DEFAULT '{}',
    
    -- Field metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(form_id, field_key),
    CONSTRAINT form_fields_key_format CHECK (field_key ~* '^[a-z][a-z0-9_]*$'),
    CONSTRAINT form_fields_label_length CHECK (LENGTH(label) >= 1),
    CONSTRAINT form_fields_sort_order_positive CHECK (sort_order >= 0),
    CONSTRAINT form_fields_span_positive CHECK (
        column_span > 0 AND row_span > 0
    )
);

-- Form analytics - Detailed form performance tracking
CREATE TABLE IF NOT EXISTS form_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Time period
    date DATE NOT NULL,
    hour_of_day INTEGER,
    
    -- View and interaction metrics
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_starts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    
    -- Abandonment analysis
    field_abandonment JSONB DEFAULT '{}',
    page_abandonment JSONB DEFAULT '{}',
    
    -- Performance metrics
    average_completion_time INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5, 2) DEFAULT 0.00,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    
    -- Traffic sources
    traffic_sources JSONB DEFAULT '{}',
    referrer_domains JSONB DEFAULT '{}',
    device_types JSONB DEFAULT '{}',
    
    -- User behavior
    field_interaction_time JSONB DEFAULT '{}',
    scroll_depth JSONB DEFAULT '{}',
    error_rates JSONB DEFAULT '{}',
    
    -- Quality metrics
    spam_submissions INTEGER DEFAULT 0,
    incomplete_submissions INTEGER DEFAULT 0,
    quality_score_average DECIMAL(3, 2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(form_id, date, hour_of_day),
    CONSTRAINT form_analytics_hour_range CHECK (
        hour_of_day IS NULL OR (hour_of_day >= 0 AND hour_of_day <= 23)
    ),
    CONSTRAINT form_analytics_counts_positive CHECK (
        total_views >= 0 AND unique_views >= 0 AND 
        total_starts >= 0 AND total_completions >= 0 AND
        spam_submissions >= 0 AND incomplete_submissions >= 0
    ),
    CONSTRAINT form_analytics_rates_range CHECK (
        bounce_rate >= 0.00 AND bounce_rate <= 100.00 AND
        conversion_rate >= 0.00 AND conversion_rate <= 100.00
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_supplier_id ON forms(supplier_id);
CREATE INDEX IF NOT EXISTS idx_forms_wedding_id ON forms(wedding_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_template ON forms(is_template);
CREATE INDEX IF NOT EXISTS idx_forms_public_template ON forms(is_public_template);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_ai_generated ON forms(ai_generated);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_wedding_id ON form_submissions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_completed_at ON form_submissions(completed_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_token ON form_submissions(submission_token);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_key ON form_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_form_fields_type ON form_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_form_fields_sort_order ON form_fields(sort_order);

CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_date ON form_analytics(date);
CREATE INDEX IF NOT EXISTS idx_form_analytics_hour ON form_analytics(hour_of_day);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Forms
DROP POLICY IF EXISTS "Suppliers can manage their forms" ON forms;
CREATE POLICY "Suppliers can manage their forms" ON forms
    FOR ALL USING (
        supplier_id IN (
            SELECT id FROM supplier_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public can view published forms" ON forms;
CREATE POLICY "Public can view published forms" ON forms
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Couples can view forms for their weddings" ON forms;
CREATE POLICY "Couples can view forms for their weddings" ON forms
    FOR SELECT USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- RLS Policies for Form Submissions
DROP POLICY IF EXISTS "Suppliers can view submissions to their forms" ON form_submissions;
CREATE POLICY "Suppliers can view submissions to their forms" ON form_submissions
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN supplier_profiles sp ON f.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own submissions" ON form_submissions;
CREATE POLICY "Users can view their own submissions" ON form_submissions
    FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Couples can view submissions for their weddings" ON form_submissions;
CREATE POLICY "Couples can view submissions for their weddings" ON form_submissions
    FOR SELECT USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

-- RLS Policies for Form Fields
DROP POLICY IF EXISTS "Form field access follows form access" ON form_fields;
CREATE POLICY "Form field access follows form access" ON form_fields
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN supplier_profiles sp ON f.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        ) OR
        form_id IN (
            SELECT id FROM forms WHERE status = 'published'
        )
    );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at 
    BEFORE UPDATE ON form_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_fields_updated_at ON form_fields;
CREATE TRIGGER update_form_fields_updated_at 
    BEFORE UPDATE ON form_fields 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_analytics_updated_at ON form_analytics;
CREATE TRIGGER update_form_analytics_updated_at 
    BEFORE UPDATE ON form_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE forms IS 'Customizable data collection forms created by suppliers';
COMMENT ON COLUMN forms.fields IS 'JSONB array containing form field definitions';
COMMENT ON COLUMN forms.conditional_logic IS 'JSONB object defining field display conditions';
COMMENT ON COLUMN forms.branding IS 'JSONB object containing custom styling and branding';
COMMENT ON COLUMN forms.ai_generated IS 'Whether this form was generated using AI';

COMMENT ON TABLE form_submissions IS 'Responses submitted to supplier forms by couples';
COMMENT ON COLUMN form_submissions.responses IS 'JSONB object containing field responses';
COMMENT ON COLUMN form_submissions.submission_token IS 'Unique token for tracking submissions';

COMMENT ON TABLE form_fields IS 'Detailed field definitions for forms';
COMMENT ON TABLE form_analytics IS 'Performance tracking and analytics for forms';