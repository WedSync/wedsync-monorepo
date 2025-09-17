import type { 
  Wedding, 
  WeddingStatus, 
  WeddingTimeline, 
  TimelineEvent, 
  Venue, 
  ID 
} from '@wedsync/types';

export interface WeddingService {
  // Core CRUD operations
  createWedding(data: CreateWeddingData): Promise<Wedding>;
  getWedding(id: ID): Promise<Wedding | null>;
  updateWedding(id: ID, data: Partial<Wedding>): Promise<Wedding>;
  deleteWedding(id: ID): Promise<boolean>;
  
  // Wedding status management
  updateWeddingStatus(id: ID, status: WeddingStatus): Promise<Wedding>;
  
  // Timeline management
  getWeddingTimeline(weddingId: ID): Promise<WeddingTimeline | null>;
  updateTimeline(weddingId: ID, events: TimelineEvent[]): Promise<WeddingTimeline>;
  addTimelineEvent(weddingId: ID, event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent>;
  updateTimelineEvent(weddingId: ID, eventId: ID, data: Partial<TimelineEvent>): Promise<TimelineEvent>;
  removeTimelineEvent(weddingId: ID, eventId: ID): Promise<boolean>;
  
  // Venue management
  updateCeremonyVenue(weddingId: ID, venue: Venue): Promise<Wedding>;
  updateReceptionVenue(weddingId: ID, venue: Venue): Promise<Wedding>;
  
  // Guest management
  updateGuestCount(weddingId: ID, count: number): Promise<Wedding>;
  
  // Budget management
  updateBudget(weddingId: ID, estimated?: number, actual?: number): Promise<Wedding>;
  
  // Wedding search and filtering
  getWeddingsByCouple(coupleId: ID): Promise<Wedding[]>;
  getWeddingsByDateRange(startDate: Date, endDate: Date): Promise<Wedding[]>;
  getWeddingsByStatus(status: WeddingStatus): Promise<Wedding[]>;
}

export interface CreateWeddingData {
  coupleId: ID;
  weddingDate: Date;
  guestCount: number;
  estimatedBudget?: number;
  theme?: string;
  colorScheme?: string[];
  ceremonyVenue?: Venue;
  receptionVenue?: Venue;
}

export interface WeddingValidationResult {
  isValid: boolean;
  errors: WeddingValidationError[];
}

export interface WeddingValidationError {
  field: string;
  message: string;
  code: string;
}

export class WeddingServiceImpl implements WeddingService {
  private readonly dbClient: any; // Replace with actual DB client type
  
  constructor(dbClient: any) {
    this.dbClient = dbClient;
  }
  
  async createWedding(data: CreateWeddingData): Promise<Wedding> {
    const validation = this.validateWeddingData(data);
    if (!validation.isValid) {
      throw new Error(`Wedding validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    const wedding: Wedding = {
      id: this.generateId(),
      coupleId: data.coupleId,
      weddingDate: data.weddingDate,
      ceremonyVenue: data.ceremonyVenue,
      receptionVenue: data.receptionVenue,
      guestCount: data.guestCount,
      estimatedBudget: data.estimatedBudget,
      theme: data.theme,
      colorScheme: data.colorScheme,
      status: 'planning',
      timeline: this.createDefaultTimeline(),
      settings: this.createDefaultSettings(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to database
    const saved = await this.dbClient.wedding.create({ data: wedding });
    return saved;
  }
  
  async getWedding(id: ID): Promise<Wedding | null> {
    return await this.dbClient.wedding.findUnique({
      where: { id },
      include: {
        timeline: {
          include: { events: true }
        }
      }
    });
  }
  
  async updateWedding(id: ID, data: Partial<Wedding>): Promise<Wedding> {
    const existingWedding = await this.getWedding(id);
    if (!existingWedding) {
      throw new Error(`Wedding with id ${id} not found`);
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date()
    };
    
    return await this.dbClient.wedding.update({
      where: { id },
      data: updatedData,
      include: {
        timeline: {
          include: { events: true }
        }
      }
    });
  }
  
  async deleteWedding(id: ID): Promise<boolean> {
    try {
      await this.dbClient.wedding.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async updateWeddingStatus(id: ID, status: WeddingStatus): Promise<Wedding> {
    return await this.updateWedding(id, { status });
  }
  
  async getWeddingTimeline(weddingId: ID): Promise<WeddingTimeline | null> {
    return await this.dbClient.weddingTimeline.findUnique({
      where: { weddingId },
      include: { events: true }
    });
  }
  
  async updateTimeline(weddingId: ID, events: TimelineEvent[]): Promise<WeddingTimeline> {
    const timeline = await this.getWeddingTimeline(weddingId);
    if (!timeline) {
      throw new Error(`Timeline for wedding ${weddingId} not found`);
    }
    
    return await this.dbClient.weddingTimeline.update({
      where: { weddingId },
      data: {
        events: events,
        lastSyncAt: new Date(),
        updatedAt: new Date()
      },
      include: { events: true }
    });
  }
  
  async addTimelineEvent(weddingId: ID, event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
    const timeline = await this.getWeddingTimeline(weddingId);
    if (!timeline) {
      throw new Error(`Timeline for wedding ${weddingId} not found`);
    }
    
    const newEvent: TimelineEvent = {
      id: this.generateId(),
      ...event
    };
    
    const updatedEvents = [...timeline.events, newEvent];
    await this.updateTimeline(weddingId, updatedEvents);
    
    return newEvent;
  }
  
  async updateTimelineEvent(weddingId: ID, eventId: ID, data: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const timeline = await this.getWeddingTimeline(weddingId);
    if (!timeline) {
      throw new Error(`Timeline for wedding ${weddingId} not found`);
    }
    
    const eventIndex = timeline.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error(`Event ${eventId} not found in timeline`);
    }
    
    const updatedEvent = { ...timeline.events[eventIndex], ...data };
    const updatedEvents = [...timeline.events];
    updatedEvents[eventIndex] = updatedEvent;
    
    await this.updateTimeline(weddingId, updatedEvents);
    return updatedEvent;
  }
  
  async removeTimelineEvent(weddingId: ID, eventId: ID): Promise<boolean> {
    const timeline = await this.getWeddingTimeline(weddingId);
    if (!timeline) {
      return false;
    }
    
    const updatedEvents = timeline.events.filter(e => e.id !== eventId);
    if (updatedEvents.length === timeline.events.length) {
      return false; // Event not found
    }
    
    await this.updateTimeline(weddingId, updatedEvents);
    return true;
  }
  
  async updateCeremonyVenue(weddingId: ID, venue: Venue): Promise<Wedding> {
    return await this.updateWedding(weddingId, { ceremonyVenue: venue });
  }
  
  async updateReceptionVenue(weddingId: ID, venue: Venue): Promise<Wedding> {
    return await this.updateWedding(weddingId, { receptionVenue: venue });
  }
  
  async updateGuestCount(weddingId: ID, count: number): Promise<Wedding> {
    if (count < 0) {
      throw new Error('Guest count cannot be negative');
    }
    return await this.updateWedding(weddingId, { guestCount: count });
  }
  
  async updateBudget(weddingId: ID, estimated?: number, actual?: number): Promise<Wedding> {
    const updates: Partial<Wedding> = {};
    
    if (estimated !== undefined) {
      if (estimated < 0) {
        throw new Error('Estimated budget cannot be negative');
      }
      updates.estimatedBudget = estimated;
    }
    
    if (actual !== undefined) {
      if (actual < 0) {
        throw new Error('Actual budget cannot be negative');
      }
      updates.actualBudget = actual;
    }
    
    return await this.updateWedding(weddingId, updates);
  }
  
  async getWeddingsByCouple(coupleId: ID): Promise<Wedding[]> {
    return await this.dbClient.wedding.findMany({
      where: { coupleId },
      include: {
        timeline: {
          include: { events: true }
        }
      },
      orderBy: { weddingDate: 'asc' }
    });
  }
  
  async getWeddingsByDateRange(startDate: Date, endDate: Date): Promise<Wedding[]> {
    return await this.dbClient.wedding.findMany({
      where: {
        weddingDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        timeline: {
          include: { events: true }
        }
      },
      orderBy: { weddingDate: 'asc' }
    });
  }
  
  async getWeddingsByStatus(status: WeddingStatus): Promise<Wedding[]> {
    return await this.dbClient.wedding.findMany({
      where: { status },
      include: {
        timeline: {
          include: { events: true }
        }
      },
      orderBy: { weddingDate: 'asc' }
    });
  }
  
  // Private helper methods
  private validateWeddingData(data: CreateWeddingData): WeddingValidationResult {
    const errors: WeddingValidationError[] = [];
    
    // Validate wedding date is in the future
    if (data.weddingDate <= new Date()) {
      errors.push({
        field: 'weddingDate',
        message: 'Wedding date must be in the future',
        code: 'INVALID_DATE'
      });
    }
    
    // Validate guest count
    if (data.guestCount < 1) {
      errors.push({
        field: 'guestCount',
        message: 'Guest count must be at least 1',
        code: 'INVALID_GUEST_COUNT'
      });
    }
    
    // Validate budget if provided
    if (data.estimatedBudget !== undefined && data.estimatedBudget < 0) {
      errors.push({
        field: 'estimatedBudget',
        message: 'Estimated budget cannot be negative',
        code: 'INVALID_BUDGET'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private createDefaultTimeline(): WeddingTimeline {
    return {
      id: this.generateId(),
      weddingId: '', // Will be set when wedding is created
      events: [],
      lastSyncAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  private createDefaultSettings() {
    return {
      timezone: 'UTC',
      reminderSettings: {
        emailReminders: true,
        smsReminders: false,
        reminderIntervals: [30, 7, 1] // 30 days, 7 days, 1 day before
      },
      privacySettings: {
        publicTimeline: false,
        allowGuestMessages: true,
        shareContactInfo: true
      }
    };
  }
  
  private generateId(): string {
    return `wedding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility functions for wedding operations
export const weddingUtils = {
  /**
   * Calculate the number of days until the wedding
   */
  getDaysUntilWedding(weddingDate: Date): number {
    const today = new Date();
    const timeDiff = weddingDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },
  
  /**
   * Check if wedding is approaching (within 30 days)
   */
  isWeddingApproaching(weddingDate: Date, daysThreshold: number = 30): boolean {
    const daysUntil = this.getDaysUntilWedding(weddingDate);
    return daysUntil <= daysThreshold && daysUntil > 0;
  },
  
  /**
   * Format wedding status for display
   */
  formatWeddingStatus(status: WeddingStatus): string {
    const statusMap: Record<WeddingStatus, string> = {
      planning: 'Planning',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      postponed: 'Postponed'
    };
    return statusMap[status] || status;
  },
  
  /**
   * Calculate wedding budget utilization percentage
   */
  calculateBudgetUtilization(estimated?: number, actual?: number): number {
    if (!estimated || !actual) return 0;
    return Math.round((actual / estimated) * 100);
  },
  
  /**
   * Validate timeline events for conflicts
   */
  validateTimelineEvents(events: TimelineEvent[]): { hasConflicts: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (this.eventsOverlap(event1, event2)) {
          conflicts.push(`${event1.title} overlaps with ${event2.title}`);
        }
      }
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  },
  
  /**
   * Check if two timeline events overlap
   */
  eventsOverlap(event1: TimelineEvent, event2: TimelineEvent): boolean {
    const start1 = event1.startTime.getTime();
    const end1 = event1.endTime?.getTime() || start1;
    const start2 = event2.startTime.getTime();
    const end2 = event2.endTime?.getTime() || start2;
    
    return start1 < end2 && start2 < end1;
  }
};