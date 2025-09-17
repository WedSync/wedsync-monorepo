-- Journey entity schema for WedSync platform
-- Handles journey automation workflows and executions
-- This file defines the journeys, journey_nodes, journey_connections, and journey_executions tables

-- Create custom types for journey management
DO $$ BEGIN
    CREATE TYPE journey_status AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE journey_trigger_type AS ENUM ('form_submit', 'manual', 'date', 'event', 'tag_added');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_type AS ENUM (
        'email', 'sms', 'whatsapp', 'form', 'meeting', 
        'wait', 'condition', 'webhook', 'tag', 'end'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE execution_status AS ENUM ('running', 'completed', 'failed', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Journeys table - Main journey automation workflows
CREATE TABLE IF NOT EXISTS journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status journey_status NOT NULL DEFAULT 'draft',
    trigger_type journey_trigger_type NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journeys_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255)
);

-- Journey nodes table - Individual steps/actions in a journey
CREATE TABLE IF NOT EXISTS journey_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    type node_type NOT NULL,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey connections table - Links between journey nodes
CREATE TABLE IF NOT EXISTS journey_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES journey_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES journey_nodes(id) ON DELETE CASCADE,
    condition_expression TEXT,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journey_connections_different_nodes CHECK (from_node_id != to_node_id),
    UNIQUE(from_node_id, to_node_id, condition_expression)
);

-- Journey executions table - Individual journey runs for contacts/weddings
CREATE TABLE IF NOT EXISTS journey_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL,
    wedding_id UUID,
    status execution_status NOT NULL DEFAULT 'running',
    current_node_id UUID REFERENCES journey_nodes(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journey_executions_status_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status = 'paused' AND paused_at IS NOT NULL) OR
        (status NOT IN ('completed', 'paused'))
    )
);

-- Journey execution logs table - Detailed logs of journey execution steps
CREATE TABLE IF NOT EXISTS journey_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES journey_executions(id) ON DELETE CASCADE,
    node_id UUID REFERENCES journey_nodes(id),
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journey_execution_logs_action_length CHECK (LENGTH(action) >= 1)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journeys_supplier_id ON journeys(supplier_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_trigger_type ON journeys(trigger_type);

CREATE INDEX IF NOT EXISTS idx_journey_nodes_journey_id ON journey_nodes(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_nodes_type ON journey_nodes(type);

CREATE INDEX IF NOT EXISTS idx_journey_connections_journey_id ON journey_connections(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_connections_from_node ON journey_connections(from_node_id);
CREATE INDEX IF NOT EXISTS idx_journey_connections_to_node ON journey_connections(to_node_id);

CREATE INDEX IF NOT EXISTS idx_journey_executions_journey_id ON journey_executions(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_contact_id ON journey_executions(contact_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_wedding_id ON journey_executions(wedding_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_status ON journey_executions(status);
CREATE INDEX IF NOT EXISTS idx_journey_executions_current_node ON journey_executions(current_node_id);
CREATE INDEX IF NOT EXISTS idx_journey_executions_started_at ON journey_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_journey_execution_logs_execution_id ON journey_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_journey_execution_logs_node_id ON journey_execution_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_journey_execution_logs_executed_at ON journey_execution_logs(executed_at);

-- Enable Row Level Security
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Journeys
DROP POLICY IF EXISTS "Users can view their own journeys" ON journeys;
CREATE POLICY "Users can view their own journeys" ON journeys
    FOR SELECT USING (
        supplier_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create journeys" ON journeys;
CREATE POLICY "Users can create journeys" ON journeys
    FOR INSERT WITH CHECK (
        supplier_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update their own journeys" ON journeys;
CREATE POLICY "Users can update their own journeys" ON journeys
    FOR UPDATE USING (
        supplier_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can delete their own journeys" ON journeys;
CREATE POLICY "Users can delete their own journeys" ON journeys
    FOR DELETE USING (
        supplier_id = auth.uid()
    );

-- RLS Policies for Journey Nodes
DROP POLICY IF EXISTS "Users can manage nodes for their journeys" ON journey_nodes;
CREATE POLICY "Users can manage nodes for their journeys" ON journey_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journeys j
            WHERE j.id = journey_id AND j.supplier_id = auth.uid()
        )
    );

-- RLS Policies for Journey Connections
DROP POLICY IF EXISTS "Users can manage connections for their journeys" ON journey_connections;
CREATE POLICY "Users can manage connections for their journeys" ON journey_connections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journeys j
            WHERE j.id = journey_id AND j.supplier_id = auth.uid()
        )
    );

-- RLS Policies for Journey Executions
DROP POLICY IF EXISTS "Users can view executions for their journeys" ON journey_executions;
CREATE POLICY "Users can view executions for their journeys" ON journey_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journeys j
            WHERE j.id = journey_id AND j.supplier_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage journey executions" ON journey_executions;
CREATE POLICY "System can manage journey executions" ON journey_executions
    FOR ALL USING (true);

-- RLS Policies for Journey Execution Logs
DROP POLICY IF EXISTS "Users can view logs for their journey executions" ON journey_execution_logs;
CREATE POLICY "Users can view logs for their journey executions" ON journey_execution_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journey_executions je
            JOIN journeys j ON je.journey_id = j.id
            WHERE je.id = execution_id AND j.supplier_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can manage journey execution logs" ON journey_execution_logs;
CREATE POLICY "System can manage journey execution logs" ON journey_execution_logs
    FOR ALL USING (true);

-- Create updated_at trigger function if not exists (reuse from user.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_journeys_updated_at ON journeys;
CREATE TRIGGER update_journeys_updated_at 
    BEFORE UPDATE ON journeys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_nodes_updated_at ON journey_nodes;
CREATE TRIGGER update_journey_nodes_updated_at 
    BEFORE UPDATE ON journey_nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_connections_updated_at ON journey_connections;
CREATE TRIGGER update_journey_connections_updated_at 
    BEFORE UPDATE ON journey_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_executions_updated_at ON journey_executions;
CREATE TRIGGER update_journey_executions_updated_at 
    BEFORE UPDATE ON journey_executions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE journeys IS 'Journey automation workflows for suppliers';
COMMENT ON COLUMN journeys.id IS 'Primary key for the journey';
COMMENT ON COLUMN journeys.supplier_id IS 'Reference to the supplier who owns this journey';
COMMENT ON COLUMN journeys.name IS 'Display name for the journey';
COMMENT ON COLUMN journeys.status IS 'Current status: draft, active, paused, or archived';
COMMENT ON COLUMN journeys.trigger_type IS 'What triggers this journey to start';
COMMENT ON COLUMN journeys.trigger_config IS 'JSONB configuration for the trigger';
COMMENT ON COLUMN journeys.settings IS 'JSONB journey settings like timezone, business hours';
COMMENT ON COLUMN journeys.analytics IS 'JSONB analytics data for journey performance';

COMMENT ON TABLE journey_nodes IS 'Individual steps/actions within a journey workflow';
COMMENT ON COLUMN journey_nodes.id IS 'Primary key for the journey node';
COMMENT ON COLUMN journey_nodes.journey_id IS 'Reference to the parent journey';
COMMENT ON COLUMN journey_nodes.type IS 'Type of node: email, sms, wait, condition, etc.';
COMMENT ON COLUMN journey_nodes.position_x IS 'X coordinate for visual editor positioning';
COMMENT ON COLUMN journey_nodes.position_y IS 'Y coordinate for visual editor positioning';
COMMENT ON COLUMN journey_nodes.config IS 'JSONB configuration specific to the node type';

COMMENT ON TABLE journey_connections IS 'Links between journey nodes defining workflow flow';
COMMENT ON COLUMN journey_connections.id IS 'Primary key for the connection';
COMMENT ON COLUMN journey_connections.from_node_id IS 'Source node for this connection';
COMMENT ON COLUMN journey_connections.to_node_id IS 'Destination node for this connection';
COMMENT ON COLUMN journey_connections.condition_expression IS 'Optional condition for following this path';

COMMENT ON TABLE journey_executions IS 'Individual journey runs for specific contacts/weddings';
COMMENT ON COLUMN journey_executions.id IS 'Primary key for the execution';
COMMENT ON COLUMN journey_executions.journey_id IS 'Reference to the journey being executed';
COMMENT ON COLUMN journey_executions.contact_id IS 'Reference to the contact in this execution';
COMMENT ON COLUMN journey_executions.wedding_id IS 'Optional reference to the wedding context';
COMMENT ON COLUMN journey_executions.status IS 'Current execution status';
COMMENT ON COLUMN journey_executions.current_node_id IS 'Current node being processed';
COMMENT ON COLUMN journey_executions.context IS 'JSONB execution context and variables';

COMMENT ON TABLE journey_execution_logs IS 'Detailed logs of journey execution steps and actions';