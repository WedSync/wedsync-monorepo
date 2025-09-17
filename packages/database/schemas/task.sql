-- Task entity schema for WedSync platform
-- Handles task management for wedding planning and supplier workflows
-- This file defines the tasks, task_assignments, and task_dependencies tables

-- Create custom types for task management
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'waiting', 'completed', 'cancelled', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_type AS ENUM ('planning', 'vendor', 'guest', 'venue', 'admin', 'followup', 'meeting', 'payment', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tasks table - Main task management entity
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',
    type task_type NOT NULL DEFAULT 'planning',
    wedding_id UUID,
    supplier_id UUID,
    created_by UUID NOT NULL,
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes
    tags TEXT[] DEFAULT '{}',
    checklist JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    location TEXT,
    budget_amount DECIMAL(10,2),
    is_milestone BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_config JSONB DEFAULT '{}',
    parent_task_id UUID REFERENCES tasks(id),
    template_id UUID,
    external_id TEXT, -- for integration with other systems
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tasks_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 500),
    CONSTRAINT tasks_status_completed_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed')
    ),
    CONSTRAINT tasks_due_date_logic CHECK (
        due_date IS NULL OR start_date IS NULL OR due_date >= start_date
    ),
    CONSTRAINT tasks_duration_positive CHECK (
        estimated_duration IS NULL OR estimated_duration > 0
    ),
    CONSTRAINT tasks_actual_duration_positive CHECK (
        actual_duration IS NULL OR actual_duration > 0
    ),
    CONSTRAINT tasks_budget_positive CHECK (
        budget_amount IS NULL OR budget_amount >= 0
    )
);

-- Task assignments table - Who is responsible for tasks
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'assignee',
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(task_id, assignee_id, role),
    CONSTRAINT task_assignments_acceptance_logic CHECK (
        accepted_at IS NULL OR declined_at IS NULL
    )
);

-- Task dependencies table - Task prerequisites and relationships
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'blocks',
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(task_id, depends_on_task_id),
    CONSTRAINT task_dependencies_different_tasks CHECK (task_id != depends_on_task_id),
    CONSTRAINT task_dependencies_lag_days CHECK (lag_days >= 0)
);

-- Task comments table - Discussion and updates on tasks
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    mentions UUID[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT task_comments_content_length CHECK (LENGTH(content) >= 1)
);

-- Task time tracking table - Time spent on tasks
CREATE TABLE IF NOT EXISTS task_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- minutes, calculated or manually entered
    description TEXT,
    billable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT task_time_entries_end_after_start CHECK (
        end_time IS NULL OR end_time > start_time
    ),
    CONSTRAINT task_time_entries_duration_positive CHECK (
        duration IS NULL OR duration > 0
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_wedding_id ON tasks(wedding_id);
CREATE INDEX IF NOT EXISTS idx_tasks_supplier_id ON tasks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_milestone ON tasks(is_milestone);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_external_id ON tasks(external_id);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_id ON task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_task_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_id ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_start_time ON task_time_entries(start_time);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tasks
DROP POLICY IF EXISTS "Users can view wedding tasks" ON tasks;
CREATE POLICY "Users can view wedding tasks" ON tasks
    FOR SELECT USING (
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        supplier_id = auth.uid() OR
        created_by = auth.uid() OR
        id IN (
            SELECT ta.task_id FROM task_assignments ta
            WHERE ta.assignee_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND (
            wedding_id IN (
                SELECT w.id FROM weddings w
                JOIN couple_profiles cp ON w.couple_id = cp.id
                WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
            ) OR
            supplier_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Users can update their tasks" ON tasks
    FOR UPDATE USING (
        created_by = auth.uid() OR
        supplier_id = auth.uid() OR
        wedding_id IN (
            SELECT w.id FROM weddings w
            JOIN couple_profiles cp ON w.couple_id = cp.id
            WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
        ) OR
        id IN (
            SELECT ta.task_id FROM task_assignments ta
            WHERE ta.assignee_id = auth.uid()
        )
    );

-- RLS Policies for Task Assignments
DROP POLICY IF EXISTS "Users can view task assignments" ON task_assignments;
CREATE POLICY "Users can view task assignments" ON task_assignments
    FOR SELECT USING (
        assignee_id = auth.uid() OR
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage task assignments" ON task_assignments;
CREATE POLICY "Users can manage task assignments" ON task_assignments
    FOR ALL USING (
        assigned_by = auth.uid() OR
        assignee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for Task Dependencies
DROP POLICY IF EXISTS "Users can view task dependencies" ON task_dependencies;
CREATE POLICY "Users can view task dependencies" ON task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE (t.id = task_id OR t.id = depends_on_task_id) AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage task dependencies" ON task_dependencies;
CREATE POLICY "Users can manage task dependencies" ON task_dependencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for Task Comments
DROP POLICY IF EXISTS "Users can view task comments" ON task_comments;
CREATE POLICY "Users can view task comments" ON task_comments
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.uid() = ANY(mentions) OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                t.id IN (
                    SELECT ta.task_id FROM task_assignments ta
                    WHERE ta.assignee_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "Users can create task comments" ON task_comments;
CREATE POLICY "Users can create task comments" ON task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid() OR
                t.wedding_id IN (
                    SELECT w.id FROM weddings w
                    JOIN couple_profiles cp ON w.couple_id = cp.id
                    WHERE cp.partner_one_id = auth.uid() OR cp.partner_two_id = auth.uid()
                ) OR
                t.id IN (
                    SELECT ta.task_id FROM task_assignments ta
                    WHERE ta.assignee_id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for Task Time Entries
DROP POLICY IF EXISTS "Users can manage their time entries" ON task_time_entries;
CREATE POLICY "Users can manage their time entries" ON task_time_entries
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.id = task_id AND (
                t.created_by = auth.uid() OR
                t.supplier_id = auth.uid()
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
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_assignments_updated_at ON task_assignments;
CREATE TRIGGER update_task_assignments_updated_at 
    BEFORE UPDATE ON task_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON task_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_time_entries_updated_at ON task_time_entries;
CREATE TRIGGER update_task_time_entries_updated_at 
    BEFORE UPDATE ON task_time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE tasks IS 'Task management for wedding planning and supplier workflows';
COMMENT ON COLUMN tasks.id IS 'Primary key for the task';
COMMENT ON COLUMN tasks.title IS 'Task title/summary';
COMMENT ON COLUMN tasks.status IS 'Current task status';
COMMENT ON COLUMN tasks.priority IS 'Task priority level';
COMMENT ON COLUMN tasks.type IS 'Category of task for organization';
COMMENT ON COLUMN tasks.wedding_id IS 'Optional reference to wedding this task belongs to';
COMMENT ON COLUMN tasks.supplier_id IS 'Optional reference to supplier this task belongs to';
COMMENT ON COLUMN tasks.created_by IS 'User who created this task';
COMMENT ON COLUMN tasks.due_date IS 'When this task should be completed';
COMMENT ON COLUMN tasks.checklist IS 'JSONB array of checklist items with completion status';
COMMENT ON COLUMN tasks.is_milestone IS 'Whether this task represents a major milestone';
COMMENT ON COLUMN tasks.is_recurring IS 'Whether this task repeats on a schedule';
COMMENT ON COLUMN tasks.recurrence_config IS 'JSONB configuration for recurring tasks';

COMMENT ON TABLE task_assignments IS 'Assignment of tasks to users with roles and status';
COMMENT ON COLUMN task_assignments.role IS 'Role in the task: assignee, reviewer, observer, etc.';

COMMENT ON TABLE task_dependencies IS 'Dependencies between tasks for workflow management';
COMMENT ON COLUMN task_dependencies.dependency_type IS 'Type of dependency: blocks, relates_to, etc.';
COMMENT ON COLUMN task_dependencies.lag_days IS 'Minimum days between dependency completion and task start';

COMMENT ON TABLE task_comments IS 'Discussion and updates on task progress';
COMMENT ON COLUMN task_comments.is_internal IS 'Whether comment is visible only to internal team';
COMMENT ON COLUMN task_comments.mentions IS 'Array of user IDs mentioned in this comment';

COMMENT ON TABLE task_time_entries IS 'Time tracking for tasks and billing purposes';