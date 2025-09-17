import { BaseEntity, Role, UserStatus, Email, PhoneNumber, SubscriptionTier } from './common';

export interface User extends BaseEntity {
  email: Email;
  firstName: string;
  lastName: string;
  phoneNumber?: PhoneNumber;
  avatar?: string;
  role: Role;
  status: UserStatus;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
}

export interface SupplierProfile extends BaseEntity {
  userId: string;
  businessName: string;
  specialization: SupplierSpecialization;
  description?: string;
  website?: string;
  logo?: string;
  address?: Address;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  settings: SupplierSettings;
}

export interface CoupleProfile extends BaseEntity {
  partnerOneId: string;
  partnerTwoId: string;
  relationshipStatus: 'engaged' | 'married';
  sharedEmail?: Email;
  preferences: CouplePreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export type SupplierSpecialization = 
  | 'photographer' 
  | 'videographer' 
  | 'caterer' 
  | 'florist' 
  | 'venue' 
  | 'dj' 
  | 'band' 
  | 'planner' 
  | 'decorator' 
  | 'transportation' 
  | 'other';

export interface SupplierSettings {
  timezone: string;
  workingHours: WorkingHours;
  autoResponder: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bufferTime: number; // minutes
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakStart?: string;
  breakEnd?: string;
}

export interface CouplePreferences {
  communicationMethod: 'email' | 'sms' | 'both';
  timezone: string;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  shareGuestList: boolean;
  shareTimeline: boolean;
  allowSupplierMessages: boolean;
}