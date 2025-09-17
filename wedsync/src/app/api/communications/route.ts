import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const weddingId = searchParams.get('wedding_id');
    const messageType = searchParams.get('message_type');
    
    let query = supabase
      .from('communications')
      .select(`
        id,
        conversation_id,
        sender_id,
        recipient_id,
        type,
        content,
        status,
        sent_at,
        delivered_at,
        read_at,
        created_at,
        sender:sender_id(id, name, email),
        recipient:recipient_id(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (weddingId) {
      query = query.eq('wedding_id', weddingId);
    }

    if (messageType) {
      query = query.eq('type', messageType);
    }

    const { data: communications, error } = await query;

    if (error) {
      console.error('Error fetching communications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch communications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ communications });
  } catch (error) {
    console.error('Communications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    const { 
      wedding_id, 
      recipient_id, 
      message_type, 
      subject, 
      content, 
      scheduled_for 
    } = body;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const communicationData = {
      wedding_id,
      sender_id: user.id,
      recipient_id,
      type: message_type,
      content: {
        subject,
        body: content
      },
      status: scheduled_for ? 'scheduled' : 'sent',
      scheduled_at: scheduled_for,
      sent_at: scheduled_for ? null : new Date().toISOString(),
      metadata: {
        priority: 'normal',
        tags: [],
        source: 'manual'
      }
    };

    const { data: communication, error } = await supabase
      .from('communications')
      .insert(communicationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating communication:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ communication }, { status: 201 });
  } catch (error) {
    console.error('Communications POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}