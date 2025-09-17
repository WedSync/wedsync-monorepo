// Global test setup
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

beforeAll(async () => {
  // Global setup before all tests
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Global teardown after all tests
  console.log('Tearing down test environment...');
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Extend Jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Custom matchers can be added here
    }
  }
}