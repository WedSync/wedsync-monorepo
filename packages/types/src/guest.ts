import { BaseEntity, ID, Email, PhoneNumber } from './common';

export interface Guest extends BaseEntity {
  weddingId: ID;
  firstName: string;
  lastName: string;
  email?: Email;
  phoneNumber?: PhoneNumber;
  address?: GuestAddress;
  relationship: string;
  isChild: boolean;
  dietaryRequirements: DietaryRequirement[];
  rsvpStatus: RSVPStatus;
  rsvpDate?: Date;
  plusOneAllowed: boolean;
  plusOneDetails?: PlusOneDetails;
  photoGroup?: string;
  tableAssignment?: string;
  notes?: string;
  invitationSentAt?: Date;
  reminderSentAt?: Date;
}

export interface GuestAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DietaryRequirement {
  type: DietaryType;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
}

export type DietaryType = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_allergy'
  | 'shellfish_allergy'
  | 'kosher'
  | 'halal'
  | 'keto'
  | 'other';

export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'maybe';

export interface PlusOneDetails {
  firstName?: string;
  lastName?: string;
  dietaryRequirements?: DietaryRequirement[];
  isChild: boolean;
}

export interface GuestList extends BaseEntity {
  weddingId: ID;
  guests: Guest[];
  totalCount: number;
  rsvpCount: number;
  dietarySummary: DietarySummary;
}

export type DietarySummary = {
  [key in DietaryType]: {
    count: number;
    severity: {
      mild: number;
      moderate: number;
      severe: number;
    };
  };
}