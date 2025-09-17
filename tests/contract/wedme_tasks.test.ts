/**
 * T043: Contract test GET/POST/PUT /weddings/{id}/tasks in tests/contract/wedme_tasks.test.ts
 * 
 * This test validates the WedMe API task management endpoints contract.
 * It MUST FAIL until the actual API endpoints are implemented.
 * 
 * Contracts being tested:
 * - GET /weddings/{weddingId}/tasks
 * - POST /weddings/{weddingId}/tasks 
 * - PUT /weddings/{weddingId}/tasks/{taskId}
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ApiClient } from './helpers/api-client';
import { 
  validCoupleCredentials,
  mockCoupleWedding,
  mockTask,
  validTaskData,
  mockTaskUpdate,
  mockDayOfTask
} from './helpers/fixtures';

describe('WedMe API - Task Management Contract', () => {
  let apiClient: ApiClient;
  const weddingId = mockCoupleWedding.id;

  beforeEach(async () => {
    apiClient = new ApiClient();
    // Authenticate as couple
    await apiClient.authenticate(validCoupleCredentials);
  });

  describe('GET /weddings/{weddingId}/tasks', () => {
    test('should get wedding tasks', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/tasks`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const task = response.data[0];
        
        // Required task fields
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('priority');
        
        // Validate task properties
        expect(typeof task.id).toBe('string');
        expect(typeof task.title).toBe('string');
        expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(task.status);
        expect(['low', 'medium', 'high', 'urgent']).toContain(task.priority);
        
        // Validate UUID format for task ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(task.id).toMatch(uuidRegex);
        
        // Optional fields validation
        if (task.description) {
          expect(typeof task.description).toBe('string');
        }
        
        if (task.category) {
          expect(typeof task.category).toBe('string');
        }
        
        if (task.due_date) {
          expect(typeof task.due_date).toBe('string');
          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          expect(task.due_date).toMatch(dateRegex);
        }
        
        if (task.assignees) {
          expect(Array.isArray(task.assignees)).toBe(true);
          task.assignees.forEach((assignee: any) => {
            expect(assignee).toHaveProperty('id');
            expect(assignee).toHaveProperty('first_name');
            expect(assignee).toHaveProperty('last_name');
          });
        }
        
        if (task.is_day_of_task !== undefined) {
          expect(typeof task.is_day_of_task).toBe('boolean');
        }
        
        if (task.completed_at) {
          expect(typeof task.completed_at).toBe('string');
          expect(() => new Date(task.completed_at)).not.toThrow();
        }
      }
    });

    test('should filter tasks by status', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/tasks?status=pending`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned tasks should have pending status
      response.data.forEach((task: any) => {
        expect(task.status).toBe('pending');
      });
    });

    test('should filter tasks by category', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/tasks?category=venue`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // All returned tasks should have venue category
      response.data.forEach((task: any) => {
        expect(task.category).toBe('venue');
      });
    });

    test('should handle invalid status filter', async () => {
      const response = await apiClient.get(`/weddings/${weddingId}/tasks?status=invalid`);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.get(`/weddings/${weddingId}/tasks`);
      
      expect(response.status).toBe(401);
    });

    test('should validate wedding ownership', async () => {
      const nonExistentWeddingId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.get(`/weddings/${nonExistentWeddingId}/tasks`);
      
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('POST /weddings/{weddingId}/tasks', () => {
    test('should create new task', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, validTaskData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('priority');
      
      // Validate returned task data
      expect(response.data.title).toBe(validTaskData.title);
      expect(response.data.status).toBe('pending'); // Default status
      expect(response.data.priority).toBe(validTaskData.priority);
      
      if (validTaskData.description) {
        expect(response.data.description).toBe(validTaskData.description);
      }
      
      if (validTaskData.category) {
        expect(response.data.category).toBe(validTaskData.category);
      }
      
      if (validTaskData.due_date) {
        expect(response.data.due_date).toBe(validTaskData.due_date);
      }
      
      if (validTaskData.is_day_of_task !== undefined) {
        expect(response.data.is_day_of_task).toBe(validTaskData.is_day_of_task);
      }
      
      // Validate UUID format for task ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.data.id).toMatch(uuidRegex);
    });

    test('should create task with assignees', async () => {
      const taskWithAssignees = {
        ...validTaskData,
        assignee_guest_ids: ['123e4567-e89b-12d3-a456-426614174020']
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, taskWithAssignees);
      
      expect(response.status).toBe(201);
      expect(response.data.assignees).toBeDefined();
      expect(Array.isArray(response.data.assignees)).toBe(true);
      
      if (response.data.assignees.length > 0) {
        const assignee = response.data.assignees[0];
        expect(assignee).toHaveProperty('id');
        expect(assignee).toHaveProperty('first_name');
        expect(assignee).toHaveProperty('last_name');
      }
    });

    test('should create day-of task', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, mockDayOfTask);
      
      expect(response.status).toBe(201);
      expect(response.data.is_day_of_task).toBe(true);
      expect(response.data.category).toBe('day_of');
    });

    test('should require title', async () => {
      const invalidData = {
        description: 'Task without title',
        priority: 'medium'
        // Missing required title
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate priority values', async () => {
      const invalidData = {
        title: 'Test Task',
        priority: 'invalid_priority'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate due_date format', async () => {
      const invalidData = {
        title: 'Test Task',
        due_date: 'invalid-date'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should validate assignee_guest_ids as UUIDs', async () => {
      const invalidData = {
        title: 'Test Task',
        assignee_guest_ids: ['invalid-uuid']
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, invalidData);
      
      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.post(`/weddings/${weddingId}/tasks`, validTaskData);
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /weddings/{weddingId}/tasks/{taskId}', () => {
    const taskId = mockTask.id;

    test('should update task details', async () => {
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, mockTaskUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(taskId);
      
      // Check updated fields
      if (mockTaskUpdate.title) {
        expect(response.data.title).toBe(mockTaskUpdate.title);
      }
      
      if (mockTaskUpdate.description) {
        expect(response.data.description).toBe(mockTaskUpdate.description);
      }
      
      if (mockTaskUpdate.priority) {
        expect(response.data.priority).toBe(mockTaskUpdate.priority);
      }
      
      if (mockTaskUpdate.status) {
        expect(response.data.status).toBe(mockTaskUpdate.status);
      }
      
      if (mockTaskUpdate.due_date) {
        expect(response.data.due_date).toBe(mockTaskUpdate.due_date);
      }
    });

    test('should update task status to completed', async () => {
      const completionUpdate = {
        status: 'completed' as const,
        completion_notes: 'Task completed successfully'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, completionUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.completed_at).toBeDefined();
      expect(typeof response.data.completed_at).toBe('string');
      
      // Validate completion timestamp
      expect(() => new Date(response.data.completed_at)).not.toThrow();
      
      if (completionUpdate.completion_notes) {
        expect(response.data.completion_notes).toBe(completionUpdate.completion_notes);
      }
    });

    test('should validate status values', async () => {
      const invalidUpdate = {
        status: 'invalid_status'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate priority values', async () => {
      const invalidUpdate = {
        priority: 'invalid_priority'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate due_date format', async () => {
      const invalidUpdate = {
        due_date: 'invalid-date'
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, invalidUpdate);
      
      expect(response.status).toBe(400);
    });

    test('should validate task exists', async () => {
      const nonExistentTaskId = '999e4567-e89b-12d3-a456-426614174999';
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${nonExistentTaskId}`, mockTaskUpdate);
      
      expect(response.status).toBe(404);
    });

    test('should require authentication', async () => {
      const unauthenticatedClient = new ApiClient();
      unauthenticatedClient.clearAuth();
      
      const response = await unauthenticatedClient.put(`/weddings/${weddingId}/tasks/${taskId}`, mockTaskUpdate);
      
      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle malformed UUID in path', async () => {
      const response = await apiClient.get('/weddings/invalid-uuid/tasks');
      
      expect(response.status).toBe(400);
    });

    test('should prevent cross-tenant data access', async () => {
      const otherWeddingId = '777e4567-e89b-12d3-a456-426614174777';
      const response = await apiClient.get(`/weddings/${otherWeddingId}/tasks`);
      
      expect([403, 404]).toContain(response.status);
    });

    test('should handle very long task title', async () => {
      const longTitleData = {
        title: 'A'.repeat(500), // Very long title
        priority: 'medium' as const
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, longTitleData);
      
      // Should either accept or reject gracefully
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should handle very long description', async () => {
      const longDescriptionData = {
        title: 'Test Task',
        description: 'A'.repeat(2000), // Very long description
        priority: 'medium' as const
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, longDescriptionData);
      
      // Should either accept or reject gracefully
      expect([201, 400, 413]).toContain(response.status);
    });

    test('should handle large number of assignees', async () => {
      const manyAssigneesData = {
        title: 'Test Task',
        assignee_guest_ids: Array(50).fill('123e4567-e89b-12d3-a456-426614174020')
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, manyAssigneesData);
      
      // Should either accept or reject gracefully
      expect([201, 400, 422]).toContain(response.status);
    });
  });

  describe('Business Logic', () => {
    test('should set default priority when not specified', async () => {
      const taskWithoutPriority = {
        title: 'Task Without Priority'
      };
      
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, taskWithoutPriority);
      
      expect(response.status).toBe(201);
      expect(response.data.priority).toBeDefined();
      expect(['low', 'medium', 'high', 'urgent']).toContain(response.data.priority);
    });

    test('should set default status to pending for new tasks', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, validTaskData);
      
      expect(response.status).toBe(201);
      expect(response.data.status).toBe('pending');
    });

    test('should preserve task creation metadata', async () => {
      const response = await apiClient.post(`/weddings/${weddingId}/tasks`, validTaskData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      
      // Should have creation timestamp or similar metadata
      // This depends on the actual API implementation
    });

    test('should handle completion timestamp automatically', async () => {
      const taskId = mockTask.id;
      
      const completionUpdate = {
        status: 'completed' as const
      };
      
      const response = await apiClient.put(`/weddings/${weddingId}/tasks/${taskId}`, completionUpdate);
      
      expect(response.status).toBe(200);
      expect(response.data.completed_at).toBeDefined();
      
      // Completion timestamp should be recent
      const completedAt = new Date(response.data.completed_at);
      const now = new Date();
      const diffMs = now.getTime() - completedAt.getTime();
      expect(diffMs).toBeLessThan(5000); // Within 5 seconds
    });
  });
});