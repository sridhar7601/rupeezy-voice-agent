import type { ConversationState, AgentResponse, KnowledgeBaseMap } from './types';
import { getContent } from './kb';

export async function respondToLead(
  leadText: string,
  state: ConversationState,
  kb: KnowledgeBaseMap
): Promise<AgentResponse> {
  if (process.env.USE_MOCK_AI !== 'false') {
    return mockRespond(leadText, state, kb);
  }
  throw new Error('Real AI not wired - set USE_MOCK_AI=true');
}

function mockRespond(
  leadText: string,
  state: ConversationState,
  kb: KnowledgeBaseMap
): AgentResponse {
  const text = leadText.toLowerCase();
  const nextState = { ...state, turnCount: state.turnCount + 1 };
  
  const intent = classifyIntent(text);
  nextState.lastLeadIntent = intent;
  
  if (intent === 'greeting' || intent === 'positive_acknowledgement') {
    nextState.leadEngagement = Math.min(1, state.leadEngagement + 0.15);
    
    if (state.turnCount === 0) {
      return {
        text: getContent(kb, 'opening_intro', state.language),
        nextState,
        shouldClose: false,
      };
    }
    
    if (!state.topicsCovered.includes('zero_joining_fee')) {
      nextState.topicsCovered.push('zero_joining_fee');
      return {
        text: getContent(kb, 'zero_joining_fee', state.language),
        nextState,
        shouldClose: false,
      };
    }
    
    if (!state.topicsCovered.includes('brokerage_share')) {
      nextState.topicsCovered.push('brokerage_share');
      return {
        text: getContent(kb, 'brokerage_share', state.language),
        nextState,
        shouldClose: false,
      };
    }
    
    if (!state.topicsCovered.includes('daily_payouts')) {
      nextState.topicsCovered.push('daily_payouts');
      return {
        text: getContent(kb, 'daily_payouts', state.language),
        nextState,
        shouldClose: false,
      };
    }
  }
  
  if (intent === 'already_with_broker') {
    nextState.objectionsRaised.push('already_with_broker');
    nextState.leadEngagement = Math.max(0, state.leadEngagement - 0.05);
    nextState.topicsCovered.push('brokerage_share');
    nextState.topicsCovered.push('daily_payouts');
    return {
      text: getContent(kb, 'objection_already_with_broker', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (intent === 'not_enough_contacts') {
    nextState.objectionsRaised.push('not_enough_contacts');
    nextState.leadEngagement = Math.max(0, state.leadEngagement - 0.05);
    return {
      text: getContent(kb, 'objection_not_enough_contacts', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (intent === 'trust_question') {
    nextState.objectionsRaised.push('trust_concern');
    return {
      text: getContent(kb, 'objection_trust_concern', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (intent === 'time_commitment') {
    nextState.objectionsRaised.push('time_commitment');
    return {
      text: getContent(kb, 'objection_time_commitment', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (intent === 'ready_to_sign_up' || intent === 'ask_for_details') {
    nextState.leadEngagement = Math.min(1, state.leadEngagement + 0.25);
    
    if (nextState.leadEngagement >= 0.7 && nextState.topicsCovered.length >= 3) {
      return {
        text: getContent(kb, 'closing_hot_handoff', state.language),
        nextState,
        shouldClose: true,
        reason: 'hot_lead_ready_for_handoff',
      };
    }
    
    if (!state.topicsCovered.includes('rise_portal')) {
      nextState.topicsCovered.push('rise_portal');
      return {
        text: getContent(kb, 'rise_portal', state.language),
        nextState,
        shouldClose: false,
      };
    }
  }
  
  if (intent === 'think_later') {
    nextState.leadEngagement = Math.max(0, state.leadEngagement - 0.1);
    
    if (state.leadEngagement < 0.4) {
      return {
        text: getContent(kb, 'closing_warm_whatsapp', state.language),
        nextState,
        shouldClose: true,
        reason: 'needs_time_to_think',
      };
    }
    
    return {
      text: getContent(kb, 'objection_think_later', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (intent === 'not_interested') {
    nextState.leadEngagement = 0;
    return {
      text: getContent(kb, 'closing_cold_callback', state.language),
      nextState,
      shouldClose: true,
      reason: 'explicit_disinterest',
    };
  }
  
  if (state.turnCount >= 10 && state.leadEngagement >= 0.5) {
    return {
      text: getContent(kb, 'closing_hot_handoff', state.language),
      nextState,
      shouldClose: true,
      reason: 'long_engaged_conversation',
    };
  }
  
  if (state.turnCount >= 8 && state.leadEngagement < 0.5) {
    return {
      text: getContent(kb, 'closing_warm_whatsapp', state.language),
      nextState,
      shouldClose: true,
      reason: 'conversation_fatigue',
    };
  }
  
  if (!state.topicsCovered.includes('support_training')) {
    nextState.topicsCovered.push('support_training');
    nextState.leadEngagement = Math.min(1, state.leadEngagement + 0.05);
    return {
      text: getContent(kb, 'support_training', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  if (!state.topicsCovered.includes('eligibility_basic')) {
    nextState.topicsCovered.push('eligibility_basic');
    return {
      text: getContent(kb, 'eligibility_basic', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  nextState.leadEngagement = Math.min(1, state.leadEngagement + 0.05);
  const fallbackResponses = [
    'That\'s a great question. Let me tell you more...',
    'I understand your concern. Here\'s what makes us different...',
    'Good point. Many of our successful partners had the same question initially...',
  ];
  const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  
  if (!state.topicsCovered.includes('rise_portal')) {
    nextState.topicsCovered.push('rise_portal');
    return {
      text: fallback + ' ' + getContent(kb, 'rise_portal', state.language),
      nextState,
      shouldClose: false,
    };
  }
  
  return {
    text: fallback + ' ' + getContent(kb, 'brokerage_share', state.language),
    nextState,
    shouldClose: false,
  };
}

function classifyIntent(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (/(hello|hi|namaste|haan|yes|sure|ok|okay|theek|thik|accha)/i.test(lowerText)) {
    if (/ready|sign|join|start|interested|kar|loon|lena|chahta|chahti/i.test(lowerText)) {
      return 'ready_to_sign_up';
    }
    return 'positive_acknowledgement';
  }
  
  if (/(already|pehle se|doosre|other|another|broker|agent)/i.test(lowerText)) {
    return 'already_with_broker';
  }
  
  if (/(not enough|kam|few|thode|contacts|network|logon ko|people)/i.test(lowerText)) {
    return 'not_enough_contacts';
  }
  
  if (/(trust|bharosa|genuine|real|scam|fraud|legit|safe|secure)/i.test(lowerText)) {
    return 'trust_question';
  }
  
  if (/(time|samay|busy|vyast|kaam|work|full.?time)/i.test(lowerText)) {
    return 'time_commitment';
  }
  
  if (/(think|sochna|later|baad|decide|faisla|consider|vichar)/i.test(lowerText)) {
    return 'think_later';
  }
  
  if (/(not interested|nahi|no|refuse|mana|decline)/i.test(lowerText)) {
    return 'not_interested';
  }
  
  if (/(how|kaise|kya|what|tell|batao|detail|explain|samjhao)/i.test(lowerText)) {
    return 'ask_for_details';
  }
  
  return 'general_query';
}
