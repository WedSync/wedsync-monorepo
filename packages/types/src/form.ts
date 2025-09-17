import { BaseEntity, ID } from './common';

export interface Form extends BaseEntity {
  supplierId: ID;
  name: string;
  description?: string;
  version: number;
  status: FormStatus;
  fields: FormField[];
  logic: FormLogic[];
  branding: FormBranding;
  settings: FormSettings;
  analytics: FormAnalytics;
}

export type FormStatus = 'draft' | 'published' | 'archived';

export interface FormField {
  id: ID;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  validation: FieldValidation;
  options?: FieldOption[];
  defaultValue?: any;
  isReadOnly: boolean;
  isFromWedMe: boolean; // auto-populated from WedMe
  gridColumn: 1 | 2 | 3 | 4;
  order: number;
}

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'address'
  | 'photogroup'
  | 'musiclist'
  | 'dietarymatrix'
  | 'signature';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  fileTypes?: string[];
  maxFileSize?: number; // bytes
  maxFiles?: number;
}

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  selected?: boolean;
}

export interface FormLogic {
  id: ID;
  trigger: LogicTrigger;
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface LogicTrigger {
  fieldId: ID;
  event: 'change' | 'blur' | 'focus';
}

export interface LogicCondition {
  fieldId: ID;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface LogicAction {
  type: 'show' | 'hide' | 'require' | 'unrequire' | 'set_value' | 'clear_value' | 'navigate_to_page';
  targetFieldId?: ID;
  value?: any;
  pageNumber?: number;
}

export interface FormBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCSS?: string;
}

export interface FormSettings {
  multiPage: boolean;
  progressBar: boolean;
  saveProgress: boolean;
  submitButtonText: string;
  thankYouMessage: string;
  redirectUrl?: string;
  allowDrafts: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
  submitLimit?: number;
}

export interface FormAnalytics {
  views: number;
  starts: number;
  completions: number;
  abandonmentRate: number;
  averageCompletionTime: number; // seconds
  fieldAnalytics: FieldAnalytics[];
}

export interface FieldAnalytics {
  fieldId: ID;
  interactions: number;
  abandonments: number;
  averageTime: number; // seconds
  errorRate: number;
}

export interface FormSubmission extends BaseEntity {
  formId: ID;
  weddingId?: ID;
  respondentEmail?: string;
  responses: FormResponse[];
  status: SubmissionStatus;
  completedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type SubmissionStatus = 'draft' | 'completed' | 'archived';

export interface FormResponse {
  fieldId: ID;
  value: any;
  updatedAt: Date;
}