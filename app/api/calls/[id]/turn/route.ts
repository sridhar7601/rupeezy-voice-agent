import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { respondToLead } from '@/lib/ai';
import { getKnowledgeBase } from '@/lib/kb';
import type { ConversationState } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: callId } = await params;
    const body = await request.json();
    const { role, text } = body;

    if (!role || !text) {
      return NextResponse.json({ error: 'role and text are required' }, { status: 400 });
    }

    const call = await db.call.findUnique({
      where: { id: callId },
      include: { turns: true },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const topicsCovered = JSON.parse(call.topicsCovered) as string[];
    const objectionsRaised = JSON.parse(call.objectionsRaised) as string[];

    const state: ConversationState = {
      language: call.language as import('@/lib/prisma-types').Language,
      topicsCovered,
      objectionsRaised,
      lastLeadIntent: null,
      leadEngagement: call.interestScore || 0.5,
      turnCount: call.turns.length,
    };

    const leadTurn = await db.turn.create({
      data: {
        callId,
        role,
        text,
        intent: null,
      },
    });

    if (role === 'lead') {
      const kb = await getKnowledgeBase();
      const response = await respondToLead(text, state, kb);

      const agentTurn = await db.turn.create({
        data: {
          callId,
          role: 'agent',
          text: response.text,
          intent: response.nextState.lastLeadIntent,
        },
      });

      await db.turn.update({
        where: { id: leadTurn.id },
        data: { intent: response.nextState.lastLeadIntent },
      });

      await db.call.update({
        where: { id: callId },
        data: {
          topicsCovered: JSON.stringify(response.nextState.topicsCovered),
          objectionsRaised: JSON.stringify(response.nextState.objectionsRaised),
          interestScore: response.nextState.leadEngagement,
        },
      });

      return NextResponse.json({
        leadTurn,
        agentResponse: {
          turn: agentTurn,
          text: response.text,
          shouldClose: response.shouldClose,
          reason: response.reason,
        },
        conversationState: response.nextState,
      });
    }

    return NextResponse.json({ turn: leadTurn });
  } catch (error) {
    console.error('Error adding turn:', error);
    return NextResponse.json({ error: 'Failed to add turn' }, { status: 500 });
  }
}
