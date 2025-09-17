import { BaseEntity, ID } from './common';
import { Address, SupplierSpecialization, SupplierSettings } from './user';

export interface Supplier extends BaseEntity {
  userId: ID;
  businessName: string;
  specialization: SupplierSpecialization;
  description?: string;
  website?: string;
  phone?: string;
  address?: Address;
  pricingTier: PricingTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
  settings: SupplierSettings;
  verificationStatus: VerificationStatus;
}

export type PricingTier = 'free' | 'starter' | 'professional' | 'scale' | 'enterprise';

export type SubscriptionStatus = 'active' | 'cancelled' | 'paused';

export type VerificationStatus = 'unverified' | 'verified' | 'premium';

export interface SupplierWedding extends BaseEntity {
  supplierId: ID;
  weddingId: ID;
  serviceType: string;
  contractStatus: ContractStatus;
  contractValue?: number;
  bookingConfirmedAt?: Date;
  serviceDate?: Date;
  timelineItems?: SupplierTimelineItem[];
  collaborationScore?: number;
}

export type ContractStatus = 'inquiry' | 'proposal' | 'contracted' | 'completed';

export interface SupplierTimelineItem {
  id: ID;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
  isMoveable: boolean;
  dependencies?: ID[];
}

export interface ClientNote extends BaseEntity {
  supplierId: ID;
  weddingId: ID;
  authorId: ID;
  content: string;
  isPrivate: boolean;
  tags?: string[];
}

export interface SupplierMetrics {
  totalWeddings: number;
  activeWeddings: number;
  completedWeddings: number;
  averageCollaborationScore: number;
  totalRevenue: number;
  formSubmissions: number;
  journeyEnrollments: number;
  responseRate: number;
  averageResponseTime: number; // minutes
}

export interface SupplierAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: SupplierMetrics;
  trends: {
    bookings: TrendData;
    revenue: TrendData;
    engagement: TrendData;
  };
}

export interface TrendData {
  current: number;
  previous: number;
  changePercent: number;
  isPositive: boolean;
}