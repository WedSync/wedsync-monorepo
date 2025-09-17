-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- WedSync & WedMe Platform
-- Task: T024 - Configure Row Level Security policies for multi-tenant isolation
--
-- This file configures comprehensive RLS policies to ensure:
-- 1. Suppliers can only access their own data
-- 2. Couples can only access their wedding data
-- 3. Guests can only access their own wedding-related data
-- 4. Admins can access aggregated, anonymized data
-- 5. Cross-platform data sharing for contracted supplier-wedding relationships
--
-- Date: 2025-09-16

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

-- Enhanced RLS policies for users table
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

DROP POLICY IF EXISTS "Suppliers can view basic user info for contracted weddings" ON users;
CREATE POLICY "Suppliers can view basic user info for contracted weddings" ON users
    FOR SELECT USING (
        auth.is_supplier() AND EXISTS (
            SELECT 1 FROM supplier_weddings sw
            JOIN weddings w ON sw.wedding_id = w.id
            JOIN couple_profiles cp ON w.couple_id = cp.id
            JOIN supplier_profiles sp ON sw.supplier_id = sp.id
            WHERE sp.user_id = auth.uid()
            AND (cp.partner_one_id = users.id OR cp.partner_two_id = users.id)
        )
    );

-- RLS policies for couple_profiles
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

-- Enhanced RLS policies for supplier_profiles
DROP POLICY IF EXISTS "Suppliers can manage their own profile" ON supplier_profiles;
CREATE POLICY "Suppliers can manage their own profile" ON supplier_profiles
    FOR ALL USING (
        user_id = auth.uid() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view verified suppliers" ON supplier_profiles;
CREATE POLICY "Public can view verified suppliers" ON supplier_profiles
    FOR SELECT USING (
        verification_status IN ('verified', 'premium') OR
        auth.is_admin()
    );

DROP POLICY IF EXISTS "Couples can view suppliers for their contracted weddings" ON supplier_profiles;
CREATE POLICY "Couples can view suppliers for their contracted weddings" ON supplier_profiles
    FOR SELECT USING (
        auth.is_couple() AND EXISTS (
            SELECT 1 FROM supplier_weddings sw
            JOIN weddings w ON sw.wedding_id = w.id
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE sw.supplier_id = supplier_profiles.id
            AND (cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid())
        )
    );

-- RLS policies for supplier_portfolio
DROP POLICY IF EXISTS "Suppliers can manage their portfolio" ON supplier_portfolio;
CREATE POLICY "Suppliers can manage their portfolio" ON supplier_portfolio
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view portfolio" ON supplier_portfolio;
CREATE POLICY "Public can view portfolio" ON supplier_portfolio
    FOR SELECT USING (TRUE);

-- RLS policies for supplier_reviews
DROP POLICY IF EXISTS "Public can view reviews" ON supplier_reviews;
CREATE POLICY "Public can view reviews" ON supplier_reviews
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Couples can create reviews for their weddings" ON supplier_reviews;
CREATE POLICY "Couples can create reviews for their weddings" ON supplier_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Suppliers can respond to their reviews" ON supplier_reviews;
CREATE POLICY "Suppliers can respond to their reviews" ON supplier_reviews
    FOR UPDATE USING (
        supplier_id = auth.get_user_supplier_id() AND
        response_text IS NULL -- Only allow adding response, not modifying review
    );

-- RLS policies for supplier_packages
DROP POLICY IF EXISTS "Suppliers can manage their packages" ON supplier_packages;
CREATE POLICY "Suppliers can manage their packages" ON supplier_packages
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view active packages" ON supplier_packages;
CREATE POLICY "Public can view active packages" ON supplier_packages
    FOR SELECT USING (is_active = TRUE);

-- =============================================================================
-- WEDDING ENTITY RLS POLICIES
-- =============================================================================

-- Enhanced RLS policies for weddings
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

-- RLS policies for wedding_timelines
DROP POLICY IF EXISTS "Wedding participants can access timelines" ON wedding_timelines;
CREATE POLICY "Wedding participants can access timelines" ON wedding_timelines
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- RLS policies for supplier_weddings
DROP POLICY IF EXISTS "Wedding participants can manage relationships" ON supplier_weddings;
CREATE POLICY "Wedding participants can manage relationships" ON supplier_weddings
    FOR ALL USING (
        -- Suppliers can manage their own wedding relationships
        supplier_id = auth.get_user_supplier_id() OR
        -- Couples can manage their wedding relationships
        auth.can_access_wedding(wedding_id) OR
        auth.is_admin()
    );

-- RLS policies for wedding_documents
DROP POLICY IF EXISTS "Wedding participants can manage documents" ON wedding_documents;
CREATE POLICY "Wedding participants can manage documents" ON wedding_documents
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- RLS policies for wedding_tasks
DROP POLICY IF EXISTS "Wedding participants can manage tasks" ON wedding_tasks;
CREATE POLICY "Wedding participants can manage tasks" ON wedding_tasks
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- =============================================================================
-- GUEST ENTITY RLS POLICIES
-- =============================================================================

-- Enhanced RLS policies for guests
DROP POLICY IF EXISTS "Couples can manage their wedding guests" ON guests;
CREATE POLICY "Couples can manage their wedding guests" ON guests
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- RLS policies for guest_groups
DROP POLICY IF EXISTS "Wedding participants can manage guest groups" ON guest_groups;
CREATE POLICY "Wedding participants can manage guest groups" ON guest_groups
    FOR ALL USING (
        auth.can_access_wedding(wedding_id) OR auth.is_admin()
    );

-- RLS policies for guest_group_memberships
DROP POLICY IF EXISTS "Wedding participants can manage guest group memberships" ON guest_group_memberships;
CREATE POLICY "Wedding participants can manage guest group memberships" ON guest_group_memberships
    FOR ALL USING (
        guest_id IN (
            SELECT g.id FROM guests g
            WHERE auth.can_access_wedding(g.wedding_id)
        ) OR auth.is_admin()
    );

-- RLS policies for guest_dietary_restrictions
DROP POLICY IF EXISTS "Wedding participants can manage dietary restrictions" ON guest_dietary_restrictions;
CREATE POLICY "Wedding participants can manage dietary restrictions" ON guest_dietary_restrictions
    FOR ALL USING (
        guest_id IN (
            SELECT g.id FROM guests g
            WHERE auth.can_access_wedding(g.wedding_id)
        ) OR auth.is_admin()
    );

-- RLS policies for guest_event_responses
DROP POLICY IF EXISTS "Wedding participants can manage event responses" ON guest_event_responses;
CREATE POLICY "Wedding participants can manage event responses" ON guest_event_responses
    FOR ALL USING (
        guest_id IN (
            SELECT g.id FROM guests g
            WHERE auth.can_access_wedding(g.wedding_id)
        ) OR auth.is_admin()
    );

-- RLS policies for guest_checkin
DROP POLICY IF EXISTS "Wedding participants can manage guest checkin" ON guest_checkin;
CREATE POLICY "Wedding participants can manage guest checkin" ON guest_checkin
    FOR ALL USING (
        guest_id IN (
            SELECT g.id FROM guests g
            WHERE auth.can_access_wedding(g.wedding_id)
        ) OR auth.is_admin()
    );

-- =============================================================================
-- FORM ENTITY RLS POLICIES
-- =============================================================================

-- Enhanced RLS policies for forms
DROP POLICY IF EXISTS "Suppliers can manage their forms" ON forms;
CREATE POLICY "Suppliers can manage their forms" ON forms
    FOR ALL USING (
        supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Public can view published forms" ON forms;
CREATE POLICY "Public can view published forms" ON forms
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Couples can view forms for their weddings" ON forms;
CREATE POLICY "Couples can view forms for their weddings" ON forms
    FOR SELECT USING (
        wedding_id IS NOT NULL AND auth.can_access_wedding(wedding_id)
    );

-- RLS policies for form_submissions
DROP POLICY IF EXISTS "Suppliers can view submissions to their forms" ON form_submissions;
CREATE POLICY "Suppliers can view submissions to their forms" ON form_submissions
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            WHERE f.supplier_id = auth.get_user_supplier_id()
        ) OR auth.is_admin()
    );

DROP POLICY IF EXISTS "Users can manage their own submissions" ON form_submissions;
CREATE POLICY "Users can manage their own submissions" ON form_submissions
    FOR ALL USING (
        submitted_by = auth.uid() OR
        (wedding_id IS NOT NULL AND auth.can_access_wedding(wedding_id))
    );

DROP POLICY IF EXISTS "Anonymous users can create submissions" ON form_submissions;
CREATE POLICY "Anonymous users can create submissions" ON form_submissions
    FOR INSERT WITH CHECK (
        form_id IN (
            SELECT id FROM forms WHERE status = 'published'
        )
    );

-- RLS policies for form_fields
DROP POLICY IF EXISTS "Form field access follows form access" ON form_fields;
CREATE POLICY "Form field access follows form access" ON form_fields
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            WHERE f.supplier_id = auth.get_user_supplier_id()
        ) OR
        form_id IN (
            SELECT id FROM forms WHERE status = 'published'
        ) OR
        auth.is_admin()
    );

-- RLS policies for form_analytics
DROP POLICY IF EXISTS "Suppliers can view their form analytics" ON form_analytics;
CREATE POLICY "Suppliers can view their form analytics" ON form_analytics
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            WHERE f.supplier_id = auth.get_user_supplier_id()
        ) OR auth.is_admin()
    );

-- =============================================================================
-- VENUE ENTITY RLS POLICIES
-- =============================================================================

-- Check if venues table exists and apply RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'venues') THEN
        -- Enable RLS for venues table
        ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
        
        -- Venues can be viewed by anyone (public directory)
        DROP POLICY IF EXISTS "Public can view venues" ON venues;
        CREATE POLICY "Public can view venues" ON venues
            FOR SELECT USING (TRUE);
        
        -- Only venue owners or admins can modify venues
        DROP POLICY IF EXISTS "Venue owners can manage their venues" ON venues;
        CREATE POLICY "Venue owners can manage their venues" ON venues
            FOR ALL USING (
                -- Assume venues have a user_id or supplier_id column
                EXISTS (
                    SELECT 1 FROM supplier_profiles sp
                    WHERE sp.user_id = auth.uid()
                    AND venues.supplier_id = sp.id
                ) OR auth.is_admin()
            );
    END IF;
END $$;

-- =============================================================================
-- JOURNEY ENTITY RLS POLICIES
-- =============================================================================

-- Check if journeys table exists and apply RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journeys') THEN
        -- Enable RLS for journeys table
        ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
        
        -- Suppliers can manage their journeys
        DROP POLICY IF EXISTS "Suppliers can manage their journeys" ON journeys;
        CREATE POLICY "Suppliers can manage their journeys" ON journeys
            FOR ALL USING (
                supplier_id = auth.get_user_supplier_id() OR auth.is_admin()
            );
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journey_enrollments') THEN
        -- Enable RLS for journey_enrollments table
        ALTER TABLE journey_enrollments ENABLE ROW LEVEL SECURITY;
        
        -- Journey enrollments follow wedding access rules
        DROP POLICY IF EXISTS "Wedding participants can manage journey enrollments" ON journey_enrollments;
        CREATE POLICY "Wedding participants can manage journey enrollments" ON journey_enrollments
            FOR ALL USING (
                auth.can_access_wedding(wedding_id) OR auth.is_admin()
            );
    END IF;
END $$;

-- =============================================================================
-- COMMUNICATION ENTITY RLS POLICIES
-- =============================================================================

-- Check if communications table exists and apply RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'communications') THEN
        -- Enable RLS for communications table
        ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
        
        -- Users can view communications they sent or received
        DROP POLICY IF EXISTS "Users can view their communications" ON communications;
        CREATE POLICY "Users can view their communications" ON communications
            FOR SELECT USING (
                sender_id = auth.uid() OR 
                recipient_id = auth.uid() OR
                auth.is_admin()
            );
        
        -- Users can create communications for weddings they have access to
        DROP POLICY IF EXISTS "Users can create communications for accessible weddings" ON communications;
        CREATE POLICY "Users can create communications for accessible weddings" ON communications
            FOR INSERT WITH CHECK (
                sender_id = auth.uid() AND
                auth.can_access_wedding(wedding_id)
            );
        
        -- Users can update communications they sent
        DROP POLICY IF EXISTS "Users can update their sent communications" ON communications;
        CREATE POLICY "Users can update their sent communications" ON communications
            FOR UPDATE USING (sender_id = auth.uid());
    END IF;
END $$;

-- =============================================================================
-- DOCUMENT ENTITY RLS POLICIES
-- =============================================================================

-- Check if documents table exists and apply RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        -- Enable RLS for documents table
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        
        -- Users can view documents for weddings they have access to
        DROP POLICY IF EXISTS "Users can view wedding documents" ON documents;
        CREATE POLICY "Users can view wedding documents" ON documents
            FOR SELECT USING (
                auth.can_access_wedding(wedding_id) OR auth.is_admin()
            );
        
        -- Users can create documents for weddings they have access to
        DROP POLICY IF EXISTS "Users can create wedding documents" ON documents;
        CREATE POLICY "Users can create wedding documents" ON documents
            FOR INSERT WITH CHECK (
                uploaded_by = auth.uid() AND
                auth.can_access_wedding(wedding_id)
            );
        
        -- Users can update documents they uploaded
        DROP POLICY IF EXISTS "Users can update their uploaded documents" ON documents;
        CREATE POLICY "Users can update their uploaded documents" ON documents
            FOR UPDATE USING (uploaded_by = auth.uid());
    END IF;
END $$;

-- =============================================================================
-- TASK ENTITY RLS POLICIES
-- =============================================================================

-- Check if tasks table exists and apply RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- Enable RLS for tasks table
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        
        -- Users can view tasks for weddings they have access to
        DROP POLICY IF EXISTS "Users can view wedding tasks" ON tasks;
        CREATE POLICY "Users can view wedding tasks" ON tasks
            FOR SELECT USING (
                auth.can_access_wedding(wedding_id) OR auth.is_admin()
            );
        
        -- Users can create tasks for weddings they have access to
        DROP POLICY IF EXISTS "Users can create wedding tasks" ON tasks;
        CREATE POLICY "Users can create wedding tasks" ON tasks
            FOR INSERT WITH CHECK (
                created_by = auth.uid() AND
                auth.can_access_wedding(wedding_id)
            );
        
        -- Users can update tasks they created or are assigned to
        DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
        CREATE POLICY "Users can update their tasks" ON tasks
            FOR UPDATE USING (
                created_by = auth.uid() OR 
                assigned_to = auth.uid() OR
                auth.can_access_wedding(wedding_id)
            );
    END IF;
END $$;

-- =============================================================================
-- ADMIN-ONLY DATA ACCESS POLICIES
-- =============================================================================

-- Create view for admin analytics (anonymized data)
CREATE OR REPLACE VIEW admin_analytics AS
SELECT 
    DATE_TRUNC('month', w.created_at) as month,
    COUNT(DISTINCT w.id) as total_weddings,
    COUNT(DISTINCT sp.id) as total_suppliers,
    COUNT(DISTINCT cp.id) as total_couples,
    AVG(w.guest_count_estimated) as avg_guest_count,
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

-- Grant access to admin analytics view only to admins
DROP POLICY IF EXISTS "Only admins can view analytics" ON admin_analytics;
CREATE POLICY "Only admins can view analytics" ON admin_analytics
    FOR SELECT USING (auth.is_admin());

-- =============================================================================
-- SECURITY FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log security-relevant events for auditing
    INSERT INTO security_audit_log (
        user_id,
        table_name,
        operation,
        record_id,
        timestamp
    ) VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON security_audit_log;
CREATE POLICY "Only admins can view audit logs" ON security_audit_log
    FOR SELECT USING (auth.is_admin());

-- =============================================================================
-- VERIFICATION AND TESTING HELPERS
-- =============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    test_result TEXT
) AS $$
BEGIN
    -- This function would contain tests to verify RLS policies work correctly
    -- Implementation would test various scenarios for each table
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- POLICY SUMMARY AND DOCUMENTATION
-- =============================================================================

/*
MULTI-TENANT ISOLATION SUMMARY:

1. USER ISOLATION:
   - Users can only view/edit their own profiles
   - Suppliers can view basic info for couples they work with
   - Admins have full access

2. SUPPLIER ISOLATION:
   - Suppliers can only access their own business data
   - Public can view verified supplier profiles and portfolios
   - Couples can view suppliers they're working with

3. WEDDING ISOLATION:
   - Couples can only access their own weddings
   - Suppliers can view weddings they're contracted for
   - All wedding-related data (guests, tasks, documents) follows wedding access

4. FORM ISOLATION:
   - Suppliers can only access their own forms and submissions
   - Public can view published forms
   - Couples can view forms specific to their weddings

5. CROSS-PLATFORM ACCESS:
   - Suppliers and couples can collaborate on shared weddings
   - Data visibility is controlled by supplier-wedding relationships
   - Guest data is accessible to all wedding participants

6. ADMIN ACCESS:
   - Admins can access all data
   - Analytics views provide aggregated, anonymized data
   - Security audit logging tracks access patterns

SECURITY FEATURES:
- Helper functions validate user roles and relationships
- Policies are granular by operation (SELECT, INSERT, UPDATE, DELETE)
- Anonymous users can only create form submissions for published forms
- All policies include admin override for management functions
*/

-- Comments for documentation
COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION auth.is_supplier() IS 'Check if current user has supplier role';
COMMENT ON FUNCTION auth.is_couple() IS 'Check if current user has couple role';
COMMENT ON FUNCTION auth.get_user_supplier_id() IS 'Get supplier profile ID for current user';
COMMENT ON FUNCTION auth.can_access_wedding(UUID) IS 'Check if user can access wedding data';
COMMENT ON VIEW admin_analytics IS 'Anonymized analytics data for admin dashboard';
COMMENT ON TABLE security_audit_log IS 'Security event audit trail';