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

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sort_by') || 'wedding_date';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('weddings')
      .select(`
        id,
        supplier_id,
        title,
        bride_name,
        groom_name,
        wedding_date,
        ceremony_venue:ceremony_venue_id(id, name, address),
        reception_venue:reception_venue_id(id, name, address),
        guest_count_confirmed,
        guest_count_estimated,
        budget_total,
        status,
        priority,
        contact_email,
        contact_phone,
        notes,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('supplier_id', supplier.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clients, error: clientsError, count } = await query;

    if (clientsError) {
      console.error('Clients fetch error:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      clients: clients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'bride_name', 'groom_name', 'wedding_date', 'contact_email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create new client (wedding record)
    const { data: client, error: insertError } = await supabase
      .from('weddings')
      .insert([{
        supplier_id: supplier.id,
        title: body.title,
        bride_name: body.bride_name,
        groom_name: body.groom_name,
        wedding_date: body.wedding_date,
        ceremony_venue_id: body.ceremony_venue_id || null,
        reception_venue_id: body.reception_venue_id || null,
        guest_count_confirmed: body.guest_count_confirmed || 0,
        guest_count_estimated: body.guest_count_estimated || 0,
        budget_total: body.budget_total || 0,
        status: body.status || 'planning',
        priority: body.priority || 'medium',
        contact_email: body.contact_email,
        contact_phone: body.contact_phone || '',
        notes: body.notes || ''
      }])
      .select(`
        id,
        supplier_id,
        title,
        bride_name,
        groom_name,
        wedding_date,
        ceremony_venue:ceremony_venue_id(id, name, address),
        reception_venue:reception_venue_id(id, name, address),
        guest_count_confirmed,
        guest_count_estimated,
        budget_total,
        status,
        priority,
        contact_email,
        contact_phone,
        notes,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error('Client creation error:', insertError);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });

  } catch (error) {
    console.error('Clients POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}