-- FormSubmission entity schema for WedSync platform
-- Handles form submission data and responses
-- This file defines the form_submissions and form_responses tables

-- Create custom types for form submission management
DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('draft', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Form submissions table - Primary form submission entity
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL,
    wedding_id UUID,
    respondent_email TEXT,
    status submission_status NOT NULL DEFAULT 'draft',
    completed_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT form_submissions_email_format CHECK (
        respondent_email IS NULL OR 
        respondent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT form_submissions_completed_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Form responses table - Individual field responses within a submission
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(submission_id, field_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_wedding_id ON form_submissions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_respondent_email ON form_submissions(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_completed_at ON form_submissions(completed_at);

CREATE INDEX IF NOT EXISTS idx_form_responses_submission_id ON form_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_field_id ON form_responses(field_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_updated_at ON form_responses(updated_at);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Form Submissions
DROP POLICY IF EXISTS "Users can view submissions for their forms" ON form_submissions;
CREATE POLICY "Users can view submissions for their forms" ON form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forms f
            JOIN users u ON f.supplier_id = u.id
            WHERE f.id = form_id AND u.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own submissions" ON form_submissions;
CREATE POLICY "Users can view their own submissions" ON form_submissions
    FOR SELECT USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
CREATE POLICY "Users can create submissions" ON form_submissions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own submissions" ON form_submissions;
CREATE POLICY "Users can update their own submissions" ON form_submissions
    FOR UPDATE USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM forms f
            JOIN users u ON f.supplier_id = u.id
            WHERE f.id = form_id AND u.id = auth.uid()
        )
    );

-- RLS Policies for Form Responses
DROP POLICY IF EXISTS "Users can view responses for their submissions" ON form_responses;
CREATE POLICY "Users can view responses for their submissions" ON form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM form_submissions fs
            WHERE fs.id = submission_id AND (
                fs.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM forms f
                    JOIN users u ON f.supplier_id = u.id
                    WHERE f.id = fs.form_id AND u.id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can create responses" ON form_responses;
CREATE POLICY "Users can create responses" ON form_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM form_submissions fs
            WHERE fs.id = submission_id AND (
                fs.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM forms f
                    JOIN users u ON f.supplier_id = u.id
                    WHERE f.id = fs.form_id AND u.id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can update responses" ON form_responses;
CREATE POLICY "Users can update responses" ON form_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM form_submissions fs
            WHERE fs.id = submission_id AND (
                fs.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM forms f
                    JOIN users u ON f.supplier_id = u.id
                    WHERE f.id = fs.form_id AND u.id = auth.uid()
                )
            )
        )
    );

-- Create updated_at trigger function if not exists (reuse from user.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at 
    BEFORE UPDATE ON form_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_responses_updated_at ON form_responses;
CREATE TRIGGER update_form_responses_updated_at 
    BEFORE UPDATE ON form_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE form_submissions IS 'Form submission instances with metadata and status tracking';
COMMENT ON COLUMN form_submissions.id IS 'Primary key for the form submission';
COMMENT ON COLUMN form_submissions.form_id IS 'Reference to the form that was submitted';
COMMENT ON COLUMN form_submissions.wedding_id IS 'Optional reference to the wedding this submission is for';
COMMENT ON COLUMN form_submissions.respondent_email IS 'Email of the person who submitted the form';
COMMENT ON COLUMN form_submissions.status IS 'Current status: draft, completed, or archived';
COMMENT ON COLUMN form_submissions.completed_at IS 'Timestamp when the submission was completed';
COMMENT ON COLUMN form_submissions.ip_address IS 'IP address of the submitter for security tracking';
COMMENT ON COLUMN form_submissions.user_agent IS 'Browser user agent string for analytics';

COMMENT ON TABLE form_responses IS 'Individual field responses within a form submission';
COMMENT ON COLUMN form_responses.id IS 'Primary key for the form response';
COMMENT ON COLUMN form_responses.submission_id IS 'Reference to the parent form submission';
COMMENT ON COLUMN form_responses.field_id IS 'Reference to the form field this response answers';
COMMENT ON COLUMN form_responses.value IS 'JSONB value containing the response data';