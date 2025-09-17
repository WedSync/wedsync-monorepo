import { BaseEntity, ID } from './common';
import { Address } from './user';

export interface Wedding extends BaseEntity {
  coupleId: ID;
  weddingDate: Date;
  ceremonyVenue?: Venue;
  receptionVenue?: Venue;
  guestCount: number;
  estimatedBudget?: number;
  actualBudget?: number;
  theme?: string;
  colorScheme?: string[];
  status: WeddingStatus;
  timeline: WeddingTimeline;
  settings: WeddingSettings;
}

export interface Venue {
  name: string;
  address: Address;
  capacity: number;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export type WeddingStatus = 
  | 'planning' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'postponed';

export interface WeddingTimeline extends BaseEntity {
  weddingId: ID;
  events: TimelineEvent[];
  lastSyncAt: Date;
}

export interface TimelineEvent {
  id: ID;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  assignedSuppliers: ID[];
  status: EventStatus;
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
  isMoveable: boolean;
  dependencies?: ID[]; // other event IDs
}

export type EventStatus = 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface WeddingSettings {
  timezone: string;
  reminderSettings: ReminderSettings;
  privacySettings: WeddingPrivacySettings;
}

export interface ReminderSettings {
  emailReminders: boolean;
  smsReminders: boolean;
  reminderIntervals: number[]; // days before event
}

export interface WeddingPrivacySettings {
  publicTimeline: boolean;
  allowGuestMessages: boolean;
  shareContactInfo: boolean;
}