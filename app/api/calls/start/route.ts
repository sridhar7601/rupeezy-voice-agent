import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Language } from '@/lib/prisma-types';
import { getKnowledgeBase, getContent } from '@/lib/kb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, language } = body;

    if (!leadId || !language) {
      return NextResponse.json({ error: 'leadId and language are required' }, { status: 400 });
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await db.lead.update({
      where: { id: leadId },
      data: { status: 'CONTACTED' },
    });

    const call = await db.call.create({
      data: {
        leadId,
        language: language as Language,
        topicsCovered: JSON.stringify([]),
        objectionsRaised: JSON.stringify([]),
      },
    });

    const kb = await getKnowledgeBase();
    const openingScript = getContent(kb, 'opening_intro', language as Language);

    await db.turn.create({
      data: {
        callId: call.id,
        role: 'agent',
        text: openingScript,
        intent: null,
      },
    });

    return NextResponse.json({
      callId: call.id,
      openingScript,
      conversationState: {
        language,
        topicsCovered: [],
        objectionsRaised: [],
        lastLeadIntent: null,
        leadEngagement: 0.5,
        turnCount: 0,
      },
    });
  } catch (error) {
    console.error('Error starting call:', error);
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 });
  }
}
