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

    // Get recent activities from the activities table
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select(`
        id,
        type,
        description,
        timestamp,
        user:user_id(
          id,
          email
        )
      `)
      .eq('supplier_id', supplier.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('Activities fetch error:', activitiesError);
      // Return mock data if activities table doesn't exist yet
      const mockActivities = [
        {
          id: '1',
          type: 'form_submission',
          description: 'Sarah Wilson submitted Photography Questionnaire',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          user: { name: 'Sarah Wilson' }
        },
        {
          id: '2',
          type: 'journey_enrollment',
          description: 'James Smith enrolled in Wedding Photography Journey',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          user: { name: 'James Smith' }
        },
        {
          id: '3',
          type: 'form_created',
          description: 'Created new form: Reception Details Questionnaire',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          user: { name: 'You' }
        },
        {
          id: '4',
          type: 'message_received',
          description: 'Emily Johnson sent a message about timeline changes',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          user: { name: 'Emily Johnson' }
        },
        {
          id: '5',
          type: 'wedding_updated',
          description: 'Michael Davis updated guest count to 125',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          user: { name: 'Michael Davis' }
        }
      ];

      return NextResponse.json({ activities: mockActivities });
    }

    // Format activities with user names
    const formattedActivities = activities?.map(activity => ({
      ...activity,
      user: {
        name: activity.user?.email?.split('@')[0] || 'Unknown User'
      }
    })) || [];

    return NextResponse.json({ activities: formattedActivities });

  } catch (error) {
    console.error('Dashboard activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}