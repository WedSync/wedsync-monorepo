import { BaseEntity, ID } from './common';

export interface Message extends BaseEntity {
  conversationId: ID;
  senderId: ID;
  recipientId: ID;
  type: MessageType;
  content: MessageContent;
  status: MessageStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata: MessageMetadata;
}

export type MessageType = 'email' | 'sms' | 'whatsapp' | 'internal';

export interface MessageContent {
  subject?: string; // for email
  body: string;
  attachments?: Attachment[];
  html?: string; // for email
  mediaUrl?: string; // for WhatsApp
}

export interface Attachment {
  id: ID;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export type MessageStatus = 
  | 'draft'
  | 'scheduled'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'bounced'
  | 'spam';

export interface MessageMetadata {
  templateId?: ID;
  journeyId?: ID;
  journeyNodeId?: ID;
  campaignId?: ID;
  priority: MessagePriority;
  tags: string[];
  source: MessageSource;
}

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageSource = 'manual' | 'journey' | 'campaign' | 'system' | 'api';

export interface Conversation extends BaseEntity {
  participants: ID[];
  supplierId: ID;
  weddingId?: ID;
  subject?: string;
  status: ConversationStatus;
  priority: MessagePriority;
  tags: string[];
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  assignedTo?: ID;
}

export type ConversationStatus = 'open' | 'closed' | 'archived' | 'spam';

export interface Template extends BaseEntity {
  supplierId: ID;
  name: string;
  description?: string;
  type: MessageType;
  category: TemplateCategory;
  subject?: string;
  content: string;
  variables: TemplateVariable[];
  isShared: boolean;
  usageCount: number;
  tags: string[];
}

export type TemplateCategory = 
  | 'welcome'
  | 'follow_up'
  | 'reminder'
  | 'confirmation'
  | 'thank_you'
  | 'promotional'
  | 'informational'
  | 'emergency'
  | 'other';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'url';
  description?: string;
  defaultValue?: string;
  required: boolean;
}

export interface Campaign extends BaseEntity {
  supplierId: ID;
  name: string;
  description?: string;
  type: MessageType;
  templateId: ID;
  audience: CampaignAudience;
  schedule: CampaignSchedule;
  status: CampaignStatus;
  analytics: CampaignAnalytics;
}

export interface CampaignAudience {
  segmentId?: ID;
  filters: AudienceFilter[];
  excludeFilters?: AudienceFilter[];
  totalRecipients: number;
}

export interface AudienceFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: Date;
  timezone?: string;
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export interface CampaignAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface ContactSegment extends BaseEntity {
  supplierId: ID;
  name: string;
  description?: string;
  filters: AudienceFilter[];
  contactCount: number;
  isAutoUpdating: boolean;
  lastUpdatedAt: Date;
}