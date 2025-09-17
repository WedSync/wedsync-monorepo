import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user's supplier ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier record
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get today's weddings for this supplier
    const today = new Date().toISOString().split('T')[0];
    
    const { data: weddings, error: weddingsError } = await supabase
      .from('weddings')
      .select(`
        id,
        title,
        wedding_date,
        ceremony_venue:ceremony_venue_id(name, address),
        reception_venue:reception_venue_id(name, address),
        guest_count_confirmed
      `)
      .eq('wedding_date', today)
      .eq('supplier_id', supplier.id)
      .limit(1);

    if (weddingsError) {
      return NextResponse.json({ error: 'Failed to fetch weddings' }, { status: 500 });
    }

    const wedding = weddings?.[0];
    
    if (!wedding) {
      return NextResponse.json({ wedding: null });
    }

    // Mock weather data (in production, this would come from a weather API)
    const weather = {
      temperature: 72,
      condition: 'Partly cloudy',
      precipitation: 20
    };

    // Mock directions data (in production, this would come from Google Maps API)
    const directions = {
      distance: '15.2 miles',
      duration: '22 minutes',
      route_url: `https://maps.google.com/directions?destination=${encodeURIComponent(wedding.ceremony_venue.address)}`
    };

    // Mock emergency contacts (in production, these would be stored in the database)
    const contacts = [
      {
        name: 'Wedding Coordinator',
        role: 'Day-of Coordinator',
        phone: '(555) 123-4567',
        email: 'coordinator@venue.com'
      },
      {
        name: 'Venue Manager',
        role: 'Venue Contact',
        phone: '(555) 987-6543',
        email: 'manager@venue.com'
      }
    ];

    return NextResponse.json({
      wedding: {
        ...wedding,
        weather,
        directions,
        contacts
      }
    });

  } catch (error) {
    console.error('Dashboard today API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}