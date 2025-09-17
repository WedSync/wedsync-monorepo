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

    // Get active forms count
    const { count: activeForms, error: formsError } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)
      .eq('is_active', true);

    if (formsError) {
      console.error('Forms count error:', formsError);
    }

    // Get active journeys count
    const { count: activeJourneys, error: journeysError } = await supabase
      .from('journeys')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)
      .eq('is_active', true);

    if (journeysError) {
      console.error('Journeys count error:', journeysError);
    }

    // Get total clients count (weddings associated with this supplier)
    const { count: totalClients, error: clientsError } = await supabase
      .from('weddings')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id);

    if (clientsError) {
      console.error('Clients count error:', clientsError);
    }

    // Get pending submissions count
    const { count: pendingSubmissions, error: submissionsError } = await supabase
      .from('form_submissions')
      .select('form_id, forms!inner(supplier_id)', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .eq('forms.supplier_id', supplier.id);

    if (submissionsError) {
      console.error('Submissions count error:', submissionsError);
    }

    // Get unread messages count
    const { count: messagesUnread, error: messagesError } = await supabase
      .from('communications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('status', 'sent');

    if (messagesError) {
      console.error('Messages count error:', messagesError);
    }

    // Calculate engagement score (simplified mock calculation)
    // In production, this would be based on complex metrics
    const engagementScore = Math.min(100, Math.max(0, 
      ((pendingSubmissions || 0) * 10) + 
      ((activeForms || 0) * 5) + 
      ((activeJourneys || 0) * 15) + 
      (Math.random() * 20) // Add some variance
    ));

    const metrics = {
      active_forms: activeForms || 0,
      active_journeys: activeJourneys || 0,
      total_clients: totalClients || 0,
      engagement_score: Math.round(engagementScore),
      pending_submissions: pendingSubmissions || 0,
      messages_unread: messagesUnread || 0
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Dashboard metrics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}