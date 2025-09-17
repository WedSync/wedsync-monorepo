import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get client (wedding record)
    const { data: client, error: clientError } = await supabase
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
      `)
      .eq('id', params.id)
      .eq('supplier_id', supplier.id)
      .single();

    if (clientError) {
      if (clientError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Client fetch error:', clientError);
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }

    return NextResponse.json({ client });

  } catch (error) {
    console.error('Client GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Update client (wedding record)
    const { data: client, error: updateError } = await supabase
      .from('weddings')
      .update({
        title: body.title,
        bride_name: body.bride_name,
        groom_name: body.groom_name,
        wedding_date: body.wedding_date,
        ceremony_venue_id: body.ceremony_venue_id,
        reception_venue_id: body.reception_venue_id,
        guest_count_confirmed: body.guest_count_confirmed,
        guest_count_estimated: body.guest_count_estimated,
        budget_total: body.budget_total,
        status: body.status,
        priority: body.priority,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('supplier_id', supplier.id)
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

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      console.error('Client update error:', updateError);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ client });

  } catch (error) {
    console.error('Client PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete client (wedding record)
    const { error: deleteError } = await supabase
      .from('weddings')
      .delete()
      .eq('id', params.id)
      .eq('supplier_id', supplier.id);

    if (deleteError) {
      console.error('Client delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Client DELETE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}