-- Document entity schema for WedSync platform
-- Handles document management, file storage, and sharing
-- This file defines tables for documents, document versions, permissions, and folders

-- Create custom types for document management
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'contract', 'invoice', 'proposal', 'timeline', 'checklist', 
        'photo', 'video', 'audio', 'presentation', 'spreadsheet', 
        'pdf', 'word', 'text', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'review', 'approved', 'signed', 'archived', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_type AS ENUM ('view', 'edit', 'comment', 'download', 'share', 'delete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE share_access_level AS ENUM ('viewer', 'commenter', 'editor', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document folders table - Organize documents in hierarchical structure
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    supplier_id UUID,
    wedding_id UUID,
    created_by UUID NOT NULL,
    is_system_folder BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT document_folders_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT document_folders_no_self_parent CHECK (id != parent_folder_id),
    CONSTRAINT document_folders_sort_order_positive CHECK (sort_order >= 0)
);

-- Documents table - Main document metadata and information
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type document_type NOT NULL DEFAULT 'other',
    status document_status NOT NULL DEFAULT 'draft',
    folder_id UUID REFERENCES document_folders(id),
    supplier_id UUID,
    wedding_id UUID,
    created_by UUID NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    file_extension TEXT,
    storage_path TEXT,
    storage_url TEXT,
    download_url TEXT,
    thumbnail_url TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    password_protected BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    expiry_date TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT documents_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 500),
    CONSTRAINT documents_file_size_positive CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT documents_download_count_positive CHECK (download_count >= 0),
    CONSTRAINT documents_view_count_positive CHECK (view_count >= 0),
    CONSTRAINT documents_password_logic CHECK (
        (password_protected = FALSE AND password_hash IS NULL) OR
        (password_protected = TRUE AND password_hash IS NOT NULL)
    )
);

-- Document versions table - Track document version history
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    checksum TEXT,
    created_by UUID NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, version_number),
    CONSTRAINT document_versions_version_positive CHECK (version_number > 0),
    CONSTRAINT document_versions_file_size_positive CHECK (file_size IS NULL OR file_size > 0)
);

-- Document permissions table - Fine-grained access control
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID,
    role_name TEXT,
    permission_type permission_type NOT NULL,
    granted_by UUID NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT document_permissions_user_or_role CHECK (
        (user_id IS NOT NULL AND role_name IS NULL) OR
        (user_id IS NULL AND role_name IS NOT NULL)
    ),
    CONSTRAINT document_permissions_expiry_future CHECK (
        expires_at IS NULL OR expires_at > granted_at
    )
);

-- Document shares table - Public/private sharing links
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    name TEXT,
    access_level share_access_level NOT NULL DEFAULT 'viewer',
    password_hash TEXT,
    download_enabled BOOLEAN DEFAULT TRUE,
    comment_enabled BOOLEAN DEFAULT FALSE,
    expiry_date TIMESTAMPTZ,
    max_downloads INTEGER,
    current_downloads INTEGER DEFAULT 0,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT document_shares_token_length CHECK (LENGTH(share_token) >= 16),
    CONSTRAINT document_shares_max_downloads_positive CHECK (
        max_downloads IS NULL OR max_downloads > 0
    ),
    CONSTRAINT document_shares_current_downloads_valid CHECK (
        current_downloads >= 0 AND 
        (max_downloads IS NULL OR current_downloads <= max_downloads)
    ),
    CONSTRAINT document_shares_access_count_positive CHECK (access_count >= 0)
);

-- Document comments table - Comments and annotations on documents
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    position_x DECIMAL(10,6),
    position_y DECIMAL(10,6),
    annotation_type TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    parent_comment_id UUID REFERENCES document_comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT document_comments_content_length CHECK (LENGTH(content) >= 1),
    CONSTRAINT document_comments_page_positive CHECK (page_number IS NULL OR page_number > 0),
    CONSTRAINT document_comments_position_valid CHECK (
        (position_x IS NULL AND position_y IS NULL) OR
        (position_x IS NOT NULL AND position_y IS NOT NULL AND 
         position_x >= 0 AND position_x <= 1 AND position_y >= 0 AND position_y <= 1)
    ),
    CONSTRAINT document_comments_resolution_logic CHECK (
        (is_resolved = FALSE AND resolved_by IS NULL AND resolved_at IS NULL) OR
        (is_resolved = TRUE AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
    )
);

-- Document activities table - Audit trail for document actions
CREATE TABLE IF NOT EXISTS document_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID,
    activity_type TEXT NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT document_activities_activity_type_length CHECK (LENGTH(activity_type) >= 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_folder ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_supplier_id ON document_folders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_wedding_id ON document_folders(wedding_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_created_by ON document_folders(created_by);

CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_supplier_id ON documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_wedding_id ON documents(wedding_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_is_shared ON documents(is_shared);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_checksum ON documents(checksum);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_is_current ON document_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_role_name ON document_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_document_permissions_permission_type ON document_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_document_permissions_expires_at ON document_permissions(expires_at);

CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_created_by ON document_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_expiry_date ON document_shares(expiry_date);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_comment ON document_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_is_resolved ON document_comments(is_resolved);

CREATE INDEX IF NOT EXISTS idx_document_activities_document_id ON document_activities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_user_id ON document_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_document_activities_activity_type ON document_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_document_activities_created_at ON document_activities(created_at);

-- Enable Row Level Security
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Document Folders
DROP POLICY IF EXISTS "Users can view accessible folders" ON document_folders;
CREATE POLICY "Users can view accessible folders" ON document_folders
    FOR SELECT USING (
        created_by = auth.uid() OR
        supplier_id = auth.uid() OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their folders" ON document_folders;
CREATE POLICY "Users can manage their folders" ON document_folders
    FOR ALL USING (
        created_by = auth.uid() OR
        supplier_id = auth.uid()
    );

-- RLS Policies for Documents
DROP POLICY IF EXISTS "Users can view accessible documents" ON documents;
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        is_public = TRUE OR
        created_by = auth.uid() OR
        supplier_id = auth.uid() OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        id IN (
            SELECT dp.document_id FROM document_permissions dp
            WHERE dp.user_id = auth.uid() AND dp.permission_type = 'view'
            AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        )
    );

DROP POLICY IF EXISTS "Users can create documents" ON documents;
CREATE POLICY "Users can create documents" ON documents
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND (
            supplier_id = auth.uid() OR
            wedding_id IN (
                SELECT w.id FROM weddings w
                JOIN couple_profiles cp ON w.couple_id = cp.id
                WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update their documents" ON documents;
CREATE POLICY "Users can update their documents" ON documents
    FOR UPDATE USING (
        created_by = auth.uid() OR
        supplier_id = auth.uid() OR
        id IN (
            SELECT dp.document_id FROM document_permissions dp
            WHERE dp.user_id = auth.uid() AND dp.permission_type = 'edit'
            AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        )
    );

-- RLS Policies for Document Versions
DROP POLICY IF EXISTS "Users can view document versions" ON document_versions;
CREATE POLICY "Users can view document versions" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.is_public = TRUE OR
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid() OR
                d.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                d.id IN (
                    SELECT dp.document_id FROM document_permissions dp
                    WHERE dp.user_id = auth.uid() AND dp.permission_type = 'view'
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage document versions" ON document_versions;
CREATE POLICY "Users can manage document versions" ON document_versions
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid() OR
                d.id IN (
                    SELECT dp.document_id FROM document_permissions dp
                    WHERE dp.user_id = auth.uid() AND dp.permission_type = 'edit'
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

-- RLS Policies for Document Permissions
DROP POLICY IF EXISTS "Users can view document permissions" ON document_permissions;
CREATE POLICY "Users can view document permissions" ON document_permissions
    FOR SELECT USING (
        user_id = auth.uid() OR
        granted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage document permissions" ON document_permissions;
CREATE POLICY "Users can manage document permissions" ON document_permissions
    FOR ALL USING (
        granted_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid()
            )
        )
    );

-- RLS Policies for Document Shares
DROP POLICY IF EXISTS "Users can view their document shares" ON document_shares;
CREATE POLICY "Users can view their document shares" ON document_shares
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage their document shares" ON document_shares;
CREATE POLICY "Users can manage their document shares" ON document_shares
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid()
            )
        )
    );

-- RLS Policies for Document Comments
DROP POLICY IF EXISTS "Users can view document comments" ON document_comments;
CREATE POLICY "Users can view document comments" ON document_comments
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.is_public = TRUE OR
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid() OR
                d.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                d.id IN (
                    SELECT dp.document_id FROM document_permissions dp
                    WHERE dp.user_id = auth.uid() AND dp.permission_type IN ('view', 'comment')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can create comments" ON document_comments;
CREATE POLICY "Users can create comments" ON document_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid() OR
                d.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                d.id IN (
                    SELECT dp.document_id FROM document_permissions dp
                    WHERE dp.user_id = auth.uid() AND dp.permission_type IN ('comment', 'edit')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

-- RLS Policies for Document Activities
DROP POLICY IF EXISTS "Users can view document activities" ON document_activities;
CREATE POLICY "Users can view document activities" ON document_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_id AND (
                d.created_by = auth.uid() OR
                d.supplier_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "System can log document activities" ON document_activities;
CREATE POLICY "System can log document activities" ON document_activities
    FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function if not exists (reuse from user.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_document_folders_updated_at ON document_folders;
CREATE TRIGGER update_document_folders_updated_at 
    BEFORE UPDATE ON document_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_shares_updated_at ON document_shares;
CREATE TRIGGER update_document_shares_updated_at 
    BEFORE UPDATE ON document_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_comments_updated_at ON document_comments;
CREATE TRIGGER update_document_comments_updated_at 
    BEFORE UPDATE ON document_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE document_folders IS 'Hierarchical folder structure for organizing documents';
COMMENT ON COLUMN document_folders.is_system_folder IS 'Whether this folder is created by the system';
COMMENT ON COLUMN document_folders.sort_order IS 'Display order within parent folder';

COMMENT ON TABLE documents IS 'Main document metadata and file information';
COMMENT ON COLUMN documents.type IS 'Document category for organization and handling';
COMMENT ON COLUMN documents.status IS 'Document workflow status';
COMMENT ON COLUMN documents.storage_path IS 'Internal file system path';
COMMENT ON COLUMN documents.storage_url IS 'Cloud storage URL';
COMMENT ON COLUMN documents.download_url IS 'Direct download URL';
COMMENT ON COLUMN documents.is_template IS 'Whether document can be used as template';
COMMENT ON COLUMN documents.is_public IS 'Whether document is publicly accessible';
COMMENT ON COLUMN documents.password_protected IS 'Whether document requires password';
COMMENT ON COLUMN documents.checksum IS 'File integrity verification hash';

COMMENT ON TABLE document_versions IS 'Version history tracking for documents';
COMMENT ON COLUMN document_versions.is_current IS 'Whether this is the current/active version';

COMMENT ON TABLE document_permissions IS 'Fine-grained access control for documents';
COMMENT ON COLUMN document_permissions.permission_type IS 'Type of access granted';

COMMENT ON TABLE document_shares IS 'Public/private sharing links with access control';
COMMENT ON COLUMN document_shares.share_token IS 'Unique token for accessing shared document';
COMMENT ON COLUMN document_shares.access_level IS 'Level of access granted through share';

COMMENT ON TABLE document_comments IS 'Comments and annotations on documents';
COMMENT ON COLUMN document_comments.page_number IS 'Page number for PDF annotations';
COMMENT ON COLUMN document_comments.position_x IS 'Relative X position (0-1) for annotations';
COMMENT ON COLUMN document_comments.position_y IS 'Relative Y position (0-1) for annotations';

COMMENT ON TABLE document_activities IS 'Audit trail for all document-related actions';