import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const call = await db.call.findUnique({
      where: { id },
      include: {
        lead: true,
        turns: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
  }
}
