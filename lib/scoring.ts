import type { ConversationState, CallSummary } from './types';

interface Turn {
  role: string;
  text: string;
  intent?: string | null;
}

export function scoreCall(state: ConversationState, turns: Turn[]): CallSummary {
  const { topicsCovered, objectionsRaised, leadEngagement, turnCount } = state;
  
  const positiveIntents = turns.filter((t) =>
    t.intent && ['positive_acknowledgement', 'ask_for_details', 'ready_to_sign_up'].includes(t.intent)
  ).length;
  
  const negativeIntents = turns.filter((t) =>
    t.intent && ['think_later', 'not_interested', 'too_busy'].includes(t.intent)
  ).length;
  
  const engagementBonus = positiveIntents > 0 ? 0.2 : 0;
  const engagementPenalty = negativeIntents > 1 ? 0.2 : 0;
  
  const finalEngagement = Math.max(0, Math.min(1, leadEngagement + engagementBonus - engagementPenalty));
  
  const interestScore = calculateInterestScore(
    finalEngagement,
    topicsCovered.length,
    objectionsRaised.length,
    turnCount,
    positiveIntents
  );
  
  let interestLevel: 'HOT' | 'WARM' | 'COLD';
  let nextAction: string;
  let reasoning: string;
  let handoffContext: Record<string, any> | undefined;
  
  if (interestScore >= 0.75 && topicsCovered.length >= 3 && positiveIntents > 0) {
    interestLevel = 'HOT';
    nextAction = 'handoff_rm';
    reasoning = `High engagement (${(finalEngagement * 100).toFixed(0)}%), covered ${topicsCovered.length} key topics, ${positiveIntents} positive signals, and ${objectionsRaised.length} objections successfully addressed. Lead showed clear intent to proceed.`;
    handoffContext = {
      primaryInterest: topicsCovered[0] || 'earning_opportunity',
      concernsAddressed: objectionsRaised,
      preferredContact: 'phone',
      urgency: 'high',
      nextSteps: ['complete_registration', 'kyc_verification', 'training_session'],
    };
  } else if (interestScore >= 0.4 || (topicsCovered.length >= 2 && finalEngagement >= 0.5)) {
    interestLevel = 'WARM';
    nextAction = 'whatsapp_followup';
    reasoning = `Moderate engagement (${(finalEngagement * 100).toFixed(0)}%), ${topicsCovered.length} topics discussed. Lead needs more information or time to decide. ${objectionsRaised.length > 0 ? `Raised concerns: ${objectionsRaised.join(', ')}.` : 'No major objections.'} Follow-up recommended.`;
  } else {
    interestLevel = 'COLD';
    nextAction = 'log_cold';
    reasoning = `Low engagement (${(finalEngagement * 100).toFixed(0)}%), minimal topic coverage (${topicsCovered.length}), or clear disinterest signals. ${negativeIntents > 0 ? `${negativeIntents} negative intent(s) detected.` : ''} Not a priority for immediate follow-up.`;
  }
  
  return {
    interestLevel,
    interestScore,
    reasoning,
    nextAction,
    handoffContext,
  };
}

function calculateInterestScore(
  engagement: number,
  topicsCount: number,
  objectionsCount: number,
  turnCount: number,
  positiveIntents: number
): number {
  const engagementWeight = 0.4;
  const topicsWeight = 0.25;
  const conversationDepthWeight = 0.15;
  const positiveSignalsWeight = 0.2;
  
  const topicsScore = Math.min(1, topicsCount / 5);
  const conversationDepthScore = Math.min(1, turnCount / 12);
  const positiveSignalsScore = Math.min(1, positiveIntents / 3);
  
  const objectionPenalty = Math.min(0.15, objectionsCount * 0.05);
  
  const rawScore =
    engagement * engagementWeight +
    topicsScore * topicsWeight +
    conversationDepthScore * conversationDepthWeight +
    positiveSignalsScore * positiveSignalsWeight -
    objectionPenalty;
  
  return Math.max(0, Math.min(1, rawScore));
}
