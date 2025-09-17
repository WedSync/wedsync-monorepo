import { BaseEntity, ID, Email, PhoneNumber } from './common';

export interface Journey extends BaseEntity {
  supplierId: ID;
  name: string;
  description?: string;
  status: JourneyStatus;
  trigger: JourneyTrigger;
  nodes: JourneyNode[];
  connections: JourneyConnection[];
  settings: JourneySettings;
  analytics: JourneyAnalytics;
}

export type JourneyStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface JourneyTrigger {
  type: 'form_submit' | 'manual' | 'date' | 'event' | 'tag_added';
  formId?: ID;
  eventType?: string;
  tagName?: string;
  scheduledDate?: Date;
}

export interface JourneyNode {
  id: ID;
  type: NodeType;
  position: NodePosition;
  config: NodeConfig;
  conditions?: NodeCondition[];
}

export type NodeType = 
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'form'
  | 'meeting'
  | 'wait'
  | 'condition'
  | 'webhook'
  | 'tag'
  | 'end';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfig {
  email?: EmailConfig;
  sms?: SMSConfig;
  whatsapp?: WhatsAppConfig;
  form?: FormConfig;
  meeting?: MeetingConfig;
  wait?: WaitConfig;
  condition?: ConditionConfig;
  webhook?: WebhookConfig;
  tag?: TagConfig;
}

export interface EmailConfig {
  templateId?: ID;
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: Email;
  attachments?: string[];
}

export interface SMSConfig {
  templateId?: ID;
  content: string;
  fromNumber?: PhoneNumber;
}

export interface WhatsAppConfig {
  templateId?: ID;
  content: string;
  mediaUrl?: string;
}

export interface FormConfig {
  formId: ID;
  autoAssign: boolean;
}

export interface MeetingConfig {
  duration: number; // minutes
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  meetingType: 'in_person' | 'video' | 'phone';
  location?: string;
  videoLink?: string;
  instructions?: string;
}

export interface WaitConfig {
  duration: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  businessHoursOnly: boolean;
}

export interface ConditionConfig {
  conditions: NodeCondition[];
  operator: 'and' | 'or';
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  retryAttempts: number;
}

export interface TagConfig {
  action: 'add' | 'remove';
  tagName: string;
}

export interface NodeCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
}

export interface JourneyConnection {
  id: ID;
  fromNodeId: ID;
  toNodeId: ID;
  condition?: string;
  label?: string;
}

export interface JourneySettings {
  timezone: string;
  businessHours: BusinessHours;
  throttling: ThrottlingSettings;
  abTesting?: ABTestSettings;
}

export interface BusinessHours {
  enabled: boolean;
  schedule: {
    [key: string]: { // day of week
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

export interface ThrottlingSettings {
  maxEmailsPerDay: number;
  maxSMSPerDay: number;
  minTimeBetweenMessages: number; // minutes
}

export interface ABTestSettings {
  enabled: boolean;
  variants: ABTestVariant[];
  trafficSplit: number[]; // percentages that sum to 100
  winnerCriteria: 'conversion_rate' | 'engagement_rate';
  testDuration: number; // days
}

export interface ABTestVariant {
  name: string;
  nodeOverrides: Record<ID, Partial<NodeConfig>>;
}

export interface JourneyAnalytics {
  totalEntered: number;
  totalCompleted: number;
  completionRate: number;
  averageCompletionTime: number; // hours
  nodeAnalytics: NodeAnalytics[];
}

export interface NodeAnalytics {
  nodeId: ID;
  entered: number;
  completed: number;
  bounced: number;
  averageTimeSpent: number; // minutes
}

export interface JourneyExecution extends BaseEntity {
  journeyId: ID;
  contactId: ID;
  weddingId?: ID;
  status: ExecutionStatus;
  currentNodeId?: ID;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  context: Record<string, any>;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';