import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { KNOWLEDGE_BASE_SEED } from '../lib/kb';
import type { Language, LeadStatus, CallOutcome, InterestLevel } from '../lib/prisma-types';

const prisma = new PrismaClient();

faker.seed(42);

const LEAD_DATA = [
  { name: 'Rajesh Kumar', phone: '+91-9876543210', language: 'HINDI' as Language, source: 'referral' },
  { name: 'Priya Sharma', phone: '+91-9876543211', language: 'ENGLISH' as Language, source: 'social' },
  { name: 'Amit Patel', phone: '+91-9876543212', language: 'HINGLISH' as Language, source: 'web' },
  { name: 'Sunita Reddy', phone: '+91-9876543213', language: 'HINDI' as Language, source: 'referral' },
  { name: 'Vikram Singh', phone: '+91-9876543214', language: 'ENGLISH' as Language, source: 'web' },
  { name: 'Meera Gupta', phone: '+91-9876543215', language: 'HINGLISH' as Language, source: 'social' },
  { name: 'Arjun Rao', phone: '+91-9876543216', language: 'TAMIL' as Language, source: 'referral' },
  { name: 'Kavita Iyer', phone: '+91-9876543217', language: 'HINDI' as Language, source: 'web' },
  { name: 'Rohit Desai', phone: '+91-9876543218', language: 'ENGLISH' as Language, source: 'social' },
  { name: 'Anjali Nair', phone: '+91-9876543219', language: 'HINGLISH' as Language, source: 'referral' },
];

const SAMPLE_CONVERSATIONS = [
  {
    leadIndex: 0,
    language: 'HINDI' as Language,
    outcome: 'COMPLETED' as CallOutcome,
    interestLevel: 'HOT' as InterestLevel,
    durationSec: 420,
    turns: [
      { role: 'agent', text: 'Namaste! Main Rupeezy se bol raha hoon. Hum logon ko Authorized Person banane mein madad karte hain aur ve doosron ko instant personal loan dilwa kar commission kama sakte hain. Kya aapke paas 2 minute hain is opportunity ke baare mein sunne ke liye?', intent: null },
      { role: 'lead', text: 'Haan, main sun sakta hoon. Isme kya hota hai?', intent: 'positive_acknowledgement' },
      { role: 'agent', text: 'Joining fee bilkul nahi hai. Aap pehle din se hi bina koi investment kiye earning shuru kar sakte hain. Jab aap kamayenge tabhi hum kamayenge.', intent: null },
      { role: 'lead', text: 'Lekin main pehle se ek doosre broker ke saath hoon. Woh bhi commission dete hain.', intent: 'already_with_broker' },
      { role: 'agent', text: 'Main samajhta hoon. Lekin traditional brokers ke comparison mein, Rupeezy aapko 100% brokerage deta hai. Zyaadatar brokers 50-60% kaat lete hain. Plus humari daily payout ka matlab hai aapko turant paisa milta hai, 30-45 din baad nahi.', intent: null },
      { role: 'lead', text: 'Achha, ye toh achha hai. Aur kitna paisa kama sakte hain?', intent: 'ask_for_details' },
      { role: 'agent', text: 'Aapki kamai daily aapke bank account mein aati hai. Monthly settlement ya clearing cycle ka intezaar nahi karna padta. Aaj kamaaya, aaj paisa mila.', intent: null },
      { role: 'lead', text: 'Theek hai, main ready hoon. Mujhe kya karna hoga?', intent: 'ready_to_sign_up' },
      { role: 'agent', text: 'Bahut badhiya! Main bahut excited hoon ki aap Rupeezy family join kar rahe hain. Main aapko humari Relationship Manager Priya se connect karta hoon. Wo aapko quick registration process guide karengi aur aapke saare questions ka jawab dengi. Wo aapko agle 5 minute mein call karengi.', intent: null },
    ],
  },
  {
    leadIndex: 1,
    language: 'ENGLISH' as Language,
    outcome: 'COMPLETED' as CallOutcome,
    interestLevel: 'HOT' as InterestLevel,
    durationSec: 360,
    turns: [
      { role: 'agent', text: 'Hello! I\'m calling from Rupeezy. We help people become Authorized Persons and earn commission by helping others with instant personal loans. Do you have 2 minutes to hear about this opportunity?', intent: null },
      { role: 'lead', text: 'Yes, sure. Tell me more.', intent: 'positive_acknowledgement' },
      { role: 'agent', text: 'There\'s absolutely no joining fee. You can start earning from day one without any upfront investment. We only succeed when you succeed.', intent: null },
      { role: 'lead', text: 'That sounds good. What kind of support do you provide?', intent: 'ask_for_details' },
      { role: 'agent', text: 'We provide comprehensive support and training. Our team helps you onboard your first 10 customers. We have video tutorials, live sessions, and a dedicated support line available 24/7.', intent: null },
      { role: 'lead', text: 'Great. And how much commission do I get?', intent: 'ask_for_details' },
      { role: 'agent', text: 'You keep 100% of the brokerage you earn. Unlike traditional brokers who take 50-60% cuts, at Rupeezy, every rupee of commission is yours. Plus, you get incentives on top.', intent: null },
      { role: 'lead', text: 'Perfect! I\'m interested. What are the next steps?', intent: 'ready_to_sign_up' },
      { role: 'agent', text: 'Excellent! I\'m really excited to have you join the Rupeezy family. Let me connect you with our Relationship Manager, Priya. She\'ll guide you through the quick registration process and answer any questions you have. She\'ll call you in the next 5 minutes.', intent: null },
    ],
  },
  {
    leadIndex: 2,
    language: 'HINGLISH' as Language,
    outcome: 'COMPLETED' as CallOutcome,
    interestLevel: 'WARM' as InterestLevel,
    durationSec: 300,
    turns: [
      { role: 'agent', text: 'Hello! Main Rupeezy se call kar raha hoon. Hum aapko Authorized Person banne mein help karte hain aur aap instant personal loans provide karke commission earn kar sakte ho. Kya aap 2 minutes sun sakte ho?', intent: null },
      { role: 'lead', text: 'Haan, but main already busy hoon. Kitna time lagega?', intent: 'time_commitment' },
      { role: 'agent', text: 'Aap apne spare time mein ye kar sakte hain. Humare bahut se Authorized Persons full-time job karte hain aur weekends ya shaam ko ye karte hain. Poori process digital hai - customer apne phone par form bharta hai, documents automatically upload hote hain, aur approval minutes mein ho jaati hai.', intent: null },
      { role: 'lead', text: 'Okay, ye toh achha hai. But mere paas zyada contacts nahi hain.', intent: 'not_enough_contacts' },
      { role: 'agent', text: 'Not a problem. Top earners ne 5-10 contacts se start kiya. First customers refer others - each happy customer 2-3 leads laata hai. Plus marketing materials aur social media templates provide karte hain reach badhane ke liye.', intent: null },
      { role: 'lead', text: 'Hmm, sochna padega. Information bhej do WhatsApp par.', intent: 'think_later' },
      { role: 'agent', text: 'No problem. Detailed WhatsApp message bhej raha hoon with all info - benefits, how it works, earnings calculator, testimonials. Review kar lena. Questions ho to reply karna, team help karegi. Ready ho to registration link message mein hai. Good?', intent: null },
    ],
  },
  {
    leadIndex: 3,
    language: 'HINDI' as Language,
    outcome: 'COMPLETED' as CallOutcome,
    interestLevel: 'HOT' as InterestLevel,
    durationSec: 390,
    turns: [
      { role: 'agent', text: 'Namaste! Main Rupeezy se bol raha hoon. Hum logon ko Authorized Person banane mein madad karte hain aur ve doosron ko instant personal loan dilwa kar commission kama sakte hain. Kya aapke paas 2 minute hain is opportunity ke baare mein sunne ke liye?', intent: null },
      { role: 'lead', text: 'Haan theek hai. Par ye genuine hai na? Koi scam toh nahi?', intent: 'trust_question' },
      { role: 'agent', text: 'Bahut achha sawal. Rupeezy ek RBI-regulated NBFC hai aur hum sabhi major banks ke saath kaam karte hain. Humare India bhar mein 50,000+ active Authorized Persons hain. Aap humari app ki rating dekh sakte hain - 4.5 stars with 2 lakh+ reviews.', intent: null },
      { role: 'lead', text: 'Achha, ye toh achhi baat hai. Aur joining fee kitni hai?', intent: 'ask_for_details' },
      { role: 'agent', text: 'Joining fee bilkul nahi hai. Aap pehle din se hi bina koi investment kiye earning shuru kar sakte hain. Jab aap kamayenge tabhi hum kamayenge.', intent: null },
      { role: 'lead', text: 'Perfect! Main interested hoon. Kab shuru kar sakta hoon?', intent: 'ready_to_sign_up' },
      { role: 'agent', text: 'Bahut badhiya! Main bahut excited hoon ki aap Rupeezy family join kar rahe hain. Main aapko humari Relationship Manager Priya se connect karta hoon. Wo aapko quick registration process guide karengi.', intent: null },
    ],
  },
  {
    leadIndex: 5,
    language: 'HINGLISH' as Language,
    outcome: 'COMPLETED' as CallOutcome,
    interestLevel: 'WARM' as InterestLevel,
    durationSec: 240,
    turns: [
      { role: 'agent', text: 'Hello! Main Rupeezy se call kar raha hoon. Hum aapko Authorized Person banne mein help karte hain. Kya aap 2 minutes sun sakte ho?', intent: null },
      { role: 'lead', text: 'Yes, go ahead.', intent: 'positive_acknowledgement' },
      { role: 'agent', text: 'Joining fee bilkul zero hai. Aap day one se earning start kar sakte ho without any investment.', intent: null },
      { role: 'lead', text: 'Okay, but I need to think about it. Bahut commitments hain already.', intent: 'think_later' },
      { role: 'agent', text: 'Totally understand. Important decision hai. How about this - WhatsApp par short video bhejta hoon with explanation aur success stories. Time mile tab dekh lena, interested ho to link se direct register kar sakte ho.', intent: null },
    ],
  },
  {
    leadIndex: 7,
    language: 'HINDI' as Language,
    outcome: 'DECLINED' as CallOutcome,
    interestLevel: 'COLD' as InterestLevel,
    durationSec: 120,
    turns: [
      { role: 'agent', text: 'Namaste! Main Rupeezy se bol raha hoon. Hum logon ko Authorized Person banane mein madad karte hain.', intent: null },
      { role: 'lead', text: 'Nahi, mujhe interest nahi hai. Main busy hoon.', intent: 'not_interested' },
      { role: 'agent', text: 'Main samajhta hoon, ye abhi aapke liye sahi time nahi hai. Aapke time ke liye dhanyavaad aur aapka din shubh ho!', intent: null },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('🗑️  Clearing existing data...');
  await prisma.turn.deleteMany();
  await prisma.call.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  console.log('✅ Cleared existing data\n');

  console.log('📚 Seeding knowledge base...');
  for (const entry of KNOWLEDGE_BASE_SEED) {
    await prisma.knowledgeBase.create({ data: entry });
  }
  console.log(`✅ Created ${KNOWLEDGE_BASE_SEED.length} knowledge base entries\n`);

  console.log('👥 Seeding leads...');
  const leads = [];
  for (const leadData of LEAD_DATA) {
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        status: 'NEW' as LeadStatus,
      },
    });
    leads.push(lead);
  }
  console.log(`✅ Created ${leads.length} leads\n`);

  console.log('📞 Seeding sample calls...');
  for (const convo of SAMPLE_CONVERSATIONS) {
    const lead = leads[convo.leadIndex];
    
    const topicsCovered: string[] = [];
    const objectionsRaised: string[] = [];

    for (const turn of convo.turns) {
      if (turn.intent === 'already_with_broker' && !objectionsRaised.includes('already_with_broker')) {
        objectionsRaised.push('already_with_broker');
        topicsCovered.push('brokerage_share');
        topicsCovered.push('daily_payouts');
      }
      if (turn.intent === 'not_enough_contacts' && !objectionsRaised.includes('not_enough_contacts')) {
        objectionsRaised.push('not_enough_contacts');
      }
      if (turn.intent === 'trust_question' && !objectionsRaised.includes('trust_concern')) {
        objectionsRaised.push('trust_concern');
      }
      if (turn.intent === 'time_commitment' && !objectionsRaised.includes('time_commitment')) {
        objectionsRaised.push('time_commitment');
      }
      if (turn.role === 'agent' && turn.text.includes('joining fee')) {
        if (!topicsCovered.includes('zero_joining_fee')) topicsCovered.push('zero_joining_fee');
      }
      if (turn.role === 'agent' && turn.text.includes('100%')) {
        if (!topicsCovered.includes('brokerage_share')) topicsCovered.push('brokerage_share');
      }
      if (turn.role === 'agent' && turn.text.includes('daily')) {
        if (!topicsCovered.includes('daily_payouts')) topicsCovered.push('daily_payouts');
      }
      if (turn.role === 'agent' && turn.text.includes('support')) {
        if (!topicsCovered.includes('support_training')) topicsCovered.push('support_training');
      }
    }

    const call = await prisma.call.create({
      data: {
        leadId: lead.id,
        language: convo.language,
        startedAt: faker.date.recent({ days: 7 }),
        endedAt: faker.date.recent({ days: 7 }),
        durationSec: convo.durationSec,
        outcome: convo.outcome,
        interestLevel: convo.interestLevel,
        interestScore: convo.interestLevel === 'HOT' ? 0.85 : convo.interestLevel === 'WARM' ? 0.6 : 0.2,
        topicsCovered: JSON.stringify(topicsCovered),
        objectionsRaised: JSON.stringify(objectionsRaised),
        summary: convo.interestLevel === 'HOT' 
          ? `High engagement (85%), covered ${topicsCovered.length} key topics, clear intent to proceed.`
          : convo.interestLevel === 'WARM'
          ? `Moderate engagement (60%), needs more information or time to decide.`
          : 'Low engagement (20%), not a priority for immediate follow-up.',
        nextAction: convo.interestLevel === 'HOT' ? 'handoff_rm' : convo.interestLevel === 'WARM' ? 'whatsapp_followup' : 'log_cold',
        handoffContext: convo.interestLevel === 'HOT' 
          ? JSON.stringify({
              primaryInterest: topicsCovered[0] || 'earning_opportunity',
              concernsAddressed: objectionsRaised,
              preferredContact: 'phone',
              urgency: 'high',
              nextSteps: ['complete_registration', 'kyc_verification', 'training_session'],
            })
          : null,
      },
    });

    for (const turn of convo.turns) {
      await prisma.turn.create({
        data: {
          callId: call.id,
          role: turn.role,
          text: turn.text,
          intent: turn.intent,
          timestamp: faker.date.recent({ days: 1 }),
        },
      });
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: convo.interestLevel === 'HOT' ? 'QUALIFIED' : 'CONTACTED',
      },
    });
  }

  console.log(`✅ Created ${SAMPLE_CONVERSATIONS.length} sample calls with full conversation turns\n`);

  console.log('📊 Database Summary:');
  const kbCount = await prisma.knowledgeBase.count();
  const leadCount = await prisma.lead.count();
  const callCount = await prisma.call.count();
  const turnCount = await prisma.turn.count();

  console.log(`  • Knowledge Base: ${kbCount} entries`);
  console.log(`  • Leads: ${leadCount}`);
  console.log(`  • Calls: ${callCount}`);
  console.log(`  • Conversation Turns: ${turnCount}\n`);

  console.log('✅ Seed completed successfully!\n');
  console.log('🚀 Start the dev server:');
  console.log('   npm run dev\n');
  console.log('🌐 Open:');
  console.log('   http://localhost:3000\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
