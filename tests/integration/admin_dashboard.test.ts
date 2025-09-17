/**
 * T054: Integration test admin dashboard metrics in tests/integration/admin_dashboard.test.ts
 * 
 * This integration test validates the admin dashboard metrics and analytics functionality
 * across the WedSync and WedMe platforms. It ensures that administrative insights,
 * platform analytics, business metrics, and system health monitoring work correctly
 * and provide accurate, real-time data for platform management.
 * 
 * Test scenarios:
 * 1. Platform usage analytics and user engagement metrics
 * 2. Wedding and supplier performance metrics
 * 3. Revenue analytics and financial reporting
 * 4. System health and performance monitoring
 * 5. User activity and behavior analytics
 * 6. Cross-platform data aggregation
 * 7. Real-time dashboard updates
 * 8. Export and reporting functionality
 * 9. Alert and notification systems
 * 10. Data privacy and compliance monitoring
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { ApiClient } from '../contract/helpers/api-client';
import { 
  validSupplierCredentials,
  validCoupleCredentials,
  mockCoupleWedding,
  validGuestData,
  validFormData,
  validTaskData
} from '../contract/helpers/fixtures';

// Mock data generator for testing analytics
class MockDataGenerator {
  static generateUserActivity(userCount: number = 50) {
    const activities = [];
    const platforms = ['wedsync', 'wedme'];
    const activityTypes = ['login', 'message_sent', 'form_created', 'guest_added', 'task_completed'];
    
    for (let i = 0; i < userCount; i++) {
      activities.push({
        user_id: `user_${i}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        activity_type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        session_duration: Math.floor(Math.random() * 3600), // 0-60 minutes
        features_used: Math.floor(Math.random() * 10) + 1
      });
    }
    return activities;
  }

  static generateRevenueData(months: number = 12) {
    const revenueData = [];
    const baseRevenue = 50000;
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      revenueData.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        subscription_revenue: baseRevenue + Math.random() * 20000,
        transaction_fees: Math.random() * 5000,
        premium_features: Math.random() * 3000,
        total_revenue: 0 // Will be calculated
      });
    }
    
    revenueData.forEach(data => {
      data.total_revenue = data.subscription_revenue + data.transaction_fees + data.premium_features;
    });
    
    return revenueData;
  }

  static generateSystemMetrics() {
    return {
      api_response_times: {
        wedsync: Math.random() * 500 + 100, // 100-600ms
        wedme: Math.random() * 500 + 100,
        admin: Math.random() * 300 + 50
      },
      error_rates: {
        wedsync: Math.random() * 0.05, // 0-5%
        wedme: Math.random() * 0.05,
        admin: Math.random() * 0.02
      },
      active_connections: {
        wedsync_websockets: Math.floor(Math.random() * 1000) + 100,
        wedme_websockets: Math.floor(Math.random() * 1500) + 200,
        database_connections: Math.floor(Math.random() * 50) + 10
      },
      resource_usage: {
        cpu_percentage: Math.random() * 80 + 10,
        memory_percentage: Math.random() * 70 + 20,
        disk_usage_percentage: Math.random() * 60 + 30
      }
    };
  }
}

describe('Integration: Admin Dashboard Metrics', () => {
  let wedSyncClient: ApiClient;
  let wedMeClient: ApiClient;
  let adminClient: ApiClient;
  let testWeddingId: string;
  let supplierToken: string;
  let coupleToken: string;
  let adminToken: string;
  let createdResourceIds: string[] = [];
  let testStartTime: number;

  beforeAll(async () => {
    // Initialize API clients for all platforms
    wedSyncClient = new ApiClient(process.env.WEDSYNC_API_URL || 'http://localhost:3001/api/v1');
    wedMeClient = new ApiClient(process.env.WEDME_API_URL || 'http://localhost:3002/api/v1');
    adminClient = new ApiClient(process.env.ADMIN_API_URL || 'http://localhost:3003/api/v1');
    
    testStartTime = Date.now();
  });

  beforeEach(async () => {
    // Authenticate with all platforms
    const supplierAuth = await wedSyncClient.post('/auth/login', validSupplierCredentials);
    expect(supplierAuth.status).toBe(200);
    supplierToken = supplierAuth.body.access_token;

    const coupleAuth = await wedMeClient.post('/auth/login', validCoupleCredentials);
    expect(coupleAuth.status).toBe(200);
    coupleToken = coupleAuth.body.access_token;

    const adminAuth = await adminClient.post('/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    expect(adminAuth.status).toBe(200);
    adminToken = adminAuth.body.access_token;
    
    testWeddingId = mockCoupleWedding.id;
    createdResourceIds = [];
  });

  afterEach(async () => {
    // Cleanup created test data
    for (const resourceId of createdResourceIds) {
      try {
        await Promise.allSettled([
          wedMeClient.withAuth(coupleToken).delete(`/resources/${resourceId}`),
          wedSyncClient.withAuth(supplierToken).delete(`/resources/${resourceId}`),
          adminClient.withAuth(adminToken).delete(`/admin/resources/${resourceId}`)
        ]);
      } catch (error) {
        console.warn(`Failed to cleanup resource ${resourceId}:`, error);
      }
    }
  });

  describe('Platform Usage Analytics', () => {
    test('should provide comprehensive platform usage metrics', async () => {
      // Step 1: Generate some test activity across platforms
      const activityPromises = [
        // WedSync activities
        wedSyncClient.withAuth(supplierToken).get('/dashboard/today'),
        wedSyncClient.withAuth(supplierToken).get('/forms'),
        wedSyncClient.withAuth(supplierToken).get('/clients'),
        
        // WedMe activities  
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}`),
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}/guests`),
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}/tasks`)
      ];

      await Promise.allSettled(activityPromises);
      
      // Wait for analytics processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Retrieve platform usage analytics
      const usageAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/platform-usage?period=24h');

      expect(usageAnalytics.status).toBe(200);
      
      const analyticsData = usageAnalytics.body;
      
      // Verify analytics structure
      expect(analyticsData.summary).toBeDefined();
      expect(analyticsData.summary.total_active_users).toBeGreaterThan(0);
      expect(analyticsData.summary.total_sessions).toBeGreaterThan(0);
      expect(analyticsData.summary.total_page_views).toBeGreaterThan(0);

      // Verify platform breakdown
      expect(analyticsData.platform_breakdown).toBeDefined();
      expect(analyticsData.platform_breakdown.wedsync).toBeDefined();
      expect(analyticsData.platform_breakdown.wedme).toBeDefined();
      
      expect(analyticsData.platform_breakdown.wedsync.active_users).toBeGreaterThanOrEqual(1);
      expect(analyticsData.platform_breakdown.wedme.active_users).toBeGreaterThanOrEqual(1);

      // Step 3: Verify user engagement metrics
      expect(analyticsData.engagement).toBeDefined();
      expect(analyticsData.engagement.average_session_duration).toBeGreaterThan(0);
      expect(analyticsData.engagement.pages_per_session).toBeGreaterThan(0);
      expect(analyticsData.engagement.bounce_rate).toBeGreaterThanOrEqual(0);
      expect(analyticsData.engagement.bounce_rate).toBeLessThanOrEqual(1);

      // Step 4: Verify feature usage statistics
      expect(analyticsData.feature_usage).toBeDefined();
      expect(Array.isArray(analyticsData.feature_usage.most_used_features)).toBe(true);
      expect(analyticsData.feature_usage.most_used_features.length).toBeGreaterThan(0);

      // Step 5: Test real-time analytics updates
      const realtimeAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/realtime');

      expect(realtimeAnalytics.status).toBe(200);
      expect(realtimeAnalytics.body.current_active_users).toBeGreaterThanOrEqual(2);
      expect(realtimeAnalytics.body.real_time_events).toBeDefined();
    });

    test('should track user journey analytics across platforms', async () => {
      // Step 1: Simulate user journey across platforms
      const journeySteps = [
        // Step 1: Supplier logs into WedSync
        () => wedSyncClient.withAuth(supplierToken).get('/dashboard/today'),
        
        // Step 2: Supplier creates form
        () => wedSyncClient.withAuth(supplierToken).post('/forms', {
          title: 'Analytics Test Form',
          description: 'Form for journey analytics',
          fields: [{ type: 'text', label: 'Name', required: true }],
          target_wedding_id: testWeddingId
        }),
        
        // Step 3: Couple logs into WedMe  
        () => wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}`),
        
        // Step 4: Couple views form
        () => wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}/forms`),
        
        // Step 5: Couple submits form response
        () => wedMeClient.withAuth(coupleToken).post(`/weddings/${testWeddingId}/forms/form_123/submit`, {
          responses: { 'Name': 'Journey Test User' }
        })
      ];

      // Execute journey steps with tracking
      for (let i = 0; i < journeySteps.length; i++) {
        try {
          const result = await journeySteps[i]();
          if (result.status === 201 && result.body.id) {
            createdResourceIds.push(result.body.id);
          }
        } catch (error) {
          // Some steps might fail in test environment, that's okay
          console.log(`Journey step ${i + 1} completed with expected test behavior`);
        }
        
        // Small delay between steps to simulate realistic user behavior
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 2: Wait for journey analytics processing
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Step 3: Retrieve user journey analytics
      const journeyAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/user-journeys?period=1h');

      expect(journeyAnalytics.status).toBe(200);
      
      const journeyData = journeyAnalytics.body;
      
      // Verify journey tracking
      expect(journeyData.cross_platform_journeys).toBeDefined();
      expect(journeyData.cross_platform_journeys.total_journeys).toBeGreaterThan(0);
      
      // Verify journey paths
      expect(journeyData.popular_paths).toBeDefined();
      expect(Array.isArray(journeyData.popular_paths)).toBe(true);
      
      // Step 4: Verify conversion funnel analytics
      const conversionFunnel = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/conversion-funnel');

      expect(conversionFunnel.status).toBe(200);
      expect(conversionFunnel.body.funnel_steps).toBeDefined();
      expect(conversionFunnel.body.conversion_rates).toBeDefined();

      // Step 5: Verify drop-off analysis
      expect(conversionFunnel.body.drop_off_points).toBeDefined();
      expect(Array.isArray(conversionFunnel.body.drop_off_points)).toBe(true);
    });
  });

  describe('Wedding and Supplier Performance Metrics', () => {
    test('should provide wedding management performance analytics', async () => {
      // Step 1: Generate wedding activity data
      const weddingActivities = [
        // Add guests
        wedMeClient.withAuth(coupleToken).post(`/weddings/${testWeddingId}/guests`, {
          first_name: 'Analytics',
          last_name: 'Test Guest 1',
          email: 'analytics1@test.com'
        }),
        
        // Create tasks
        wedMeClient.withAuth(coupleToken).post(`/weddings/${testWeddingId}/tasks`, {
          title: 'Analytics Test Task',
          description: 'Task for performance analytics',
          due_date: '2024-06-01',
          priority: 'medium'
        }),
        
        // Update wedding details
        wedMeClient.withAuth(coupleToken).put(`/weddings/${testWeddingId}`, {
          guest_count_estimate: 120,
          budget_total: 35000
        })
      ];

      const weddingResults = await Promise.allSettled(weddingActivities);
      weddingResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.status === 201) {
          createdResourceIds.push(result.value.body.id);
        }
      });

      // Wait for metrics processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Retrieve wedding performance metrics
      const weddingMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/wedding-performance?period=7d');

      expect(weddingMetrics.status).toBe(200);
      
      const metricsData = weddingMetrics.body;
      
      // Verify wedding statistics
      expect(metricsData.wedding_statistics).toBeDefined();
      expect(metricsData.wedding_statistics.total_active_weddings).toBeGreaterThan(0);
      expect(metricsData.wedding_statistics.average_planning_duration).toBeGreaterThan(0);
      expect(metricsData.wedding_statistics.completion_rate).toBeGreaterThanOrEqual(0);

      // Verify task completion metrics
      expect(metricsData.task_metrics).toBeDefined();
      expect(metricsData.task_metrics.total_tasks_created).toBeGreaterThan(0);
      expect(metricsData.task_metrics.average_completion_time).toBeGreaterThan(0);
      expect(metricsData.task_metrics.task_categories).toBeDefined();

      // Verify guest management metrics
      expect(metricsData.guest_metrics).toBeDefined();
      expect(metricsData.guest_metrics.total_guests_added).toBeGreaterThan(0);
      expect(metricsData.guest_metrics.average_guest_count_per_wedding).toBeGreaterThan(0);
      expect(metricsData.guest_metrics.rsvp_completion_rate).toBeGreaterThanOrEqual(0);

      // Step 3: Verify budget and cost analytics
      const budgetAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/budget-trends');

      expect(budgetAnalytics.status).toBe(200);
      expect(budgetAnalytics.body.average_wedding_budget).toBeGreaterThan(0);
      expect(budgetAnalytics.body.budget_distribution).toBeDefined();
      expect(budgetAnalytics.body.cost_category_breakdown).toBeDefined();
    });

    test('should provide supplier performance and engagement metrics', async () => {
      // Step 1: Generate supplier activity
      const supplierActivities = [
        // Create forms
        wedSyncClient.withAuth(supplierToken).post('/forms', {
          title: 'Supplier Metrics Test Form 1',
          description: 'Form for supplier analytics',
          fields: [{ type: 'text', label: 'Test Field', required: true }],
          target_wedding_id: testWeddingId
        }),
        
        // Send communications
        wedSyncClient.withAuth(supplierToken).post('/communications/send', {
          subject: 'Supplier Metrics Test Message',
          content: 'Message for supplier performance analytics',
          recipient_type: 'couple',
          wedding_id: testWeddingId
        }),
        
        // Access client data
        wedSyncClient.withAuth(supplierToken).get('/clients'),
        wedSyncClient.withAuth(supplierToken).get('/dashboard/today')
      ];

      const supplierResults = await Promise.allSettled(supplierActivities);
      supplierResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.status === 201) {
          createdResourceIds.push(result.value.body.id);
        }
      });

      // Wait for metrics processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Retrieve supplier performance metrics
      const supplierMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/supplier-performance?period=7d');

      expect(supplierMetrics.status).toBe(200);
      
      const supplierData = supplierMetrics.body;
      
      // Verify supplier engagement metrics
      expect(supplierData.engagement_metrics).toBeDefined();
      expect(supplierData.engagement_metrics.active_suppliers).toBeGreaterThan(0);
      expect(supplierData.engagement_metrics.average_forms_per_supplier).toBeGreaterThan(0);
      expect(supplierData.engagement_metrics.average_client_interactions).toBeGreaterThan(0);

      // Verify supplier productivity metrics
      expect(supplierData.productivity_metrics).toBeDefined();
      expect(supplierData.productivity_metrics.forms_created).toBeGreaterThan(0);
      expect(supplierData.productivity_metrics.messages_sent).toBeGreaterThan(0);
      expect(supplierData.productivity_metrics.client_response_time).toBeGreaterThan(0);

      // Verify supplier satisfaction metrics
      expect(supplierData.satisfaction_metrics).toBeDefined();
      expect(supplierData.satisfaction_metrics.platform_rating).toBeGreaterThan(0);
      expect(supplierData.satisfaction_metrics.feature_adoption_rate).toBeGreaterThanOrEqual(0);

      // Step 3: Get top performing suppliers
      const topSuppliers = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/top-suppliers?metric=engagement&period=30d');

      expect(topSuppliers.status).toBe(200);
      expect(Array.isArray(topSuppliers.body.suppliers)).toBe(true);
      expect(topSuppliers.body.ranking_criteria).toBeDefined();

      // Step 4: Get supplier growth analytics
      const supplierGrowth = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/supplier-growth?period=6m');

      expect(supplierGrowth.status).toBe(200);
      expect(supplierGrowth.body.new_suppliers_per_month).toBeDefined();
      expect(supplierGrowth.body.retention_rate).toBeGreaterThanOrEqual(0);
      expect(supplierGrowth.body.churn_rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Revenue Analytics and Financial Reporting', () => {
    test('should provide comprehensive revenue analytics', async () => {
      // Step 1: Retrieve revenue analytics
      const revenueAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/revenue?period=12m');

      expect(revenueAnalytics.status).toBe(200);
      
      const revenueData = revenueAnalytics.body;
      
      // Verify revenue summary
      expect(revenueData.summary).toBeDefined();
      expect(revenueData.summary.total_revenue).toBeGreaterThan(0);
      expect(revenueData.summary.monthly_recurring_revenue).toBeGreaterThan(0);
      expect(revenueData.summary.average_revenue_per_user).toBeGreaterThan(0);

      // Verify revenue breakdown
      expect(revenueData.revenue_breakdown).toBeDefined();
      expect(revenueData.revenue_breakdown.subscription_revenue).toBeGreaterThan(0);
      expect(revenueData.revenue_breakdown.transaction_fees).toBeGreaterThanOrEqual(0);
      expect(revenueData.revenue_breakdown.premium_features).toBeGreaterThanOrEqual(0);

      // Verify monthly trends
      expect(revenueData.monthly_trends).toBeDefined();
      expect(Array.isArray(revenueData.monthly_trends)).toBe(true);
      expect(revenueData.monthly_trends.length).toBe(12);

      // Step 2: Verify subscription analytics
      const subscriptionAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/subscriptions');

      expect(subscriptionAnalytics.status).toBe(200);
      
      const subData = subscriptionAnalytics.body;
      expect(subData.active_subscriptions).toBeGreaterThan(0);
      expect(subData.subscription_tiers).toBeDefined();
      expect(subData.churn_rate).toBeGreaterThanOrEqual(0);
      expect(subData.upgrade_rate).toBeGreaterThanOrEqual(0);

      // Step 3: Verify transaction analytics
      const transactionAnalytics = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/transactions?period=30d');

      expect(transactionAnalytics.status).toBe(200);
      expect(transactionAnalytics.body.total_transactions).toBeGreaterThanOrEqual(0);
      expect(transactionAnalytics.body.transaction_volume).toBeGreaterThanOrEqual(0);
      expect(transactionAnalytics.body.average_transaction_value).toBeGreaterThanOrEqual(0);

      // Step 4: Generate revenue forecast
      const revenueForecast = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/revenue-forecast?months=6');

      expect(revenueForecast.status).toBe(200);
      expect(revenueForecast.body.forecast_data).toBeDefined();
      expect(Array.isArray(revenueForecast.body.forecast_data)).toBe(true);
      expect(revenueForecast.body.confidence_interval).toBeDefined();
    });

    test('should provide financial KPI dashboard', async () => {
      // Step 1: Retrieve financial KPIs
      const financialKPIs = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/financial-kpis');

      expect(financialKPIs.status).toBe(200);
      
      const kpiData = financialKPIs.body;
      
      // Verify key financial metrics
      expect(kpiData.kpis).toBeDefined();
      expect(kpiData.kpis.monthly_recurring_revenue).toBeGreaterThan(0);
      expect(kpiData.kpis.customer_acquisition_cost).toBeGreaterThan(0);
      expect(kpiData.kpis.customer_lifetime_value).toBeGreaterThan(0);
      expect(kpiData.kpis.gross_margin_percentage).toBeGreaterThan(0);

      // Verify growth metrics
      expect(kpiData.growth_metrics).toBeDefined();
      expect(kpiData.growth_metrics.revenue_growth_rate).toBeDefined();
      expect(kpiData.growth_metrics.user_growth_rate).toBeDefined();
      expect(kpiData.growth_metrics.market_expansion_rate).toBeDefined();

      // Verify profitability metrics
      expect(kpiData.profitability).toBeDefined();
      expect(kpiData.profitability.gross_profit).toBeGreaterThanOrEqual(0);
      expect(kpiData.profitability.net_profit_margin).toBeDefined();
      expect(kpiData.profitability.operating_expenses).toBeGreaterThan(0);

      // Step 2: Verify KPI trends and alerts
      const kpiTrends = await adminClient
        .withAuth(adminToken)
        .get('/admin/analytics/kpi-trends?period=6m');

      expect(kpiTrends.status).toBe(200);
      expect(kpiTrends.body.trend_analysis).toBeDefined();
      expect(kpiTrends.body.alerts).toBeDefined();
      expect(Array.isArray(kpiTrends.body.alerts)).toBe(true);
    });
  });

  describe('System Health and Performance Monitoring', () => {
    test('should provide real-time system health metrics', async () => {
      // Step 1: Retrieve system health overview
      const systemHealth = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/health');

      expect(systemHealth.status).toBe(200);
      
      const healthData = systemHealth.body;
      
      // Verify overall system status
      expect(healthData.overall_status).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(healthData.overall_status);
      expect(healthData.last_updated).toBeDefined();

      // Verify service health
      expect(healthData.services).toBeDefined();
      expect(healthData.services.wedsync_api).toBeDefined();
      expect(healthData.services.wedme_api).toBeDefined();
      expect(healthData.services.admin_api).toBeDefined();
      expect(healthData.services.database).toBeDefined();
      expect(healthData.services.websocket_service).toBeDefined();

      // Each service should have status and response time
      Object.values(healthData.services).forEach((service: any) => {
        expect(service.status).toBeDefined();
        expect(service.response_time_ms).toBeGreaterThan(0);
        expect(service.last_check).toBeDefined();
      });

      // Step 2: Verify detailed performance metrics
      const performanceMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/performance?period=1h');

      expect(performanceMetrics.status).toBe(200);
      
      const perfData = performanceMetrics.body;
      
      // Verify API performance metrics
      expect(perfData.api_metrics).toBeDefined();
      expect(perfData.api_metrics.average_response_time).toBeGreaterThan(0);
      expect(perfData.api_metrics.requests_per_minute).toBeGreaterThanOrEqual(0);
      expect(perfData.api_metrics.error_rate_percentage).toBeGreaterThanOrEqual(0);

      // Verify database performance
      expect(perfData.database_metrics).toBeDefined();
      expect(perfData.database_metrics.connection_pool_usage).toBeGreaterThanOrEqual(0);
      expect(perfData.database_metrics.average_query_time).toBeGreaterThan(0);
      expect(perfData.database_metrics.slow_queries_count).toBeGreaterThanOrEqual(0);

      // Verify resource utilization
      expect(perfData.resource_utilization).toBeDefined();
      expect(perfData.resource_utilization.cpu_usage_percentage).toBeGreaterThan(0);
      expect(perfData.resource_utilization.memory_usage_percentage).toBeGreaterThan(0);
      expect(perfData.resource_utilization.disk_usage_percentage).toBeGreaterThan(0);

      // Step 3: Check error tracking and monitoring
      const errorMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/errors?period=24h');

      expect(errorMetrics.status).toBe(200);
      expect(errorMetrics.body.total_errors).toBeGreaterThanOrEqual(0);
      expect(errorMetrics.body.error_breakdown).toBeDefined();
      expect(errorMetrics.body.critical_errors).toBeGreaterThanOrEqual(0);
    });

    test('should provide infrastructure monitoring and alerts', async () => {
      // Step 1: Retrieve infrastructure metrics
      const infraMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/infrastructure');

      expect(infraMetrics.status).toBe(200);
      
      const infraData = infraMetrics.body;
      
      // Verify server metrics
      expect(infraData.servers).toBeDefined();
      expect(Array.isArray(infraData.servers)).toBe(true);
      
      infraData.servers.forEach((server: any) => {
        expect(server.server_id).toBeDefined();
        expect(server.status).toBeDefined();
        expect(server.load_average).toBeGreaterThanOrEqual(0);
        expect(server.uptime_hours).toBeGreaterThan(0);
      });

      // Verify network metrics
      expect(infraData.network).toBeDefined();
      expect(infraData.network.bandwidth_usage).toBeGreaterThanOrEqual(0);
      expect(infraData.network.latency_ms).toBeGreaterThan(0);
      expect(infraData.network.packet_loss_percentage).toBeGreaterThanOrEqual(0);

      // Step 2: Check active alerts and notifications
      const activeAlerts = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/alerts');

      expect(activeAlerts.status).toBe(200);
      expect(Array.isArray(activeAlerts.body.alerts)).toBe(true);
      
      // Verify alert structure if any alerts exist
      if (activeAlerts.body.alerts.length > 0) {
        const alert = activeAlerts.body.alerts[0];
        expect(alert.alert_id).toBeDefined();
        expect(alert.severity).toBeDefined();
        expect(alert.message).toBeDefined();
        expect(alert.created_at).toBeDefined();
      }

      // Step 3: Test alert configuration
      const alertConfig = await adminClient
        .withAuth(adminToken)
        .get('/admin/system/alert-config');

      expect(alertConfig.status).toBe(200);
      expect(alertConfig.body.thresholds).toBeDefined();
      expect(alertConfig.body.notification_channels).toBeDefined();
      expect(alertConfig.body.escalation_rules).toBeDefined();
    });
  });

  describe('Real-time Dashboard Updates', () => {
    test('should provide real-time dashboard data with WebSocket updates', async () => {
      // Step 1: Connect to real-time dashboard WebSocket
      const dashboardWS = new WebSocket(
        `${process.env.ADMIN_WS_URL || 'ws://localhost:3003/ws'}/admin/dashboard?token=${adminToken}`
      );

      const dashboardUpdates: any[] = [];
      
      dashboardWS.onmessage = (event) => {
        const update = JSON.parse(event.data);
        dashboardUpdates.push(update);
      };

      // Wait for connection
      await new Promise((resolve, reject) => {
        dashboardWS.onopen = resolve;
        dashboardWS.onerror = reject;
        setTimeout(reject, 5000); // 5 second timeout
      });

      // Step 2: Generate activity to trigger real-time updates
      const activityPromises = [
        wedSyncClient.withAuth(supplierToken).get('/dashboard/today'),
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}`),
        wedSyncClient.withAuth(supplierToken).post('/forms', {
          title: 'Real-time Test Form',
          description: 'Form for real-time testing',
          fields: [{ type: 'text', label: 'Name', required: true }],
          target_wedding_id: testWeddingId
        })
      ];

      const activityResults = await Promise.allSettled(activityPromises);
      activityResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.status === 201) {
          createdResourceIds.push(result.value.body.id);
        }
      });

      // Step 3: Wait for real-time updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: Verify real-time updates were received
      expect(dashboardUpdates.length).toBeGreaterThan(0);
      
      const updateTypes = dashboardUpdates.map(update => update.type);
      expect(updateTypes).toContain('metrics_updated');

      // Step 5: Verify update structure
      const metricsUpdate = dashboardUpdates.find(update => update.type === 'metrics_updated');
      expect(metricsUpdate).toBeDefined();
      expect(metricsUpdate.data).toBeDefined();
      expect(metricsUpdate.timestamp).toBeDefined();

      // Close WebSocket connection
      dashboardWS.close();
    });

    test('should aggregate and display cross-platform metrics in real-time', async () => {
      // Step 1: Get initial dashboard state
      const initialDashboard = await adminClient
        .withAuth(adminToken)
        .get('/admin/dashboard/realtime');

      expect(initialDashboard.status).toBe(200);
      
      const initialData = initialDashboard.body;
      const initialUserCount = initialData.current_active_users;
      const initialActivityCount = initialData.recent_activity_count;

      // Step 2: Generate cross-platform activity
      const crossPlatformActivity = [
        // WedSync activity
        wedSyncClient.withAuth(supplierToken).get('/forms'),
        wedSyncClient.withAuth(supplierToken).get('/clients'),
        
        // WedMe activity
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}/guests`),
        wedMeClient.withAuth(coupleToken).get(`/weddings/${testWeddingId}/tasks`),
        
        // Admin activity
        adminClient.withAuth(adminToken).get('/admin/analytics/platform-usage?period=1h')
      ];

      await Promise.allSettled(crossPlatformActivity);

      // Step 3: Wait for real-time aggregation
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Step 4: Get updated dashboard state
      const updatedDashboard = await adminClient
        .withAuth(adminToken)
        .get('/admin/dashboard/realtime');

      expect(updatedDashboard.status).toBe(200);
      
      const updatedData = updatedDashboard.body;
      
      // Verify metrics were updated
      expect(updatedData.current_active_users).toBeGreaterThanOrEqual(initialUserCount);
      expect(updatedData.recent_activity_count).toBeGreaterThan(initialActivityCount);

      // Verify cross-platform aggregation
      expect(updatedData.platform_activity).toBeDefined();
      expect(updatedData.platform_activity.wedsync_active).toBeGreaterThan(0);
      expect(updatedData.platform_activity.wedme_active).toBeGreaterThan(0);
      expect(updatedData.platform_activity.admin_active).toBeGreaterThan(0);

      // Step 5: Verify activity timeline
      expect(updatedData.activity_timeline).toBeDefined();
      expect(Array.isArray(updatedData.activity_timeline)).toBe(true);
      expect(updatedData.activity_timeline.length).toBeGreaterThan(0);
    });
  });

  describe('Export and Reporting Functionality', () => {
    test('should generate and export comprehensive analytics reports', async () => {
      // Step 1: Generate custom analytics report
      const reportRequest = {
        report_type: 'comprehensive_analytics',
        date_range: {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        },
        metrics: [
          'platform_usage',
          'revenue_analytics',
          'user_engagement',
          'system_performance',
          'supplier_metrics',
          'wedding_analytics'
        ],
        format: 'json',
        include_charts: true,
        granularity: 'monthly'
      };

      const reportResponse = await adminClient
        .withAuth(adminToken)
        .post('/admin/reports/generate', reportRequest);

      expect(reportResponse.status).toBe(202); // Accepted for processing
      expect(reportResponse.body.report_id).toBeDefined();
      expect(reportResponse.body.estimated_completion).toBeDefined();

      const reportId = reportResponse.body.report_id;
      createdResourceIds.push(reportId);

      // Step 2: Poll for report completion
      let reportStatus;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await adminClient
          .withAuth(adminToken)
          .get(`/admin/reports/${reportId}/status`);

        expect(statusResponse.status).toBe(200);
        reportStatus = statusResponse.body;
        attempts++;
      } while (reportStatus.status === 'processing' && attempts < maxAttempts);

      expect(reportStatus.status).toBe('completed');
      expect(reportStatus.download_url).toBeDefined();

      // Step 3: Download and verify report content
      const reportDownload = await adminClient
        .withAuth(adminToken)
        .get(`/admin/reports/${reportId}/download`);

      expect(reportDownload.status).toBe(200);
      
      const reportData = reportDownload.body;
      
      // Verify report structure
      expect(reportData.report_metadata).toBeDefined();
      expect(reportData.report_metadata.generated_at).toBeDefined();
      expect(reportData.report_metadata.date_range).toBeDefined();

      // Verify all requested metrics are included
      expect(reportData.platform_usage).toBeDefined();
      expect(reportData.revenue_analytics).toBeDefined();
      expect(reportData.user_engagement).toBeDefined();
      expect(reportData.system_performance).toBeDefined();
      expect(reportData.supplier_metrics).toBeDefined();
      expect(reportData.wedding_analytics).toBeDefined();

      // Step 4: Test CSV export format
      const csvReportRequest = { ...reportRequest, format: 'csv' };
      
      const csvReportResponse = await adminClient
        .withAuth(adminToken)
        .post('/admin/reports/generate', csvReportRequest);

      expect(csvReportResponse.status).toBe(202);
      
      // Step 5: Test scheduled reporting
      const scheduledReportRequest = {
        report_type: 'monthly_summary',
        schedule: 'monthly',
        recipients: ['admin@test.com'],
        auto_send: true,
        metrics: ['revenue_analytics', 'platform_usage']
      };

      const scheduledResponse = await adminClient
        .withAuth(adminToken)
        .post('/admin/reports/schedule', scheduledReportRequest);

      expect(scheduledResponse.status).toBe(201);
      expect(scheduledResponse.body.schedule_id).toBeDefined();
      createdResourceIds.push(scheduledResponse.body.schedule_id);
    });

    test('should provide customizable dashboard widgets and layouts', async () => {
      // Step 1: Get available dashboard widgets
      const availableWidgets = await adminClient
        .withAuth(adminToken)
        .get('/admin/dashboard/widgets/available');

      expect(availableWidgets.status).toBe(200);
      expect(Array.isArray(availableWidgets.body.widgets)).toBe(true);
      expect(availableWidgets.body.widgets.length).toBeGreaterThan(0);

      // Verify widget structure
      const widget = availableWidgets.body.widgets[0];
      expect(widget.widget_id).toBeDefined();
      expect(widget.name).toBeDefined();
      expect(widget.type).toBeDefined();
      expect(widget.configuration_options).toBeDefined();

      // Step 2: Create custom dashboard layout
      const customLayout = {
        layout_name: 'Test Analytics Dashboard',
        widgets: [
          {
            widget_id: 'platform_usage_summary',
            position: { x: 0, y: 0, width: 6, height: 4 },
            configuration: {
              period: '7d',
              show_trends: true
            }
          },
          {
            widget_id: 'revenue_chart',
            position: { x: 6, y: 0, width: 6, height: 4 },
            configuration: {
              chart_type: 'line',
              period: '12m'
            }
          },
          {
            widget_id: 'system_health_status',
            position: { x: 0, y: 4, width: 4, height: 3 },
            configuration: {
              show_details: true
            }
          },
          {
            widget_id: 'active_users_realtime',
            position: { x: 4, y: 4, width: 4, height: 3 },
            configuration: {
              refresh_interval: 5000
            }
          }
        ]
      };

      const layoutResponse = await adminClient
        .withAuth(adminToken)
        .post('/admin/dashboard/layouts', customLayout);

      expect(layoutResponse.status).toBe(201);
      expect(layoutResponse.body.layout_id).toBeDefined();
      
      const layoutId = layoutResponse.body.layout_id;
      createdResourceIds.push(layoutId);

      // Step 3: Retrieve dashboard data for custom layout
      const dashboardData = await adminClient
        .withAuth(adminToken)
        .get(`/admin/dashboard/layouts/${layoutId}/data`);

      expect(dashboardData.status).toBe(200);
      
      const dashData = dashboardData.body;
      expect(dashData.widgets).toBeDefined();
      expect(Object.keys(dashData.widgets)).toHaveLength(4);

      // Verify each widget has data
      Object.values(dashData.widgets).forEach((widgetData: any) => {
        expect(widgetData.data).toBeDefined();
        expect(widgetData.last_updated).toBeDefined();
        expect(widgetData.status).toBe('loaded');
      });

      // Step 4: Test widget data refresh
      const refreshResponse = await adminClient
        .withAuth(adminToken)
        .post(`/admin/dashboard/layouts/${layoutId}/refresh`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.refresh_id).toBeDefined();
    });
  });

  describe('Data Privacy and Compliance Monitoring', () => {
    test('should monitor data privacy compliance and GDPR requirements', async () => {
      // Step 1: Retrieve privacy compliance dashboard
      const privacyCompliance = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/privacy');

      expect(privacyCompliance.status).toBe(200);
      
      const complianceData = privacyCompliance.body;
      
      // Verify GDPR compliance metrics
      expect(complianceData.gdpr_compliance).toBeDefined();
      expect(complianceData.gdpr_compliance.data_retention_compliant).toBe(true);
      expect(complianceData.gdpr_compliance.consent_tracking_active).toBe(true);
      expect(complianceData.gdpr_compliance.data_processing_logged).toBe(true);

      // Verify data subject rights handling
      expect(complianceData.data_subject_rights).toBeDefined();
      expect(complianceData.data_subject_rights.access_requests_pending).toBeGreaterThanOrEqual(0);
      expect(complianceData.data_subject_rights.deletion_requests_pending).toBeGreaterThanOrEqual(0);
      expect(complianceData.data_subject_rights.average_response_time_hours).toBeGreaterThan(0);

      // Step 2: Verify data encryption and security metrics
      const securityMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/security');

      expect(securityMetrics.status).toBe(200);
      
      const securityData = securityMetrics.body;
      expect(securityData.encryption_status).toBeDefined();
      expect(securityData.encryption_status.data_at_rest_encrypted).toBe(true);
      expect(securityData.encryption_status.data_in_transit_encrypted).toBe(true);
      expect(securityData.encryption_status.pii_fields_encrypted).toBe(true);

      // Step 3: Check audit trail compliance
      const auditCompliance = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/audit-trail');

      expect(auditCompliance.status).toBe(200);
      expect(auditCompliance.body.audit_trail_complete).toBe(true);
      expect(auditCompliance.body.retention_period_days).toBeGreaterThan(0);
      expect(auditCompliance.body.audit_entries_count).toBeGreaterThan(0);

      // Step 4: Verify data breach monitoring
      const breachMonitoring = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/breach-monitoring');

      expect(breachMonitoring.status).toBe(200);
      expect(breachMonitoring.body.active_monitoring).toBe(true);
      expect(breachMonitoring.body.breach_detection_rules).toBeGreaterThan(0);
      expect(breachMonitoring.body.recent_incidents).toBeGreaterThanOrEqual(0);
    });

    test('should track user consent and data processing activities', async () => {
      // Step 1: Retrieve consent management metrics
      const consentMetrics = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/consent-management');

      expect(consentMetrics.status).toBe(200);
      
      const consentData = consentMetrics.body;
      
      // Verify consent tracking
      expect(consentData.consent_statistics).toBeDefined();
      expect(consentData.consent_statistics.total_consents_recorded).toBeGreaterThan(0);
      expect(consentData.consent_statistics.active_consents).toBeGreaterThan(0);
      expect(consentData.consent_statistics.withdrawn_consents).toBeGreaterThanOrEqual(0);

      // Verify consent categories
      expect(consentData.consent_categories).toBeDefined();
      expect(consentData.consent_categories.marketing_consent_rate).toBeGreaterThanOrEqual(0);
      expect(consentData.consent_categories.analytics_consent_rate).toBeGreaterThanOrEqual(0);
      expect(consentData.consent_categories.necessary_processing_rate).toBe(1); // Should be 100%

      // Step 2: Check data processing activity logs
      const processingActivities = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/processing-activities?period=7d');

      expect(processingActivities.status).toBe(200);
      
      const activityData = processingActivities.body;
      expect(activityData.total_processing_activities).toBeGreaterThan(0);
      expect(activityData.processing_purposes).toBeDefined();
      expect(activityData.data_categories_processed).toBeDefined();

      // Step 3: Verify retention policy compliance
      const retentionCompliance = await adminClient
        .withAuth(adminToken)
        .get('/admin/compliance/data-retention');

      expect(retentionCompliance.status).toBe(200);
      expect(retentionCompliance.body.retention_policies_active).toBe(true);
      expect(retentionCompliance.body.automatic_deletion_enabled).toBe(true);
      expect(retentionCompliance.body.data_scheduled_for_deletion).toBeGreaterThanOrEqual(0);
    });
  });
});