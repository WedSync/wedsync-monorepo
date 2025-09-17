# Data Model: WedSync & WedMe Platform

**Date**: 2025-09-16  
**Feature**: WedSync & WedMe Comprehensive Wedding Platform  
**Database**: Supabase PostgreSQL with Row Level Security (RLS)

## Core Entities

### User
Primary authentication entity for all platform users.

**Fields**:
- `id` (UUID, Primary Key) - Supabase auth.users reference
- `email` (String, Unique, Required) - User email address
- `role` (Enum: supplier, couple, admin) - User type
- `created_at` (Timestamp) - Account creation
- `updated_at` (Timestamp) - Last profile update
- `is_active` (Boolean, Default: true) - Account status
- `last_login_at` (Timestamp) - Last authentication

**Relationships**:
- One-to-One with Supplier (if role = supplier)
- Many-to-Many with Wedding via CoupleWedding (if role = couple)
- One-to-Many with AuditLog

### Supplier
Business entity representing wedding service providers.

**Fields**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → User.id) - Owner account
- `business_name` (String, Required) - Public business name
- `specialization` (Enum: photographer, dj, florist, caterer, venue, planner, other)
- `description` (Text) - Business description
- `website` (String) - Business website URL
- `phone` (String) - Business phone number
- `address` (JSON) - Business address with geo coordinates
- `pricing_tier` (Enum: free, starter, professional, scale, enterprise)
- `subscription_status` (Enum: active, cancelled, paused) 
- `subscription_ends_at` (Timestamp) - Current subscription end date
- `settings` (JSON) - Supplier preferences and configuration
- `verification_status` (Enum: unverified, verified, premium)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- One-to-Many with Form
- One-to-Many with Journey
- One-to-Many with SupplierWedding
- One-to-Many with Communication
- One-to-Many with ClientNote
- Many-to-Many with Wedding via SupplierWedding

**Validation Rules**:
- business_name must be unique within specialization + location
- website must be valid URL format if provided
- pricing_tier determines feature access

### Wedding
Central entity representing a wedding event.

**Fields**:
- `id` (UUID, Primary Key)
- `title` (String, Required) - Wedding title/name
- `wedding_date` (Date, Required) - Ceremony date
- `ceremony_venue_id` (UUID, Foreign Key → Venue.id) - Ceremony location
- `reception_venue_id` (UUID, Foreign Key → Venue.id) - Reception location
- `guest_count_estimated` (Integer) - Estimated guest count
- `guest_count_confirmed` (Integer) - Confirmed RSVP count
- `budget_total` (Decimal) - Total wedding budget
- `theme` (String) - Wedding theme/style
- `status` (Enum: planning, confirmed, completed, cancelled)
- `timeline` (JSON) - Master wedding timeline
- `core_details_complete` (Boolean, Default: false) - Core fields completion status
- `emergency_contacts` (JSON) - Day-of emergency contacts
- `special_requirements` (Text) - Cultural/religious requirements
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-Many with User via CoupleWedding (couples)
- Many-to-Many with Supplier via SupplierWedding
- One-to-Many with Guest
- One-to-Many with Task
- One-to-Many with WeddingDocument
- One-to-Many with FormSubmission
- One-to-Many with Communication
- Many-to-One with Venue (ceremony and reception)

**Validation Rules**:
- wedding_date must be future date
- guest_count_confirmed <= guest_count_estimated
- budget_total >= 0

### Guest
Individual attendee of a wedding.

**Fields**:
- `id` (UUID, Primary Key)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `first_name` (String, Required) - Guest first name
- `last_name` (String, Required) - Guest last name  
- `email` (String) - Contact email
- `phone` (String) - Contact phone
- `relationship` (String) - Relationship to couple
- `rsvp_status` (Enum: pending, attending, not_attending, maybe)
- `rsvp_responded_at` (Timestamp) - RSVP response time
- `dietary_requirements` (JSON) - Allergies and dietary needs
- `plus_one_allowed` (Boolean, Default: false) - Plus one permission
- `plus_one_name` (String) - Plus one guest name
- `photo_groups` (JSON Array) - Photo grouping assignments
- `table_assignment` (String) - Reception table assignment
- `special_notes` (Text) - Additional guest notes
- `is_helper` (Boolean, Default: false) - Wedding party/helper status
- `helper_role` (String) - Specific helper responsibilities
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Wedding
- One-to-Many with TaskAssignment (if is_helper = true)

**Validation Rules**:
- email format validation if provided
- rsvp_responded_at required if rsvp_status != pending
- plus_one_name required if plus_one_allowed = true and attending

### Venue
Wedding venue entity for ceremony and reception locations.

**Fields**:
- `id` (UUID, Primary Key)
- `name` (String, Required) - Venue name
- `venue_type` (Enum: ceremony, reception, both) - Venue purpose
- `address` (JSON) - Full address with coordinates
- `contact_info` (JSON) - Venue contact details
- `capacity_max` (Integer) - Maximum guest capacity
- `restrictions` (JSON) - Venue restrictions (sound, decorations, etc.)
- `amenities` (JSON Array) - Available amenities
- `coordinator_name` (String) - Venue coordinator
- `coordinator_contact` (JSON) - Coordinator contact info
- `parking_info` (Text) - Parking instructions
- `accessibility_info` (Text) - Accessibility features
- `weather_contingency` (Text) - Bad weather plans
- `load_in_instructions` (Text) - Vendor load-in procedures
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- One-to-Many with Wedding (as ceremony or reception venue)

### Form
Customizable data collection forms created by suppliers.

**Fields**:
- `id` (UUID, Primary Key)
- `supplier_id` (UUID, Foreign Key → Supplier.id, Required)
- `wedding_id` (UUID, Foreign Key → Wedding.id) - Optional wedding-specific form
- `name` (String, Required) - Form display name
- `description` (Text) - Form purpose description
- `fields_schema` (JSON, Required) - Form field definitions
- `conditional_logic` (JSON) - Field display conditions
- `branding` (JSON) - Custom styling and branding
- `is_template` (Boolean, Default: false) - Reusable template flag
- `is_active` (Boolean, Default: true) - Form availability status
- `submission_count` (Integer, Default: 0) - Total submissions
- `completion_rate` (Decimal) - Form completion percentage
- `ai_generated` (Boolean, Default: false) - AI-created form flag
- `ai_prompt` (Text) - Original AI generation prompt
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Supplier
- One-to-Many with FormSubmission
- Many-to-One with Wedding (optional)

**Validation Rules**:
- fields_schema must contain at least one field
- name must be unique per supplier

### FormSubmission
Responses submitted to supplier forms by couples.

**Fields**:
- `id` (UUID, Primary Key)
- `form_id` (UUID, Foreign Key → Form.id, Required)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `submitted_by` (UUID, Foreign Key → User.id, Required) - Submitting user
- `responses` (JSON, Required) - Field responses
- `status` (Enum: draft, submitted, reviewed, approved)
- `submission_source` (String) - Submission context/source
- `time_to_complete` (Integer) - Completion time in seconds
- `ip_address` (String) - Submission IP for security
- `submitted_at` (Timestamp) - Submission timestamp
- `reviewed_at` (Timestamp) - Review timestamp
- `notes` (Text) - Supplier notes on submission
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Form
- Many-to-One with Wedding
- Many-to-One with User (submitted_by)

**Validation Rules**:
- responses must match form fields_schema
- submitted_at required if status = submitted

### Journey
Automated workflow sequences created by suppliers.

**Fields**:
- `id` (UUID, Primary Key)
- `supplier_id` (UUID, Foreign Key → Supplier.id, Required)
- `name` (String, Required) - Journey display name
- `description` (Text) - Journey purpose
- `workflow_definition` (JSON, Required) - Node and connection definitions
- `trigger_conditions` (JSON) - Journey start conditions
- `is_active` (Boolean, Default: true) - Journey status
- `is_template` (Boolean, Default: false) - Reusable template flag
- `enrollment_count` (Integer, Default: 0) - Total enrollments
- `completion_rate` (Decimal) - Journey completion percentage
- `ab_test_variant` (String) - A/B test variant identifier
- `performance_metrics` (JSON) - Engagement and conversion stats
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Supplier
- One-to-Many with JourneyEnrollment

**Validation Rules**:
- workflow_definition must contain at least one node
- name must be unique per supplier

### JourneyEnrollment
Individual wedding enrollment in a supplier journey.

**Fields**:
- `id` (UUID, Primary Key)
- `journey_id` (UUID, Foreign Key → Journey.id, Required)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `current_node` (String) - Current workflow position
- `status` (Enum: active, completed, paused, cancelled)
- `enrolled_at` (Timestamp) - Journey start time
- `completed_at` (Timestamp) - Journey completion time
- `progress_data` (JSON) - Node completion tracking
- `custom_variables` (JSON) - Journey-specific variables
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Journey
- Many-to-One with Wedding

### Task
Assignable items for wedding planning and execution.

**Fields**:
- `id` (UUID, Primary Key)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `created_by` (UUID, Foreign Key → User.id, Required) - Task creator
- `title` (String, Required) - Task name
- `description` (Text) - Detailed task description
- `priority` (Enum: low, medium, high, urgent) - Task priority
- `status` (Enum: pending, in_progress, completed, cancelled)
- `category` (String) - Task category/type
- `due_date` (Date) - Task deadline
- `estimated_duration` (Integer) - Minutes to complete
- `is_day_of_task` (Boolean, Default: false) - Wedding day task flag
- `location` (String) - Task location if relevant
- `dependencies` (JSON Array) - Dependent task IDs
- `completion_notes` (Text) - Completion details
- `completed_at` (Timestamp) - Completion timestamp
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Wedding
- Many-to-One with User (created_by)
- One-to-Many with TaskAssignment
- Many-to-Many with Guest via TaskAssignment (assignees)

### Communication
Messages and communication history between parties.

**Fields**:
- `id` (UUID, Primary Key)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `sender_id` (UUID, Foreign Key → User.id, Required) - Message sender
- `recipient_id` (UUID, Foreign Key → User.id, Required) - Message recipient
- `message_type` (Enum: email, sms, whatsapp, internal) - Communication channel
- `subject` (String) - Message subject (email only)
- `content` (Text, Required) - Message content
- `template_id` (String) - Template used if applicable
- `status` (Enum: draft, sent, delivered, read, failed)
- `external_id` (String) - External service message ID
- `delivery_details` (JSON) - Delivery status information
- `thread_id` (UUID) - Conversation thread identifier
- `is_automated` (Boolean, Default: false) - Journey-generated message
- `scheduled_for` (Timestamp) - Scheduled send time
- `sent_at` (Timestamp) - Actual send time
- `delivered_at` (Timestamp) - Delivery confirmation
- `read_at` (Timestamp) - Read confirmation
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Wedding
- Many-to-One with User (sender)
- Many-to-One with User (recipient)

**Validation Rules**:
- content required and non-empty
- scheduled_for must be future time if set
- subject required for email message_type

### Document
File storage and sharing system for wedding-related documents.

**Fields**:
- `id` (UUID, Primary Key)
- `wedding_id` (UUID, Foreign Key → Wedding.id, Required)
- `uploaded_by` (UUID, Foreign Key → User.id, Required) - File uploader
- `filename` (String, Required) - Original filename
- `file_path` (String, Required) - Storage path/URL
- `file_size` (Integer, Required) - File size in bytes
- `mime_type` (String, Required) - File MIME type
- `document_type` (Enum: contract, invoice, image, timeline, other)
- `description` (Text) - Document description
- `is_shared_with_couple` (Boolean, Default: false) - Couple visibility
- `is_shared_with_suppliers` (Boolean, Default: false) - Supplier visibility
- `access_permissions` (JSON) - Fine-grained access control
- `version` (Integer, Default: 1) - Document version number
- `previous_version_id` (UUID) - Previous version reference
- `signature_required` (Boolean, Default: false) - Requires signature
- `signed_at` (Timestamp) - Signature timestamp
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**Relationships**:
- Many-to-One with Wedding
- Many-to-One with User (uploaded_by)
- Self-referential (version history)

**Validation Rules**:
- file_size must be > 0
- mime_type must match file extension
- version must increment for same filename

## Relationship Tables

### CoupleWedding
Links couples to their weddings (many-to-many).

**Fields**:
- `user_id` (UUID, Foreign Key → User.id)
- `wedding_id` (UUID, Foreign Key → Wedding.id)
- `role` (Enum: bride, groom, partner, planner) - Couple role
- `permissions` (JSON) - Access permissions
- `is_primary_contact` (Boolean, Default: false) - Primary contact flag
- `created_at` (Timestamp)

### SupplierWedding
Links suppliers to weddings they're working on (many-to-many).

**Fields**:
- `supplier_id` (UUID, Foreign Key → Supplier.id)
- `wedding_id` (UUID, Foreign Key → Wedding.id)
- `service_type` (String) - Specific service being provided
- `contract_status` (Enum: inquiry, proposal, contracted, completed)
- `contract_value` (Decimal) - Service contract amount
- `booking_confirmed_at` (Timestamp) - Booking confirmation
- `service_date` (Date) - Service delivery date
- `timeline_items` (JSON) - Supplier-specific timeline
- `collaboration_score` (Integer) - Performance rating
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### TaskAssignment
Assigns tasks to wedding party members or helpers.

**Fields**:
- `task_id` (UUID, Foreign Key → Task.id)
- `guest_id` (UUID, Foreign Key → Guest.id)
- `assigned_by` (UUID, Foreign Key → User.id)
- `assigned_at` (Timestamp)
- `accepted_at` (Timestamp)
- `status` (Enum: assigned, accepted, declined, completed)
- `notes` (Text) - Assignment notes

## Data Validation and Constraints

### Business Rules
1. **Wedding Dates**: Must be future dates (except for completed weddings)
2. **Guest Capacity**: Confirmed guests cannot exceed venue capacity
3. **Supplier Limits**: Free tier suppliers limited to 3 active weddings
4. **Form Logic**: Conditional fields must reference existing fields
5. **Journey Nodes**: Must form valid workflow graph (no orphaned nodes)
6. **Timeline Conflicts**: Supplier timelines cannot overlap without buffers

### Data Integrity
1. **Soft Deletes**: Critical entities use soft delete (is_deleted flag)
2. **Audit Trail**: All data changes logged with user and timestamp
3. **Data Encryption**: PII fields encrypted at database level
4. **Backup Strategy**: Point-in-time recovery with 30-day retention

### Performance Considerations
1. **Indexing**: Database indexes on frequent query columns
2. **Partitioning**: Large tables partitioned by date ranges
3. **Read Replicas**: Read-only queries routed to replicas
4. **Caching**: Frequently accessed data cached with Redis

## Multi-Tenancy Implementation

### Row Level Security (RLS)
Each table includes RLS policies to ensure data isolation:

```sql
-- Example RLS policy for Supplier table
CREATE POLICY "Suppliers can only access their own data" 
  ON suppliers FOR ALL 
  USING (user_id = auth.uid());

-- Example RLS policy for Wedding table  
CREATE POLICY "Couples can access their weddings"
  ON weddings FOR ALL
  USING (
    id IN (
      SELECT wedding_id FROM couple_wedding 
      WHERE user_id = auth.uid()
    )
  );
```

### Data Isolation Levels
1. **Supplier Level**: Suppliers only see their own data
2. **Wedding Level**: Couples only see their wedding data  
3. **Admin Level**: Platform admins see aggregated, anonymized data
4. **Cross-Wedding**: Suppliers see data for weddings they're contracted for

---

*Data model complete - ready for contract generation*