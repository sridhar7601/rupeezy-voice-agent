import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scoreCall } from '@/lib/scoring';
import type { CallOutcome, InterestLevel } from '@/lib/prisma-types';
import type { ConversationState } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: callId } = await params;
    const body = await request.json();
    const { outcome } = body;

    const call = await db.call.findUnique({
      where: { id: callId },
      include: { turns: true, lead: true },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (call.endedAt) {
      return NextResponse.json({ error: 'Call already ended' }, { status: 400 });
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

    const scoring = scoreCall(state, call.turns);

    const durationSec = Math.floor(
      (new Date().getTime() - new Date(call.startedAt).getTime()) / 1000
    );

    let leadStatus = call.lead.status;
    if (scoring.interestLevel === 'HOT') {
      leadStatus = 'QUALIFIED';
    }

    const updatedCall = await db.call.update({
      where: { id: callId },
      data: {
        endedAt: new Date(),
        durationSec,
        outcome: (outcome as CallOutcome) || 'COMPLETED',
        interestLevel: scoring.interestLevel,
        interestScore: scoring.interestScore,
        summary: scoring.reasoning,
        nextAction: scoring.nextAction,
        handoffContext: scoring.handoffContext ? JSON.stringify(scoring.handoffContext) : null,
      },
    });

    await db.lead.update({
      where: { id: call.leadId },
      data: { status: leadStatus },
    });

    return NextResponse.json({
      call: updatedCall,
      scoring,
    });
  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 });
  }
}
