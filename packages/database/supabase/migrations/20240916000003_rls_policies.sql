-- Row Level Security (RLS) Policies Migration
-- Apply comprehensive RLS policies for multi-tenant isolation

-- Create tables that may be missing but referenced in RLS policies

-- Create supplier_weddings junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS supplier_weddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    contract_status TEXT DEFAULT 'pending',
    contract_amount DECIMAL(12, 2),
    contract_signed_at TIMESTAMPTZ,
    services_provided TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, wedding_id)
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE supplier_weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_weddings_supplier_id ON supplier_weddings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_weddings_wedding_id ON supplier_weddings(wedding_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp ON security_audit_log(timestamp);

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =============================================================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is a supplier
CREATE OR REPLACE FUNCTION auth.is_supplier()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'supplier'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is part of a couple
CREATE OR REPLACE FUNCTION auth.is_couple()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'couple'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get supplier_id for current user
CREATE OR REPLACE FUNCTION auth.get_user_supplier_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT sp.id FROM supplier_profiles sp
        WHERE sp.user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to wedding (couple or contracted supplier)
CREATE OR REPLACE FUNCTION auth.can_access_wedding(wedding_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Couples can access their weddings
    IF EXISTS (
        SELECT 1 FROM weddings w
        JOIN couple_profiles cp ON w.couple_id = cp.id
        WHERE w.id = wedding_uuid 
        AND (cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Suppliers can access weddings they're contracted for
    IF EXISTS (
        SELECT 1 FROM supplier_weddings sw
        JOIN supplier_profiles sp ON sw.supplier_id = sp.id
        WHERE sw.wedding_id = wedding_uuid 
        AND sp.user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USER ENTITY RLS POLICIES
-- =============================================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (
        auth.uid() = id OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (auth.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Couple profiles policies
DROP POLICY IF EXISTS "Couples can view their own profile" ON couple_profiles;
CREATE POLICY "Couples can view their own profile" ON couple_profiles
    FOR SELECT USING (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id OR
        auth.is_admin()
    );

DROP POLICY IF EXISTS "Couples can update their own profile" ON couple_profiles;
CREATE POLICY "Couples can update their own profile" ON couple_profiles
    FOR UPDATE USING (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id
    );

DROP POLICY IF EXISTS "Couples can create their profile" ON couple_profiles;
CREATE POLICY "Couples can create their profile" ON couple_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = partner_one_id OR 
        auth.uid() = partner_two_id
    );

-- =============================================================================
-- SUPPLIER ENTITY RLS POLICIES
-- =============================================================================

-- Supplier profiles policies
DROP POLICY IF EXISTS "Suppliers can manage their own profile" ON supplier_profiles;
CREATE POLICY "Suppliers can manage their own profile" ON supplier_profiles
    FOR ALL USING (
        user_id = auth.uid() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view supplier profiles" ON supplier_profiles;
CREATE POLICY "Public can view supplier profiles" ON supplier_profiles
    FOR SELECT USING (TRUE);

-- Supplier weddings policies
DROP POLICY IF EXISTS "Wedding participants can manage relationships" ON supplier_weddings;
CREATE POLICY "Wedding participants can manage relationships" ON supplier_weddings
    FOR ALL USING (
        -- Suppliers can manage their own wedding relationships
        supplier_id = auth.get_user_supplier_id() OR
        -- Couples can manage their wedding relationships
        auth.can_access_wedding(wedding_id) OR
        auth.is_admin()
    );

-- =============================================================================
-- WEDDING ENTITY RLS POLICIES
-- =============================================================================

-- Weddings policies
DROP POLICY IF EXISTS "Couples can access their weddings" ON weddings;
CREATE POLICY "Couples can access their weddings" ON weddings
    FOR ALL USING (
        couple_id IN (
            SELECT id FROM couple_profiles 
            WHERE partner_one_id = auth.uid() OR partner_two_id = auth.uid()
        ) OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Suppliers can view their contracted weddings" ON weddings;
CREATE POLICY "Suppliers can view their contracted weddings" ON weddings
    FOR SELECT USING (
        auth.is_supplier() AND id IN (
            SELECT sw.wedding_id FROM supplier_weddings sw
            JOIN supplier_profiles sp ON sw.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
        )
    );

-- Wedding timelines policies
DROP POLICY IF EXISTS "Wedding participants can access timelines" ON wedding_timelines;
CREATE POLICY "Wedding participants can access timelines" ON wedding_timelines
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- =============================================================================
-- GUEST ENTITY RLS POLICIES
-- =============================================================================

-- Guests policies
DROP POLICY IF EXISTS "Wedding participants can manage guests" ON guests;
CREATE POLICY "Wedding participants can manage guests" ON guests
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- =============================================================================
-- FORM ENTITY RLS POLICIES
-- =============================================================================

-- Forms policies
DROP POLICY IF EXISTS "Suppliers can manage their forms" ON forms;
CREATE POLICY "Suppliers can manage their forms" ON forms
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view published forms" ON forms;
CREATE POLICY "Public can view published forms" ON forms
    FOR SELECT USING (status = 'published');

-- Form submissions policies
DROP POLICY IF EXISTS "Suppliers can view submissions to their forms" ON form_submissions;
CREATE POLICY "Suppliers can view submissions to their forms" ON form_submissions
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            WHERE f.supplier_id = auth.get_user_supplier_id()
        ) OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Wedding participants can view submissions" ON form_submissions;
CREATE POLICY "Wedding participants can view submissions" ON form_submissions
    FOR SELECT USING (
        wedding_id IS NOT NULL AND auth.can_access_wedding(wedding_id)
    );

DROP POLICY IF EXISTS "Anonymous users can create submissions" ON form_submissions;
CREATE POLICY "Anonymous users can create submissions" ON form_submissions
    FOR INSERT WITH CHECK (
        form_id IN (
            SELECT id FROM forms WHERE status = 'published'
        )
    );

-- =============================================================================
-- JOURNEY ENTITY RLS POLICIES
-- =============================================================================

-- Journeys policies
DROP POLICY IF EXISTS "Suppliers can manage their journeys" ON journeys;
CREATE POLICY "Suppliers can manage their journeys" ON journeys
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

-- Journey executions policies
DROP POLICY IF EXISTS "Journey participants can view executions" ON journey_executions;
CREATE POLICY "Journey participants can view executions" ON journey_executions
    FOR ALL USING (
        journey_id IN (
            SELECT j.id FROM journeys j
            WHERE j.supplier_id = auth.get_user_supplier_id()
        ) OR
        contact_id = auth.uid() OR
        (wedding_id IS NOT NULL AND auth.can_access_wedding(wedding_id)) OR
        auth.is_admin()
    );

-- =============================================================================
-- COMMUNICATION ENTITY RLS POLICIES
-- =============================================================================

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = ANY(participants) OR
        (supplier_id = auth.get_user_supplier_id()) OR
        (wedding_id IS NOT NULL AND auth.can_access_wedding(wedding_id)) OR
        auth.is_admin()
    );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = ANY(participants) OR
        supplier_id = auth.get_user_supplier_id()
    );

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = ANY(participants) OR
        supplier_id = auth.get_user_supplier_id()
    );

-- Messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR 
        recipient_id = auth.uid() OR
        conversation_id IN (
            SELECT c.id FROM conversations c
            WHERE auth.uid() = ANY(c.participants) OR 
                  c.supplier_id = auth.get_user_supplier_id()
        ) OR
        auth.is_admin()
    );

DROP POLICY IF EXISTS "Users can create messages" ON messages;
CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT c.id FROM conversations c
            WHERE auth.uid() = ANY(c.participants) OR 
                  c.supplier_id = auth.get_user_supplier_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their sent messages" ON messages;
CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Templates policies
DROP POLICY IF EXISTS "Suppliers can manage their templates" ON templates;
CREATE POLICY "Suppliers can manage their templates" ON templates
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view shared templates" ON templates;
CREATE POLICY "Public can view shared templates" ON templates
    FOR SELECT USING (is_shared = TRUE);

-- Campaigns policies
DROP POLICY IF EXISTS "Suppliers can manage their campaigns" ON campaigns;
CREATE POLICY "Suppliers can manage their campaigns" ON campaigns
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

-- Contact segments policies
DROP POLICY IF EXISTS "Suppliers can manage their contact segments" ON contact_segments;
CREATE POLICY "Suppliers can manage their contact segments" ON contact_segments
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

-- Attachments policies
DROP POLICY IF EXISTS "Users can view message attachments" ON attachments;
CREATE POLICY "Users can view message attachments" ON attachments
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            WHERE m.sender_id = auth.uid() OR m.recipient_id = auth.uid()
        ) OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Users can create message attachments" ON attachments;
CREATE POLICY "Users can create message attachments" ON attachments
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT m.id FROM messages m
            WHERE m.sender_id = auth.uid()
        )
    );

-- =============================================================================
-- SECURITY AUDIT LOG POLICIES
-- =============================================================================

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON security_audit_log;
CREATE POLICY "Only admins can view audit logs" ON security_audit_log
    FOR SELECT USING (auth.is_admin());

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON security_audit_log;
CREATE POLICY "System can insert audit logs" ON security_audit_log
    FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- CREATE ADMIN ANALYTICS VIEW
-- =============================================================================

-- Create view for admin analytics (anonymized data)
CREATE OR REPLACE VIEW admin_analytics AS
SELECT 
    DATE_TRUNC('month', w.created_at) as month,
    COUNT(DISTINCT w.id) as total_weddings,
    COUNT(DISTINCT sp.id) as total_suppliers,
    COUNT(DISTINCT cp.id) as total_couples,
    AVG(w.guest_count) as avg_guest_count,
    COUNT(DISTINCT f.id) as total_forms,
    COUNT(DISTINCT fs.id) as total_form_submissions
FROM weddings w
LEFT JOIN couple_profiles cp ON w.couple_id = cp.id
LEFT JOIN supplier_weddings sw ON w.id = sw.wedding_id
LEFT JOIN supplier_profiles sp ON sw.supplier_id = sp.id
LEFT JOIN forms f ON sp.id = f.supplier_id
LEFT JOIN form_submissions fs ON f.id = fs.form_id
GROUP BY DATE_TRUNC('month', w.created_at)
ORDER BY month DESC;

-- Add updated_at trigger for supplier_weddings
CREATE TRIGGER update_supplier_weddings_updated_at 
    BEFORE UPDATE ON supplier_weddings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION auth.is_supplier() IS 'Check if current user has supplier role';
COMMENT ON FUNCTION auth.is_couple() IS 'Check if current user has couple role';
COMMENT ON FUNCTION auth.get_user_supplier_id() IS 'Get supplier profile ID for current user';
COMMENT ON FUNCTION auth.can_access_wedding(UUID) IS 'Check if user can access wedding data';
COMMENT ON VIEW admin_analytics IS 'Anonymized analytics data for admin dashboard';
COMMENT ON TABLE security_audit_log IS 'Security event audit trail';
COMMENT ON TABLE supplier_weddings IS 'Junction table for supplier-wedding relationships';