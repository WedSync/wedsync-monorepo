import type { User, Role, UserStatus, ID } from '@wedsync/types';
import { isValidEmail } from './validation';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: ID;
  email: string;
  role: Role;
  status: UserStatus;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneNumber?: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiry: number;
  refreshTokenExpiry: number;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
}

export interface SessionData {
  userId: ID;
  email: string;
  role: Role;
  permissions: Permission[];
  loginAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  private readonly config: AuthConfig;
  private readonly dbClient: any; // Replace with actual DB client type
  
  constructor(config: AuthConfig, dbClient: any) {
    this.config = config;
    this.dbClient = dbClient;
  }
  
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ token: AuthToken; user: AuthUser }> {
    const validation = this.validateLoginCredentials(credentials);
    if (!validation.isValid) {
      throw new Error(`Login validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Check for account lockout
    await this.checkAccountLockout(credentials.email);
    
    // Find user by email
    const user = await this.dbClient.user.findUnique({
      where: { email: credentials.email },
      include: { supplierProfile: true, coupleProfile: true }
    });
    
    if (!user) {
      await this.recordFailedLogin(credentials.email);
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.recordFailedLogin(credentials.email);
      throw new Error('Invalid credentials');
    }
    
    // Check user status
    if (user.status !== 'active') {
      throw new Error(`Account is ${user.status}. Please contact support.`);
    }
    
    // Clear failed login attempts
    await this.clearFailedLoginAttempts(credentials.email);
    
    // Generate tokens
    const token = await this.generateTokens(user);
    
    // Update last login
    await this.updateLastLogin(user.id);
    
    // Get user permissions
    const permissions = await this.getUserPermissions(user.role, user.id);
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions
    };
    
    return { token, user: authUser };
  }
  
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ token: AuthToken; user: AuthUser }> {
    const validation = this.validateRegistrationData(data);
    if (!validation.isValid) {
      throw new Error(`Registration validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Check if user already exists
    const existingUser = await this.dbClient.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await this.hashPassword(data.password);
    
    // Create user
    const user = await this.dbClient.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
        status: 'active',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Generate tokens
    const token = await this.generateTokens(user);
    
    // Get user permissions
    const permissions = await this.getUserPermissions(user.role, user.id);
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions
    };
    
    return { token, user: authUser };
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const payload = await this.verifyToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }
    
    const user = await this.dbClient.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }
    
    return await this.generateTokens(user);
  }
  
  /**
   * Logout user (invalidate tokens)
   */
  async logout(token: string): Promise<boolean> {
    try {
      // Add token to blacklist
      await this.blacklistToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email address');
    }
    
    const user = await this.dbClient.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      // Don't reveal if email exists, but still return success
      return true;
    }
    
    // Generate reset token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Save reset token
    await this.dbClient.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        createdAt: new Date()
      }
    });
    
    // Send reset email (implement email service)
    // await this.emailService.sendPasswordResetEmail(email, resetToken);
    
    return true;
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<boolean> {
    const validation = this.validatePasswordResetData(data);
    if (!validation.isValid) {
      throw new Error(`Password reset validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Find valid reset token
    const resetRecord = await this.dbClient.passwordReset.findFirst({
      where: {
        token: data.token,
        user: { email: data.email },
        expiresAt: { gt: new Date() },
        usedAt: null
      },
      include: { user: true }
    });
    
    if (!resetRecord) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Hash new password
    const passwordHash = await this.hashPassword(data.newPassword);
    
    // Update user password
    await this.dbClient.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash, updatedAt: new Date() }
    });
    
    // Mark reset token as used
    await this.dbClient.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() }
    });
    
    return true;
  }
  
  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<any> {
    // Implement JWT verification
    // Return decoded payload or null if invalid
    return null;
  }
  
  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.dbClient.tokenBlacklist.findUnique({
      where: { token }
    });
    return !!blacklisted;
  }
  
  // Private helper methods
  private validateLoginCredentials(credentials: LoginCredentials): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!credentials.email) {
      errors.push('Email is required');
    } else if (!isValidEmail(credentials.email)) {
      errors.push('Invalid email format');
    }
    
    if (!credentials.password) {
      errors.push('Password is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  private validateRegistrationData(data: RegisterData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.email) {
      errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    if (!data.password) {
      errors.push('Password is required');
    } else if (data.password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters`);
    }
    
    if (!data.firstName) {
      errors.push('First name is required');
    }
    
    if (!data.lastName) {
      errors.push('Last name is required');
    }
    
    if (!data.role || !['admin', 'supplier', 'couple'].includes(data.role)) {
      errors.push('Valid role is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  private validatePasswordResetData(data: ResetPasswordData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.email || !isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.token) {
      errors.push('Reset token is required');
    }
    
    if (!data.newPassword || data.newPassword.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters`);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  private async hashPassword(password: string): Promise<string> {
    // Implement password hashing (bcrypt, argon2, etc.)
    return `hashed_${password}`;
  }
  
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Implement password verification
    return hash === `hashed_${password}`;
  }
  
  private async generateTokens(user: any): Promise<AuthToken> {
    // Implement JWT token generation
    const accessToken = `access_${user.id}_${Date.now()}`;
    const refreshToken = `refresh_${user.id}_${Date.now()}`;
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.tokenExpiry,
      tokenType: 'Bearer'
    };
  }
  
  private async getUserPermissions(role: Role, userId: ID): Promise<Permission[]> {
    // Define role-based permissions
    const rolePermissions: Record<Role, Permission[]> = {
      admin: [
        { resource: '*', action: '*' }
      ],
      supplier: [
        { resource: 'weddings', action: 'read', conditions: { supplierId: userId } },
        { resource: 'forms', action: '*', conditions: { supplierId: userId } },
        { resource: 'journeys', action: '*', conditions: { supplierId: userId } },
        { resource: 'communications', action: '*', conditions: { supplierId: userId } }
      ],
      couple: [
        { resource: 'weddings', action: '*', conditions: { coupleId: userId } },
        { resource: 'guests', action: '*', conditions: { coupleId: userId } },
        { resource: 'timeline', action: '*', conditions: { coupleId: userId } }
      ],
      guest: [
        { resource: 'rsvp', action: 'update', conditions: { guestId: userId } }
      ]
    };
    
    return rolePermissions[role] || [];
  }
  
  private async checkAccountLockout(email: string): Promise<void> {
    const failedAttempts = await this.dbClient.failedLogin.count({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - this.config.lockoutDuration * 60 * 1000) }
      }
    });
    
    if (failedAttempts >= this.config.maxLoginAttempts) {
      throw new Error('Account temporarily locked due to too many failed login attempts');
    }
  }
  
  private async recordFailedLogin(email: string): Promise<void> {
    await this.dbClient.failedLogin.create({
      data: {
        email,
        createdAt: new Date()
      }
    });
  }
  
  private async clearFailedLoginAttempts(email: string): Promise<void> {
    await this.dbClient.failedLogin.deleteMany({
      where: { email }
    });
  }
  
  private async updateLastLogin(userId: ID): Promise<void> {
    await this.dbClient.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), updatedAt: new Date() }
    });
  }
  
  private async blacklistToken(token: string): Promise<void> {
    await this.dbClient.tokenBlacklist.create({
      data: {
        token,
        createdAt: new Date()
      }
    });
  }
  
  private generateResetToken(): string {
    return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// Utility functions for authentication
export const authUtils = {
  /**
   * Extract bearer token from Authorization header
   */
  extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  },
  
  /**
   * Check if user has permission for resource and action
   */
  hasPermission(permissions: Permission[], resource: string, action: string): boolean {
    return permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.action === '*' || permission.action === action;
      return resourceMatch && actionMatch;
    });
  },
  
  /**
   * Generate secure random password
   */
  generateRandomPassword(length: number = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },
  
  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isStrong: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');
    
    return {
      isStrong: score >= 4,
      score,
      feedback
    };
  },
  
  /**
   * Create session from auth user
   */
  createSession(user: AuthUser, expiresIn: number, metadata?: { ipAddress?: string; userAgent?: string }): SessionData {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      loginAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    };
  },
  
  /**
   * Check if session is expired
   */
  isSessionExpired(session: SessionData): boolean {
    return new Date() > session.expiresAt;
  }
};