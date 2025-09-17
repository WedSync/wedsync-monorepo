'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Filter,
  MoreHorizontal,
  Heart,
  Clock,
  Star
} from 'lucide-react';

interface Client {
  id: string;
  supplier_id: string;
  title: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  ceremony_venue: {
    id: string;
    name: string;
    address: string;
  } | null;
  reception_venue: {
    id: string;
    name: string;
    address: string;
  } | null;
  guest_count_confirmed: number;
  guest_count_estimated: number;
  budget_total: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  contact_email: string;
  contact_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'wedding_date' | 'created_at' | 'bride_name'>('wedding_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, [pagination.page, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, filterStatus, filterPriority]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      const response = await fetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(client => 
        client.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.bride_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.groom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(client => client.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority) {
      filtered = filtered.filter(client => client.priority === filterPriority);
    }

    setFilteredClients(filtered);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setClients(clients.filter(client => client.id !== clientId));
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planning: { label: 'Planning', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Confirmed', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planning;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', color: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Star className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getDaysUntilWedding = (weddingDate: string) => {
    const today = new Date();
    const wedding = new Date(weddingDate);
    const diffTime = wedding.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Client Management</h1>
              <p className="text-slate-600">
                Manage your wedding couples and track their journey to the big day
              </p>
            </div>
            <Button asChild>
              <a href="/clients/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </a>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search clients by name, email, or wedding title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterStatus === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(null)}
                >
                  All Status
                </Button>
                <Button
                  variant={filterStatus === 'planning' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus('planning')}
                >
                  Planning
                </Button>
                <Button
                  variant={filterStatus === 'confirmed' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus('confirmed')}
                >
                  Confirmed
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed
                </Button>
                <div className="border-l border-slate-200 mx-2"></div>
                <Button
                  variant={filterPriority === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority(null)}
                >
                  All Priority
                </Button>
                <Button
                  variant={filterPriority === 'high' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority('high')}
                >
                  High
                </Button>
                <Button
                  variant={filterPriority === 'medium' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority('medium')}
                >
                  Medium
                </Button>
                <Button
                  variant={filterPriority === 'low' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority('low')}
                >
                  Low
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredClients.map((client) => {
              const daysUntilWedding = getDaysUntilWedding(client.wedding_date);
              const isUpcoming = daysUntilWedding >= 0 && daysUntilWedding <= 30;
              
              return (
                <Card key={client.id} className={`hover:shadow-md transition-shadow ${isUpcoming ? 'border-2 border-amber-200' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-5 w-5 text-pink-600" />
                          <CardTitle className="text-lg font-semibold text-slate-900 truncate">
                            {client.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(client.status)}
                          {getPriorityBadge(client.priority)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {client.bride_name} & {client.groom_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Wedding Date */}
                      <div>
                        <div className="flex items-center gap-1 text-slate-600 text-sm mb-1">
                          <Calendar className="h-3 w-3" />
                          Wedding Date
                        </div>
                        <div className="font-medium text-slate-900">
                          {formatDate(client.wedding_date)}
                          {isUpcoming && (
                            <span className="ml-2 text-xs text-amber-600 font-semibold">
                              ({daysUntilWedding} days)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Venue Info */}
                      {client.ceremony_venue && (
                        <div>
                          <div className="flex items-center gap-1 text-slate-600 text-sm mb-1">
                            <MapPin className="h-3 w-3" />
                            Ceremony
                          </div>
                          <div className="text-sm text-slate-900 truncate">
                            {client.ceremony_venue.name}
                          </div>
                        </div>
                      )}

                      {/* Guest Count & Budget */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-slate-600 text-sm">
                            <Users className="h-3 w-3" />
                            Guests
                          </div>
                          <div className="font-semibold text-slate-900">
                            {client.guest_count_confirmed || client.guest_count_estimated}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-600 text-sm">Budget</div>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(client.budget_total)}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 truncate">{client.contact_email}</span>
                          </div>
                          {client.contact_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600">{client.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Updated Date */}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        Updated {formatDate(client.updated_at)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={`/clients/${client.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={`/clients/${client.id}/edit`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          className="px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchQuery || filterStatus !== null || filterPriority !== null ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || filterStatus !== null || filterPriority !== null
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by adding your first wedding couple to begin managing their journey.'
                  }
                </p>
                {!searchQuery && filterStatus === null && filterPriority === null && (
                  <Button asChild>
                    <a href="/clients/add">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Client
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
                  {pagination.total} clients
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