import { User } from './user';
import { Wedding } from './wedding';
import { Supplier } from './supplier';
import { Form, FormSubmission } from './form';
import { Journey } from './journey';
import { Guest } from './guest';
import { Communication } from './communication';
import { ID } from './common';

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Responses
export interface LoginResponse {
  access_token: string;
  user: User;
  supplier?: Supplier;
}

export interface AuthUser {
  id: ID;
  email: string;
  role: 'supplier' | 'couple' | 'admin';
}

// Dashboard Responses
export interface TodayDashboardResponse {
  wedding?: Wedding;
  weather?: Weather;
  directions?: Directions;
  contacts?: Contact[];
}

export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: string;
}

export interface Directions {
  origin: string;
  destination: string;
  duration: string;
  distance: string;
  route: string;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

// Forms API Responses
export interface FormsListResponse {
  forms: Form[];
  pagination: PaginationMeta;
}

export interface FormResponse {
  form: Form;
}

export interface FormSubmissionsResponse {
  submissions: FormSubmission[];
  pagination: PaginationMeta;
}

// Journey API Responses
export interface JourneysListResponse {
  journeys: Journey[];
  pagination: PaginationMeta;
}

export interface JourneyResponse {
  journey: Journey;
}

export interface JourneyEnrollResponse {
  success: boolean;
  enrollmentId: ID;
  message?: string;
}

// Clients API Responses
export interface ClientsListResponse {
  clients: ClientInfo[];
  pagination: PaginationMeta;
}

export interface ClientInfo {
  wedding: Wedding;
  couple: User[];
  status: string;
  lastContact?: Date;
  nextMilestone?: string;
  engagementScore: number;
}

export interface ClientEngagementResponse {
  weddingId: ID;
  overallScore: number;
  metrics: EngagementMetrics;
  timeline: EngagementEvent[];
  recommendations: string[];
}

export interface EngagementMetrics {
  formSubmissions: number;
  journeyProgress: number;
  responseRate: number;
  averageResponseTime: number; // hours
  lastActivity: Date;
}

export interface EngagementEvent {
  type: 'form_submission' | 'journey_step' | 'communication' | 'milestone';
  title: string;
  date: Date;
  score: number;
}

// Communications API Responses
export interface CommunicationsListResponse {
  communications: Communication[];
  pagination: PaginationMeta;
}

export interface CommunicationResponse {
  communication: Communication;
}

// WedMe API Responses
export interface WeddingsListResponse {
  weddings: Wedding[];
  pagination: PaginationMeta;
}

export interface WeddingResponse {
  wedding: Wedding;
}

export interface WeddingDetailsResponse {
  wedding: Wedding;
  suppliers: Supplier[];
  timeline: TimelineEvent[];
  recentActivity: ActivityEvent[];
}

export interface TimelineEvent {
  id: ID;
  title: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed';
  supplierId?: ID;
}

export interface ActivityEvent {
  type: 'task_completed' | 'guest_rsvp' | 'supplier_message' | 'timeline_update';
  title: string;
  description: string;
  date: Date;
  userId?: ID;
}

// Guest Management Responses
export interface GuestsListResponse {
  guests: Guest[];
  summary: GuestSummary;
  pagination: PaginationMeta;
}

export interface GuestSummary {
  total: number;
  attending: number;
  notAttending: number;
  pending: number;
  plusOnes: number;
}

export interface GuestResponse {
  guest: Guest;
}

export interface RSVPResponse {
  success: boolean;
  guest: Guest;
  message?: string;
}

// Task Management Responses
export interface TasksListResponse {
  tasks: Task[];
  summary: TaskSummary;
  pagination: PaginationMeta;
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  assignedTo?: ID[];
  category: string;
  isDayOfTask: boolean;
}

export interface TaskSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TaskResponse {
  task: Task;
}

// Supplier Collaboration Responses
export interface SuppliersListResponse {
  suppliers: SupplierCollaboration[];
  pagination: PaginationMeta;
}

export interface SupplierCollaboration {
  supplier: Supplier;
  serviceType: string;
  contractStatus: 'inquiry' | 'proposal' | 'contracted' | 'completed';
  contactInfo: Contact;
  timeline: TimelineEvent[];
  documents: Document[];
}

export interface Document {
  id: ID;
  filename: string;
  type: 'contract' | 'invoice' | 'image' | 'timeline' | 'other';
  url: string;
  uploadedAt: Date;
  uploadedBy: ID;
}

// Form Submission Response
export interface FormSubmitResponse {
  success: boolean;
  submissionId: ID;
  message?: string;
  redirectUrl?: string;
}

// Error Response Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

// Request Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FormFilters extends PaginationParams {
  wedding_id?: string;
  is_active?: boolean;
  is_template?: boolean;
}

export interface SubmissionFilters extends PaginationParams {
  status?: 'draft' | 'submitted' | 'reviewed' | 'approved';
  date_from?: string;
  date_to?: string;
}

export interface GuestFilters extends PaginationParams {
  rsvp_status?: 'pending' | 'attending' | 'not_attending' | 'maybe';
  has_plus_one?: boolean;
  is_helper?: boolean;
}

export interface TaskFilters extends PaginationParams {
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assigned_to?: string;
  due_date_from?: string;
  due_date_to?: string;
}