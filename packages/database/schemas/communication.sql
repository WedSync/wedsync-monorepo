-- Communication entity schema for WedSync platform
-- Handles messaging, templates, campaigns, and conversations
-- This file defines tables for messages, conversations, templates, campaigns, and contact segments

-- Create custom types for communication management
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('email', 'sms', 'whatsapp', 'internal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status AS ENUM (
        'draft', 'scheduled', 'queued', 'sending', 'sent', 
        'delivered', 'read', 'failed', 'bounced', 'spam'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'archived', 'spam');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_category AS ENUM (
        'welcome', 'follow_up', 'reminder', 'confirmation', 
        'thank_you', 'promotional', 'informational', 'emergency', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_schedule_type AS ENUM ('immediate', 'scheduled', 'recurring');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conversations table - Groups related messages together
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL DEFAULT '{}',
    supplier_id UUID NOT NULL,
    wedding_id UUID,
    subject TEXT,
    status conversation_status NOT NULL DEFAULT 'open',
    priority message_priority NOT NULL DEFAULT 'normal',
    tags TEXT[] DEFAULT '{}',
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 0,
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT conversations_participants_not_empty CHECK (array_length(participants, 1) > 0),
    CONSTRAINT conversations_unread_count_positive CHECK (unread_count >= 0),
    CONSTRAINT conversations_subject_length CHECK (subject IS NULL OR LENGTH(subject) <= 500)
);

-- Messages table - Individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    type message_type NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    html_body TEXT,
    attachments JSONB DEFAULT '[]',
    media_url TEXT,
    status message_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    template_id UUID,
    journey_id UUID,
    journey_node_id UUID,
    campaign_id UUID,
    priority message_priority NOT NULL DEFAULT 'normal',
    tags TEXT[] DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'manual',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT messages_body_not_empty CHECK (LENGTH(body) > 0),
    CONSTRAINT messages_status_timing_logic CHECK (
        (status = 'scheduled' AND scheduled_at IS NOT NULL) OR
        (status = 'sent' AND sent_at IS NOT NULL) OR
        (status = 'delivered' AND delivered_at IS NOT NULL) OR
        (status = 'read' AND read_at IS NOT NULL) OR
        (status = 'failed' AND failed_at IS NOT NULL) OR
        status IN ('draft', 'queued', 'sending', 'bounced', 'spam')
    ),
    CONSTRAINT messages_email_subject_required CHECK (
        type != 'email' OR subject IS NOT NULL
    )
);

-- Templates table - Reusable message templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type message_type NOT NULL,
    category template_category NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    html_content TEXT,
    variables JSONB DEFAULT '[]',
    is_shared BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT templates_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT templates_content_not_empty CHECK (LENGTH(content) > 0),
    CONSTRAINT templates_usage_count_positive CHECK (usage_count >= 0),
    CONSTRAINT templates_email_subject_required CHECK (
        type != 'email' OR subject IS NOT NULL
    )
);

-- Campaigns table - Bulk messaging campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type message_type NOT NULL,
    template_id UUID REFERENCES templates(id),
    status campaign_status NOT NULL DEFAULT 'draft',
    schedule_type campaign_schedule_type NOT NULL DEFAULT 'immediate',
    scheduled_at TIMESTAMPTZ,
    timezone TEXT DEFAULT 'UTC',
    recurrence_config JSONB DEFAULT '{}',
    audience_filters JSONB DEFAULT '[]',
    exclude_filters JSONB DEFAULT '[]',
    total_recipients INTEGER DEFAULT 0,
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT campaigns_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT campaigns_total_recipients_positive CHECK (total_recipients >= 0),
    CONSTRAINT campaigns_scheduled_logic CHECK (
        (schedule_type = 'scheduled' AND scheduled_at IS NOT NULL) OR
        (schedule_type != 'scheduled')
    )
);

-- Campaign recipients table - Track campaign delivery status per recipient
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL,
    message_id UUID REFERENCES messages(id),
    status message_status NOT NULL DEFAULT 'queued',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(campaign_id, recipient_id)
);

-- Contact segments table - Reusable audience segments
CREATE TABLE IF NOT EXISTS contact_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '[]',
    contact_count INTEGER DEFAULT 0,
    is_auto_updating BOOLEAN DEFAULT TRUE,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT contact_segments_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT contact_segments_contact_count_positive CHECK (contact_count >= 0)
);

-- Message attachments table - File attachments for messages
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT message_attachments_filename_length CHECK (LENGTH(filename) >= 1),
    CONSTRAINT message_attachments_size_positive CHECK (size_bytes > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_supplier_id ON conversations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conversations_wedding_id ON conversations(wedding_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled_at ON messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_template_id ON messages(template_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_journey_id ON messages(journey_id);

CREATE INDEX IF NOT EXISTS idx_templates_supplier_id ON templates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_shared ON templates(is_shared);

CREATE INDEX IF NOT EXISTS idx_campaigns_supplier_id ON campaigns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_template_id ON campaigns(template_id);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_recipient_id ON campaign_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

CREATE INDEX IF NOT EXISTS idx_contact_segments_supplier_id ON contact_segments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contact_segments_is_auto_updating ON contact_segments(is_auto_updating);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        supplier_id = auth.uid() OR
        auth.uid() = ANY(participants) OR
        assigned_to = auth.uid() OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their conversations" ON conversations;
CREATE POLICY "Users can manage their conversations" ON conversations
    FOR ALL USING (
        supplier_id = auth.uid() OR
        assigned_to = auth.uid()
    );

-- RLS Policies for Messages
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        recipient_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id AND (
                c.supplier_id = auth.uid() OR
                auth.uid() = ANY(c.participants) OR
                c.assigned_to = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id AND (
                c.supplier_id = auth.uid() OR
                auth.uid() = ANY(c.participants)
            )
        )
    );

DROP POLICY IF EXISTS "Users can update their messages" ON messages;
CREATE POLICY "Users can update their messages" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id AND c.supplier_id = auth.uid()
        )
    );

-- RLS Policies for Templates
DROP POLICY IF EXISTS "Users can view available templates" ON templates;
CREATE POLICY "Users can view available templates" ON templates
    FOR SELECT USING (
        supplier_id = auth.uid() OR is_shared = TRUE
    );

DROP POLICY IF EXISTS "Users can manage their templates" ON templates;
CREATE POLICY "Users can manage their templates" ON templates
    FOR ALL USING (
        supplier_id = auth.uid()
    );

-- RLS Policies for Campaigns
DROP POLICY IF EXISTS "Users can manage their campaigns" ON campaigns;
CREATE POLICY "Users can manage their campaigns" ON campaigns
    FOR ALL USING (
        supplier_id = auth.uid()
    );

-- RLS Policies for Campaign Recipients
DROP POLICY IF EXISTS "Users can view their campaign recipients" ON campaign_recipients;
CREATE POLICY "Users can view their campaign recipients" ON campaign_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            WHERE c.id = campaign_id AND c.supplier_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage campaign recipients" ON campaign_recipients;
CREATE POLICY "System can manage campaign recipients" ON campaign_recipients
    FOR ALL USING (true);

-- RLS Policies for Contact Segments
DROP POLICY IF EXISTS "Users can manage their contact segments" ON contact_segments;
CREATE POLICY "Users can manage their contact segments" ON contact_segments
    FOR ALL USING (
        supplier_id = auth.uid()
    );

-- RLS Policies for Message Attachments
DROP POLICY IF EXISTS "Users can view message attachments" ON message_attachments;
CREATE POLICY "Users can view message attachments" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id AND (
                m.sender_id = auth.uid() OR
                m.recipient_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM conversations c
                    WHERE c.id = m.conversation_id AND (
                        c.supplier_id = auth.uid() OR
                        auth.uid() = ANY(c.participants)
                    )
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
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_recipients_updated_at ON campaign_recipients;
CREATE TRIGGER update_campaign_recipients_updated_at 
    BEFORE UPDATE ON campaign_recipients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_segments_updated_at ON contact_segments;
CREATE TRIGGER update_contact_segments_updated_at 
    BEFORE UPDATE ON contact_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Groups related messages together for organized communication';
COMMENT ON COLUMN conversations.participants IS 'Array of user IDs participating in this conversation';
COMMENT ON COLUMN conversations.unread_count IS 'Number of unread messages for tracking';

COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON COLUMN messages.type IS 'Message delivery channel: email, sms, whatsapp, internal';
COMMENT ON COLUMN messages.status IS 'Delivery status tracking';
COMMENT ON COLUMN messages.source IS 'How message was created: manual, journey, campaign, system, api';
COMMENT ON COLUMN messages.attachments IS 'JSONB array of attachment metadata';

COMMENT ON TABLE templates IS 'Reusable message templates for consistent communication';
COMMENT ON COLUMN templates.variables IS 'JSONB array of template variable definitions';
COMMENT ON COLUMN templates.is_shared IS 'Whether template is available to other suppliers';
COMMENT ON COLUMN templates.usage_count IS 'Track template popularity and usage';

COMMENT ON TABLE campaigns IS 'Bulk messaging campaigns for marketing and communication';
COMMENT ON COLUMN campaigns.audience_filters IS 'JSONB filters to define target audience';
COMMENT ON COLUMN campaigns.analytics IS 'JSONB campaign performance metrics';

COMMENT ON TABLE campaign_recipients IS 'Track delivery status for each campaign recipient';
COMMENT ON TABLE contact_segments IS 'Reusable audience segments for targeted messaging';
COMMENT ON TABLE message_attachments IS 'File attachments associated with messages';