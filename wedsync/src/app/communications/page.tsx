'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { 
  MessageSquare, 
  Send, 
  Mail, 
  Phone, 
  MessageCircle,
  Search,
  Filter,
  Plus,
  Reply,
  Forward,
  Archive,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Communication {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  type: 'email' | 'sms' | 'whatsapp' | 'internal';
  content: {
    subject?: string;
    body: string;
  };
  status: 'draft' | 'scheduled' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface NewMessage {
  recipient_id: string;
  message_type: 'email' | 'sms' | 'whatsapp' | 'internal';
  subject?: string;
  content: string;
  wedding_id?: string;
}

const messageTypeIcons = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageCircle,
  internal: MessageSquare
};

const statusColors = {
  draft: 'gray',
  scheduled: 'blue',
  queued: 'yellow',
  sending: 'orange',
  sent: 'green',
  delivered: 'green',
  read: 'green',
  failed: 'red'
} as const;

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [newMessage, setNewMessage] = useState<NewMessage>({
    recipient_id: '',
    message_type: 'email',
    subject: '',
    content: '',
    wedding_id: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const response = await fetch('/api/communications');
      if (response.ok) {
        const data = await response.json();
        setCommunications(data.communications || []);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.content.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMessage)
      });

      if (response.ok) {
        setNewMessage({
          recipient_id: '',
          message_type: 'email',
          subject: '',
          content: '',
          wedding_id: ''
        });
        setShowCompose(false);
        fetchCommunications();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = searchTerm === '' || 
      comm.content.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.recipient.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || comm.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeIcon = (type: string) => {
    const IconComponent = messageTypeIcons[type as keyof typeof messageTypeIcons] || MessageSquare;
    return <IconComponent className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-1">Manage your client communications and messages</p>
        </div>
        <Button onClick={() => setShowCompose(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages ({filteredCommunications.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {filteredCommunications.length > 0 ? (
                  filteredCommunications.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?.id === comm.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedMessage(comm)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {getMessageTypeIcon(comm.type)}
                            <Badge variant="outline" className={`text-xs`}>
                              {comm.type}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 truncate">
                                {comm.sender.name} → {comm.recipient.name}
                              </p>
                              <span className="text-sm text-gray-500">
                                {formatDate(comm.created_at)}
                              </span>
                            </div>
                            {comm.content.subject && (
                              <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                                {comm.content.subject}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {comm.content.body}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-xs bg-${statusColors[comm.status]}-50 text-${statusColors[comm.status]}-700 border-${statusColors[comm.status]}-200`}
                              >
                                {comm.status}
                              </Badge>
                              {comm.read_at && (
                                <Badge variant="outline" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Read
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Start communicating with your clients by composing a new message.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail / Compose */}
        <div className="lg:col-span-1">
          {showCompose ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message-type">Message Type</Label>
                  <select
                    id="message-type"
                    value={newMessage.message_type}
                    onChange={(e) => setNewMessage({
                      ...newMessage,
                      message_type: e.target.value as any
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="recipient">Recipient ID</Label>
                  <Input
                    id="recipient"
                    value={newMessage.recipient_id}
                    onChange={(e) => setNewMessage({
                      ...newMessage,
                      recipient_id: e.target.value
                    })}
                    placeholder="Enter recipient ID"
                  />
                </div>

                {newMessage.message_type === 'email' && (
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({
                        ...newMessage,
                        subject: e.target.value
                      })}
                      placeholder="Enter subject"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="content">Message</Label>
                  <textarea
                    id="content"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({
                      ...newMessage,
                      content: e.target.value
                    })}
                    placeholder="Enter your message"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 h-32 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={sendMessage}
                    disabled={sending || !newMessage.content.trim()}
                    className="flex-1"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCompose(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getMessageTypeIcon(selectedMessage.type)}
                    Message Details
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {selectedMessage.sender.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {selectedMessage.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedMessage.sender.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>

                {selectedMessage.content.subject && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subject</h4>
                    <p className="text-sm text-gray-700">
                      {selectedMessage.content.subject}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.content.body}
                    </p>
                  </div>
                </div>

                {(selectedMessage.sent_at || selectedMessage.delivered_at || selectedMessage.read_at) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Status</h4>
                    <div className="space-y-2 text-sm">
                      {selectedMessage.sent_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Sent: {formatDate(selectedMessage.sent_at)}</span>
                        </div>
                      )}
                      {selectedMessage.delivered_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Delivered: {formatDate(selectedMessage.delivered_at)}</span>
                        </div>
                      )}
                      {selectedMessage.read_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span>Read: {formatDate(selectedMessage.read_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
                <p className="text-gray-600 mb-4">
                  Choose a message from the list to view its details.
                </p>
                <Button onClick={() => setShowCompose(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Compose New Message
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}