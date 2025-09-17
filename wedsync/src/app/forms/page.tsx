'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  BarChart3,
  Users,
  Calendar,
  Filter,
  MoreHorizontal
} from 'lucide-react';

interface Form {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  fields_schema: object;
  conditional_logic: object;
  is_active: boolean;
  submission_count: number;
  completion_rate: number;
  ai_generated: boolean;
  created_at: string;
  wedding?: {
    id: string;
    title: string;
    wedding_date: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function FormsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [filteredForms, setFilteredForms] = useState<Form[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    filterForms();
  }, [forms, searchQuery, filterActive]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/forms?${params}`);
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterForms = () => {
    let filtered = forms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(form => 
        form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by active status
    if (filterActive !== null) {
      filtered = filtered.filter(form => form.is_active === filterActive);
    }

    setFilteredForms(filtered);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setForms(forms.filter(form => form.id !== formId));
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
    }
  };

  const handleToggleActive = async (formId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setForms(forms.map(form => 
          form.id === formId ? { ...form, is_active: updatedForm.is_active } : form
        ));
      }
    } catch (error) {
      console.error('Failed to toggle form status:', error);
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Forms</h1>
              <p className="text-slate-600">
                Manage your wedding forms and collect client information
              </p>
            </div>
            <Button asChild>
              <a href="/forms/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
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
                  placeholder="Search forms by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterActive(null)}
                >
                  All
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forms Grid */}
        {filteredForms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredForms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-semibold text-slate-900 truncate">
                          {form.name}
                        </CardTitle>
                        {form.ai_generated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(form.is_active)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.description && (
                    <CardDescription className="line-clamp-2">
                      {form.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-slate-600 text-sm">
                          <Users className="h-3 w-3" />
                          Submissions
                        </div>
                        <div className="font-semibold text-slate-900">
                          {form.submission_count}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-slate-600 text-sm">
                          <BarChart3 className="h-3 w-3" />
                          Completion
                        </div>
                        <div className={`font-semibold ${getCompletionRateColor(form.completion_rate)}`}>
                          {Math.round(form.completion_rate)}%
                        </div>
                      </div>
                    </div>

                    {/* Wedding Info */}
                    {form.wedding && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-600 text-sm mb-1">
                          <Calendar className="h-3 w-3" />
                          Wedding
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-slate-900 truncate">
                            {form.wedding.title}
                          </div>
                          <div className="text-slate-500">
                            {formatDate(form.wedding.wedding_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-slate-500">
                      Created {formatDate(form.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`/forms/${form.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={`/forms/${form.id}/edit`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(form.id, form.is_active)}
                        className="px-2"
                      >
                        {form.is_active ? 'Disable' : 'Enable'}
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
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchQuery || filterActive !== null ? 'No forms found' : 'No forms yet'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || filterActive !== null 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by creating your first form to collect information from your wedding clients.'
                  }
                </p>
                {!searchQuery && filterActive === null && (
                  <Button asChild>
                    <a href="/forms/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Form
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
                  {pagination.total} forms
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