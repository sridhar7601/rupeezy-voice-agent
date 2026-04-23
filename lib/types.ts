import type { Language } from './prisma-types';

export interface ConversationState {
  language: Language;
  topicsCovered: string[];
  objectionsRaised: string[];
  lastLeadIntent: string | null;
  leadEngagement: number;
  turnCount: number;
}

export interface AgentResponse {
  text: string;
  nextState: ConversationState;
  shouldClose: boolean;
  reason?: string;
}

export interface KnowledgeBaseMap {
  [key: string]: {
    key: string;
    category: string;
    enContent: string;
    hiContent: string;
    hinglishContent: string;
  };
}

export interface CallSummary {
  interestLevel: 'HOT' | 'WARM' | 'COLD';
  interestScore: number;
  reasoning: string;
  nextAction: string;
  handoffContext?: Record<string, any>;
}
