import supertest from 'supertest';

// Base URL for WedSync API (will be configurable)
const API_BASE_URL = process.env.WEDSYNC_API_URL || 'http://localhost:3001/api/v1';

export class ApiClient {
  private client: supertest.SuperTest<supertest.Test>;

  constructor(baseUrl: string = API_BASE_URL) {
    // Create a mock server instance for contract testing
    // In real implementation, this would connect to actual API
    this.client = supertest(baseUrl);
  }

  async post(path: string, data?: any, headers?: Record<string, string>) {
    let request = this.client.post(path);
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request = request.set(key, value);
      });
    }
    
    if (data) {
      request = request.send(data);
    }
    
    return request;
  }

  async get(path: string, headers?: Record<string, string>) {
    let request = this.client.get(path);
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request = request.set(key, value);
      });
    }
    
    return request;
  }

  async put(path: string, data?: any, headers?: Record<string, string>) {
    let request = this.client.put(path);
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request = request.set(key, value);
      });
    }
    
    if (data) {
      request = request.send(data);
    }
    
    return request;
  }

  async delete(path: string, headers?: Record<string, string>) {
    let request = this.client.delete(path);
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        request = request.set(key, value);
      });
    }
    
    return request;
  }

  withAuth(token: string) {
    return {
      post: (path: string, data?: any) => 
        this.post(path, data, { Authorization: `Bearer ${token}` }),
      get: (path: string) => 
        this.get(path, { Authorization: `Bearer ${token}` }),
      put: (path: string, data?: any) => 
        this.put(path, data, { Authorization: `Bearer ${token}` }),
      delete: (path: string) => 
        this.delete(path, { Authorization: `Bearer ${token}` })
    };
  }
}