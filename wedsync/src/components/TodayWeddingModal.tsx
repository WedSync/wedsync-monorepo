'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Users, 
  MapPin,
  Cloud,
  Route,
  Phone
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

interface TodayWeddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  wedding: TodayWedding;
}

export default function TodayWeddingModal({ isOpen, onClose, wedding }: TodayWeddingModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Wedding Details
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{wedding.title}</h3>
            <p className="text-slate-600">{formatDate(wedding.wedding_date)}</p>
          </div>

          {/* Venues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Ceremony Venue
              </h4>
              <p className="text-sm font-medium">{wedding.ceremony_venue.name}</p>
              <p className="text-sm text-slate-600">{wedding.ceremony_venue.address}</p>
            </div>
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Reception Venue
              </h4>
              <p className="text-sm font-medium">{wedding.reception_venue.name}</p>
              <p className="text-sm text-slate-600">{wedding.reception_venue.address}</p>
            </div>
          </div>

          {/* Weather & Directions */}
          {(wedding.weather || wedding.directions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wedding.weather && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4" />
                    Weather
                  </h4>
                  <p className="text-sm">
                    {wedding.weather.temperature}°F, {wedding.weather.condition}
                  </p>
                  {wedding.weather.precipitation > 0 && (
                    <p className="text-sm text-slate-600">
                      {wedding.weather.precipitation}% chance of rain
                    </p>
                  )}
                </div>
              )}
              {wedding.directions && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Route className="h-4 w-4" />
                    Directions
                  </h4>
                  <p className="text-sm">{wedding.directions.distance} • {wedding.directions.duration}</p>
                  <a 
                    href={wedding.directions.route_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open in Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Guest Count */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              Guest Count
            </h4>
            <p className="text-sm">{wedding.guest_count_confirmed} confirmed guests</p>
          </div>

          {/* Emergency Contacts */}
          {wedding.contacts.length > 0 && (
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Emergency Contacts
              </h4>
              <div className="space-y-2">
                {wedding.contacts.map((contact, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-slate-600">{contact.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{contact.phone}</p>
                      <p className="text-xs text-slate-600">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}