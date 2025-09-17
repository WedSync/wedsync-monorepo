'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { 
  GitBranch, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  Users,
  Calendar,
  Filter,
  MoreHorizontal,
  Workflow,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Journey {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  trigger_type: 'form_submission' | 'date_based' | 'manual' | 'event_based';
  trigger_config: object;
  steps: JourneyStep[];
  is_active: boolean;
  enrollment_count: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
  wedding?: {
    id: string;
    title: string;
    wedding_date: string;
  };
}

interface JourneyStep {
  id: string;
  type: 'email' | 'sms' | 'delay' | 'condition' | 'form' | 'task';
  name: string;
  config: object;
  order: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function JourneysPage() {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [filteredJourneys, setFilteredJourneys] = useState<Journey[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    filterJourneys();
  }, [journeys, searchQuery, filterActive, filterTrigger]);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/journeys?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJourneys(data.journeys || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to fetch journeys:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJourneys = () => {
    let filtered = journeys;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(journey => 
        journey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        journey.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by active status
    if (filterActive !== null) {
      filtered = filtered.filter(journey => journey.is_active === filterActive);
    }

    // Filter by trigger type
    if (filterTrigger) {
      filtered = filtered.filter(journey => journey.trigger_type === filterTrigger);
    }

    setFilteredJourneys(filtered);
  };

  const handleDeleteJourney = async (journeyId: string) => {
    if (!confirm('Are you sure you want to delete this journey? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/journeys/${journeyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setJourneys(journeys.filter(journey => journey.id !== journeyId));
      }
    } catch (error) {
      console.error('Failed to delete journey:', error);
    }
  };

  const handleToggleActive = async (journeyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/journeys/${journeyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        const updatedJourney = await response.json();
        setJourneys(journeys.map(journey => 
          journey.id === journeyId ? { ...journey, is_active: updatedJourney.is_active } : journey
        ));
      }
    } catch (error) {
      console.error('Failed to toggle journey status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? (
          <>
            <Play className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <Pause className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  const getTriggerBadge = (triggerType: string) => {
    const triggers = {
      'form_submission': { label: 'Form Submit', color: 'bg-blue-100 text-blue-800' },
      'date_based': { label: 'Date Based', color: 'bg-green-100 text-green-800' },
      'manual': { label: 'Manual', color: 'bg-gray-100 text-gray-800' },
      'event_based': { label: 'Event Based', color: 'bg-purple-100 text-purple-800' }
    };

    const trigger = triggers[triggerType as keyof typeof triggers] || triggers.manual;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trigger.color}`}>
        {trigger.label}
      </span>
    );
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Journey Builder</h1>
              <p className="text-slate-600">
                Create automated workflows to guide your clients through their wedding planning journey
              </p>
            </div>
            <Button asChild>
              <a href="/journeys/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Journey
              </a>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search journeys by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterActive === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(null)}
                >
                  All Status
                </Button>
                <Button
                  variant={filterActive === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(true)}
                >
                  Active
                </Button>
                <Button
                  variant={filterActive === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(false)}
                >
                  Inactive
                </Button>
                <Button
                  variant={filterTrigger === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterTrigger(null)}
                >
                  All Triggers
                </Button>
                <Button
                  variant={filterTrigger === 'form_submission' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterTrigger('form_submission')}
                >
                  Form Based
                </Button>
                <Button
                  variant={filterTrigger === 'date_based' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterTrigger('date_based')}
                >
                  Date Based
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journeys Grid */}
        {filteredJourneys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredJourneys.map((journey) => (
              <Card key={journey.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Workflow className="h-5 w-5 text-slate-600" />
                        <CardTitle className="text-lg font-semibold text-slate-900 truncate">
                          {journey.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(journey.is_active)}
                        {getTriggerBadge(journey.trigger_type)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  {journey.description && (
                    <CardDescription className="line-clamp-2">
                      {journey.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Journey Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-slate-600 text-sm">
                          <Users className="h-3 w-3" />
                          Enrolled
                        </div>
                        <div className="font-semibold text-slate-900">
                          {journey.enrollment_count}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-slate-600 text-sm">
                          <TrendingUp className="h-3 w-3" />
                          Completion
                        </div>
                        <div className={`font-semibold ${getCompletionRateColor(journey.completion_rate)}`}>
                          {Math.round(journey.completion_rate)}%
                        </div>
                      </div>
                    </div>

                    {/* Journey Steps */}
                    <div>
                      <div className="flex items-center gap-1 text-slate-600 text-sm mb-1">
                        <GitBranch className="h-3 w-3" />
                        Steps
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {journey.steps.slice(0, 3).map((step, index) => (
                          <Badge key={step.id} variant="outline" className="text-xs">
                            {step.name}
                          </Badge>
                        ))}
                        {journey.steps.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{journey.steps.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Wedding Info */}
                    {journey.wedding && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-600 text-sm mb-1">
                          <Calendar className="h-3 w-3" />
                          Wedding
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-slate-900 truncate">
                            {journey.wedding.title}
                          </div>
                          <div className="text-slate-500">
                            {formatDate(journey.wedding.wedding_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Updated Date */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      Updated {formatDate(journey.updated_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`/journeys/${journey.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`/journeys/${journey.id}/edit`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(journey.id, journey.is_active)}
                        className="px-2"
                      >
                        {journey.is_active ? 'Pause' : 'Start'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Workflow className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchQuery || filterActive !== null || filterTrigger !== null ? 'No journeys found' : 'No journeys yet'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || filterActive !== null || filterTrigger !== null
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by creating your first journey to automate your client communication and engagement.'
                  }
                </p>
                {!searchQuery && filterActive === null && filterTrigger === null && (
                  <Button asChild>
                    <a href="/journeys/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Journey
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} journeys
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}