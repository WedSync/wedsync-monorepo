import { TypedSupabaseClient, withErrorHandling } from '@wedsync/database';
import { User, SupplierProfile, CoupleProfile } from '@wedsync/types';
import type { Database } from '@wedsync/database/src/types/database';

export class UserService {
  constructor(private client: TypedSupabaseClient) {}

  // User CRUD operations
  async getUserById(id: string): Promise<User | null> {
    return withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return { data: null, error };
      return { data: this.mapToUser(data), error: null };
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) return { data: null, error };
      return { data: this.mapToUser(data), error: null };
    });
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'supplier' | 'couple' | 'admin';
    phoneNumber?: string;
  }): Promise<User> {
    return withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .insert({
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone_number: userData.phoneNumber,
          status: 'active',
        })
        .select()
        .single();
      
      return { data: this.mapToUser(data), error };
    });
  }

  async updateUser(id: string, updates: Partial<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
  }>): Promise<User> {
    return withErrorHandling(async () => {
      const updateData: any = {};
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.status) updateData.status = updates.status;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      return { data: this.mapToUser(data), error };
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', id);
      
      return { data, error };
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .update({ email_verified_at: new Date().toISOString() })
        .eq('id', id);
      
      return { data, error };
    });
  }

  async verifyPhone(id: string): Promise<void> {
    await withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('users')
        .update({ phone_verified_at: new Date().toISOString() })
        .eq('id', id);
      
      return { data, error };
    });
  }

  // Supplier Profile operations
  async getSupplierProfile(userId: string): Promise<SupplierProfile | null> {
    return withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('supplier_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) return { data: null, error };
      return { data: this.mapToSupplierProfile(data), error: null };
    });
  }

  async createSupplierProfile(profileData: {
    userId: string;
    businessName: string;
    specialization: Database['public']['Enums']['supplier_specialization'];
    description?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<SupplierProfile> {
    return withErrorHandling(async () => {
      const insertData: any = {
        user_id: profileData.userId,
        business_name: profileData.businessName,
        specialization: profileData.specialization,
        description: profileData.description,
        website: profileData.website,
        subscription_tier: 'free',
        settings: {
          timezone: 'UTC',
          workingHours: this.getDefaultWorkingHours(),
          autoResponder: false,
          emailNotifications: true,
          smsNotifications: false,
          bufferTime: 30,
        },
      };

      if (profileData.address) {
        insertData.street = profileData.address.street;
        insertData.city = profileData.address.city;
        insertData.state = profileData.address.state;
        insertData.postal_code = profileData.address.postalCode;
        insertData.country = profileData.address.country;
        insertData.latitude = profileData.address.latitude;
        insertData.longitude = profileData.address.longitude;
      }

      const { data, error } = await this.client
        .from('supplier_profiles')
        .insert(insertData)
        .select()
        .single();
      
      return { data: this.mapToSupplierProfile(data), error };
    });
  }

  async updateSupplierProfile(userId: string, updates: Partial<{
    businessName: string;
    description: string;
    website: string;
    logo: string;
    subscriptionTier: Database['public']['Enums']['subscription_tier'];
    settings: any;
  }>): Promise<SupplierProfile> {
    return withErrorHandling(async () => {
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (updates.businessName) updateData.business_name = updates.businessName;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.logo !== undefined) updateData.logo = updates.logo;
      if (updates.subscriptionTier) updateData.subscription_tier = updates.subscriptionTier;
      if (updates.settings) updateData.settings = updates.settings;

      const { data, error } = await this.client
        .from('supplier_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();
      
      return { data: this.mapToSupplierProfile(data), error };
    });
  }

  // Couple Profile operations
  async getCoupleProfile(partnerOneId: string, partnerTwoId?: string): Promise<CoupleProfile | null> {
    return withErrorHandling(async () => {
      let query = this.client
        .from('couple_profiles')
        .select('*');

      if (partnerTwoId) {
        query = query.or(`partner_one_id.eq.${partnerOneId},partner_two_id.eq.${partnerOneId},partner_one_id.eq.${partnerTwoId},partner_two_id.eq.${partnerTwoId}`);
      } else {
        query = query.or(`partner_one_id.eq.${partnerOneId},partner_two_id.eq.${partnerOneId}`);
      }

      const { data, error } = await query.single();
      
      if (error) return { data: null, error };
      return { data: this.mapToCoupleProfile(data), error: null };
    });
  }

  async createCoupleProfile(profileData: {
    partnerOneId: string;
    partnerTwoId: string;
    relationshipStatus?: 'engaged' | 'married';
    sharedEmail?: string;
    preferences?: any;
  }): Promise<CoupleProfile> {
    return withErrorHandling(async () => {
      const { data, error } = await this.client
        .from('couple_profiles')
        .insert({
          partner_one_id: profileData.partnerOneId,
          partner_two_id: profileData.partnerTwoId,
          relationship_status: profileData.relationshipStatus || 'engaged',
          shared_email: profileData.sharedEmail,
          preferences: profileData.preferences || {
            communicationMethod: 'email',
            timezone: 'UTC',
            privacySettings: {
              shareGuestList: false,
              shareTimeline: false,
              allowSupplierMessages: true,
            },
          },
        })
        .select()
        .single();
      
      return { data: this.mapToCoupleProfile(data), error };
    });
  }

  // Helper methods
  private mapToUser(data: Database['public']['Tables']['users']['Row']): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone_number || undefined,
      avatar: data.avatar || undefined,
      role: data.role as 'admin' | 'supplier' | 'couple',
      status: data.status as 'active' | 'inactive' | 'suspended' | 'pending',
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      emailVerifiedAt: data.email_verified_at ? new Date(data.email_verified_at) : undefined,
      phoneVerifiedAt: data.phone_verified_at ? new Date(data.phone_verified_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToSupplierProfile(data: Database['public']['Tables']['supplier_profiles']['Row']): SupplierProfile {
    const address = data.street ? {
      street: data.street,
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postal_code || '',
      country: data.country || '',
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
    } : undefined;

    return {
      id: data.id,
      userId: data.user_id,
      businessName: data.business_name,
      specialization: data.specialization as any,
      description: data.description || undefined,
      website: data.website || undefined,
      logo: data.logo || undefined,
      address,
      subscriptionTier: data.subscription_tier as any,
      subscriptionExpiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : undefined,
      settings: data.settings as any,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToCoupleProfile(data: Database['public']['Tables']['couple_profiles']['Row']): CoupleProfile {
    return {
      id: data.id,
      partnerOneId: data.partner_one_id,
      partnerTwoId: data.partner_two_id,
      relationshipStatus: data.relationship_status as 'engaged' | 'married',
      sharedEmail: data.shared_email || undefined,
      preferences: data.preferences as any,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private getDefaultWorkingHours() {
    const defaultDay = {
      enabled: true,
      startTime: '09:00',
      endTime: '17:00',
    };

    return {
      monday: defaultDay,
      tuesday: defaultDay,
      wednesday: defaultDay,
      thursday: defaultDay,
      friday: defaultDay,
      saturday: { ...defaultDay, enabled: false },
      sunday: { ...defaultDay, enabled: false },
    };
  }
}

// Factory function for creating UserService instance
export const createUserService = (client: TypedSupabaseClient): UserService => {
  return new UserService(client);
};