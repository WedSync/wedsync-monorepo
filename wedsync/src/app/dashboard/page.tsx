'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TodayWeddingModal from '@/components/TodayWeddingModal';

import { 
  Calendar, 
  Users, 
  FileText, 
  Route, 
  MessageSquare, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';

interface TodayWedding {
  id: string;
  title: string;
  wedding_date: string;
  ceremony_venue: {
    name: string;
    address: string;
  };
  reception_venue: {
    name: string;
    address: string;
  };
  guest_count_confirmed: number;
  weather?: {
    temperature: number;
    condition: string;
    precipitation: number;
  };
  directions?: {
    distance: string;
    duration: string;
    route_url: string;
  };
  contacts: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
  }>;
}

interface DashboardMetrics {
  active_forms: number;
  active_journeys: number;
  total_clients: number;
  engagement_score: number;
  pending_submissions: number;
  messages_unread: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayWedding, setTodayWedding] = useState<TodayWedding | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    active_forms: 0,
    active_journeys: 0,
    total_clients: 0,
    engagement_score: 0,
    pending_submissions: 0,
    messages_unread: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's wedding data
      const todayResponse = await fetch('/api/dashboard/today');
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayWedding(todayData.wedding);
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/dashboard/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.activities);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.supplier?.business_name || 'Supplier'}
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your wedding business today
          </p>
        </div>

        {/* Today's Wedding Alert */}
        {todayWedding && (
          <Card className="mb-8 border-2 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-amber-900">Today's Wedding</CardTitle>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTodayModal(true)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-amber-900">{todayWedding.title}</p>
                  <p className="text-sm text-amber-700">{formatDate(todayWedding.wedding_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-700">Ceremony</p>
                  <p className="font-medium text-amber-900">{todayWedding.ceremony_venue.name}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-700">Guests</p>
                  <p className="font-medium text-amber-900">{todayWedding.guest_count_confirmed} confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Active Forms</CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.active_forms}</div>
              <p className="text-xs text-slate-600">
                {metrics.pending_submissions} pending submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Active Journeys</CardTitle>
                <Route className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.active_journeys}</div>
              <p className="text-xs text-slate-600">
                Automated workflows running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.total_clients}</div>
              <p className="text-xs text-slate-600">
                Wedding couples managed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Engagement Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.engagement_score}%</div>
              <p className="text-xs text-slate-600">
                Average client engagement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/forms/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Form
                </a>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/journeys/create">
                  <Route className="h-4 w-4 mr-2" />
                  Build Customer Journey
                </a>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/clients/add">
                  <Users className="h-4 w-4 mr-2" />
                  Add New Client
                </a>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <a href="/communications">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages ({metrics.messages_unread})
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your clients and forms</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activity.user.name} • {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Wedding Modal */}
        {todayWedding && (
          <TodayWeddingModal
            isOpen={showTodayModal}
            onClose={() => setShowTodayModal(false)}
            wedding={todayWedding}
          />
        )}
      </div>
    </div>
  );
}