'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ClientEngagementResponse, EngagementEvent } from '@wedsync/types';
import { Activity, TrendingUp, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface EngagementDashboardProps {
  weddingId: string;
  className?: string;
}

export function EngagementDashboard({ weddingId, className }: EngagementDashboardProps) {
  const [engagement, setEngagement] = useState<ClientEngagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${weddingId}/engagement`);
        if (!response.ok) {
          throw new Error('Failed to fetch engagement data');
        }
        const data = await response.json();
        setEngagement(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (weddingId) {
      fetchEngagement();
    }
  }, [weddingId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Less than an hour ago';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'form_submission':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'journey_step':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'communication':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Client Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Engagement Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error || 'Failed to load engagement data'}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Client Engagement Score
            </div>
            <Badge variant={getScoreBadgeVariant(engagement.overallScore)} className="text-lg px-3 py-1">
              {engagement.overallScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-center p-4 rounded-lg ${getScoreColor(engagement.overallScore)}`}>
              <div className="text-3xl font-bold">{engagement.overallScore}</div>
              <div className="text-sm opacity-75">Overall Score</div>
            </div>
            <div className="flex-1 space-y-2">
              {engagement.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-blue-500" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{engagement.metrics.formSubmissions}</div>
                <div className="text-sm text-gray-600">Form Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{engagement.metrics.journeyProgress}%</div>
                <div className="text-sm text-gray-600">Journey Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{engagement.metrics.responseRate}%</div>
                <div className="text-sm text-gray-600">Response Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{engagement.metrics.averageResponseTime}h</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            <Badge variant="outline" className="ml-auto">
              Last activity: {formatTimeAgo(engagement.metrics.lastActivity)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engagement.timeline.slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <time className="text-xs text-gray-500">
                      {formatTimeAgo(event.date)}
                    </time>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Score: {event.score}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            {engagement.timeline.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Engagement events will appear here as they happen</p>
              </div>
            )}
            
            {engagement.timeline.length > 10 && (
              <Button variant="outline" className="w-full">
                View All Activity ({engagement.timeline.length} total)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}