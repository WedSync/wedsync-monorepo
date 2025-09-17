export type ID = string;
export type UUID = string;
export type Email = string;
export type PhoneNumber = string;
export type URL = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedEntity extends BaseEntity {
  deletedAt?: Date;
}

export type Role = 'admin' | 'supplier' | 'couple' | 'guest';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'scale' | 'enterprise';