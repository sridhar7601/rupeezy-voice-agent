import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { respondToLead } from '@/lib/ai';
import { generateAgentTurn, hasLLM } from '@/lib/llm-conversation';
import { getKnowledgeBase } from '@/lib/kb';
import type { ConversationState } from '@/lib/types';
import type { Language } from '@/lib/prisma-types';

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
      include: { turns: true, lead: true },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const topicsCovered = JSON.parse(call.topicsCovered) as string[];
    const objectionsRaised = JSON.parse(call.objectionsRaised) as string[];

    const state: ConversationState = {
      language: call.language as Language,
      topicsCovered,
      objectionsRaised,
      lastLeadIntent: null,
      leadEngagement: call.interestScore || 0.5,
      turnCount: call.turns.length,
    };

    const leadTurn = await db.turn.create({
      data: { callId, role, text, intent: null },
    });

    if (role === 'lead') {
      const kb = await getKnowledgeBase();

      // Try real Azure GPT-4.1 first; fall back to mock if unavailable.
      let agentText = '';
      let intent: string | null = null;
      let nextTopicsCovered = topicsCovered;
      let nextObjectionsRaised = objectionsRaised;
      let nextEngagement = state.leadEngagement;
      let shouldClose = false;
      let closeReason: string | undefined;
      let usedLLM = false;
      let detectedLanguage: Language = state.language;

      if (hasLLM()) {
        const history = call.turns.map((t) => ({
          role: t.role as 'lead' | 'agent',
          text: t.text,
        }));
        const llmOut = await generateAgentTurn({
          leadName: call.lead.name,
          leadText: text,
          language: state.language,
          history,
          state,
          kb,
        });
        if (llmOut) {
          agentText = llmOut.text;
          intent = llmOut.intent;
          nextTopicsCovered = llmOut.topicsCovered;
          nextObjectionsRaised = llmOut.objectionsRaised;
          nextEngagement = Math.max(0, Math.min(1, state.leadEngagement + llmOut.engagementDelta));
          shouldClose = llmOut.shouldClose;
          closeReason = llmOut.closeReason;
          detectedLanguage = llmOut.detectedLanguage;
          usedLLM = true;
        }
      }

      if (!usedLLM) {
        const mockResponse = await respondToLead(text, state, kb);
        agentText = mockResponse.text;
        intent = mockResponse.nextState.lastLeadIntent;
        nextTopicsCovered = mockResponse.nextState.topicsCovered;
        nextObjectionsRaised = mockResponse.nextState.objectionsRaised;
        nextEngagement = mockResponse.nextState.leadEngagement;
        shouldClose = mockResponse.shouldClose;
        closeReason = mockResponse.reason;
      }

      const agentTurn = await db.turn.create({
        data: { callId, role: 'agent', text: agentText, intent },
      });

      await db.turn.update({ where: { id: leadTurn.id }, data: { intent } });

      await db.call.update({
        where: { id: callId },
        data: {
          topicsCovered: JSON.stringify(nextTopicsCovered),
          objectionsRaised: JSON.stringify(nextObjectionsRaised),
          interestScore: nextEngagement,
          language: detectedLanguage,
        },
      });

      return NextResponse.json({
        leadTurn,
        agentResponse: {
          turn: agentTurn,
          text: agentText,
          shouldClose,
          reason: closeReason,
          poweredBy: usedLLM ? 'azure-gpt-4.1' : 'mock',
        },
        conversationState: {
          language: detectedLanguage,
          topicsCovered: nextTopicsCovered,
          objectionsRaised: nextObjectionsRaised,
          lastLeadIntent: intent,
          leadEngagement: nextEngagement,
          turnCount: state.turnCount + 2,
        },
      });
    }

    return NextResponse.json({ turn: leadTurn });
  } catch (error) {
    console.error('Error adding turn:', error);
    return NextResponse.json({ error: 'Failed to add turn' }, { status: 500 });
  }
}
