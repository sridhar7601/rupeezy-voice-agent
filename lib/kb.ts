import type { Language } from './prisma-types';
import { db } from './db';
import type { KnowledgeBaseMap } from './types';

export async function getKnowledgeBase(): Promise<KnowledgeBaseMap> {
  const entries = await db.knowledgeBase.findMany();
  const map: KnowledgeBaseMap = {};
  
  for (const entry of entries) {
    map[entry.key] = {
      key: entry.key,
      category: entry.category,
      enContent: entry.enContent,
      hiContent: entry.hiContent,
      hinglishContent: entry.hinglishContent,
    };
  }
  
  return map;
}

export function getContent(kb: KnowledgeBaseMap, key: string, language: Language): string {
  const entry = kb[key];
  if (!entry) return '';
  
  switch (language) {
    case 'HINDI':
      return entry.hiContent;
    case 'HINGLISH':
      return entry.hinglishContent;
    default:
      return entry.enContent;
  }
}

export function searchKnowledge(kb: KnowledgeBaseMap, category: string, language: Language): string[] {
  return Object.values(kb)
    .filter((entry) => entry.category === category)
    .map((entry) => getContent(kb, entry.key, language))
    .filter((content) => content.length > 0);
}

export const KNOWLEDGE_BASE_SEED = [
  {
    key: 'opening_intro',
    category: 'opening',
    enContent: 'Hello! I\'m calling from Rupeezy. We help people become Authorized Persons and earn commission by helping others with instant personal loans. Do you have 2 minutes to hear about this opportunity?',
    hiContent: 'Namaste! Main Rupeezy se bol raha hoon. Hum logon ko Authorized Person banane mein madad karte hain aur ve doosron ko instant personal loan dilwa kar commission kama sakte hain. Kya aapke paas 2 minute hain is opportunity ke baare mein sunne ke liye?',
    hinglishContent: 'Hello! Main Rupeezy se call kar raha hoon. Hum aapko Authorized Person banne mein help karte hain aur aap instant personal loans provide karke commission earn kar sakte ho. Kya aap 2 minutes sun sakte ho?',
  },
  {
    key: 'zero_joining_fee',
    category: 'benefit',
    enContent: 'There\'s absolutely no joining fee. You can start earning from day one without any upfront investment. We only succeed when you succeed.',
    hiContent: 'Joining fee bilkul nahi hai. Aap pehle din se hi bina koi investment kiye earning shuru kar sakte hain. Jab aap kamayenge tabhi hum kamayenge.',
    hinglishContent: 'Joining fee bilkul zero hai. Aap day one se earning start kar sakte ho without any investment. We succeed jab aap succeed karte ho.',
  },
  {
    key: 'brokerage_share',
    category: 'benefit',
    enContent: 'You keep 100% of the brokerage you earn. Unlike traditional brokers who take 50-60% cuts, at Rupeezy, every rupee of commission is yours. Plus, you get incentives on top.',
    hiContent: 'Aap jo brokerage kamate hain wo 100% aapka hota hai. Traditional brokers jo 50-60% kaat lete hain, Rupeezy mein har rupee ka commission aapka hai. Upar se incentives bhi milte hain.',
    hinglishContent: '100% brokerage aapka. Traditional brokers 50-60% cut lete hain, but Rupeezy mein har rupee aapka. Plus top-up incentives bhi.',
  },
  {
    key: 'daily_payouts',
    category: 'benefit',
    enContent: 'Your earnings are paid out daily, directly to your bank account. No waiting for monthly settlements or clearing cycles. You earn today, you get paid today.',
    hiContent: 'Aapki kamai daily aapke bank account mein aati hai. Monthly settlement ya clearing cycle ka intezaar nahi karna padta. Aaj kamaaya, aaj paisa mila.',
    hinglishContent: 'Daily payouts directly bank account mein. No monthly waiting. Earn today, paid today.',
  },
  {
    key: 'rise_portal',
    category: 'benefit',
    enContent: 'You get access to our RISE portal - a complete dashboard to manage leads, track applications, view earnings in real time, and access training materials. Everything in one place.',
    hiContent: 'Aapko humara RISE portal milta hai - ek complete dashboard jahan aap leads manage kar sakte hain, applications track kar sakte hain, real time mein earnings dekh sakte hain, aur training materials access kar sakte hain. Sab kuch ek jagah.',
    hinglishContent: 'RISE portal access - complete dashboard for lead management, application tracking, real-time earnings, training materials. All in one place.',
  },
  {
    key: 'support_training',
    category: 'benefit',
    enContent: 'We provide comprehensive support and training. Our team helps you onboard your first 10 customers. We have video tutorials, live sessions, and a dedicated support line available 24/7.',
    hiContent: 'Hum comprehensive support aur training dete hain. Humari team aapke pehle 10 customers ko onboard karne mein help karti hai. Video tutorials, live sessions, aur 24/7 dedicated support line available hai.',
    hinglishContent: 'Comprehensive support aur training. Team first 10 customers onboard karne mein help karegi. Video tutorials, live sessions, 24/7 support line.',
  },
  {
    key: 'eligibility_basic',
    category: 'eligibility',
    enContent: 'The basic requirements are: you should be 21+ years old, have a smartphone with internet, and know people who might need instant loans - like small business owners, salaried employees, or professionals.',
    hiContent: 'Basic requirements hain: aapki umar 21+ saal honi chahiye, aapke paas smartphone aur internet hona chahiye, aur aap aise logon ko jante hon jinhe instant loan ki zaroorat pad sakti hai - jaise chote business owner, salaried employees, ya professionals.',
    hinglishContent: 'Basic requirements: 21+ age, smartphone with internet, aur network of people jo instant loans need kar sakte hain - business owners, salaried people, professionals.',
  },
  {
    key: 'objection_already_with_broker',
    category: 'objection',
    enContent: 'I understand. But unlike traditional brokers, Rupeezy gives you 100% of your brokerage. Most brokers take 50-60% cuts. Plus, our daily payout means you get money immediately, not after 30-45 days. And there\'s no exclusivity - you can work with multiple platforms.',
    hiContent: 'Main samajhta hoon. Lekin traditional brokers ke comparison mein, Rupeezy aapko 100% brokerage deta hai. Zyaadatar brokers 50-60% kaat lete hain. Plus humari daily payout ka matlab hai aapko turant paisa milta hai, 30-45 din baad nahi. Aur koi exclusivity nahi hai - aap multiple platforms ke saath kaam kar sakte hain.',
    hinglishContent: 'I understand. But traditional brokers 50-60% cut lete hain, Rupeezy 100% brokerage deta hai. Daily payout means instant money, not 30-45 days later. No exclusivity - multiple platforms ke saath kaam kar sakte ho.',
  },
  {
    key: 'objection_not_enough_contacts',
    category: 'objection',
    enContent: 'That\'s actually not a problem at all. Most of our top earners started with just 5-10 contacts. Here\'s the thing - those first few customers refer others. Our data shows that each satisfied customer brings 2-3 more leads. Plus, we provide you marketing materials and social media templates to help you reach more people.',
    hiContent: 'Ye actually koi problem nahi hai. Humare zyaadatar top earners ne sirf 5-10 contacts se shuru kiya tha. Baat ye hai ki wo pehle kuch customers doosron ko refer karte hain. Humara data dikhata hai ki har satisfied customer 2-3 aur leads laata hai. Plus hum aapko marketing materials aur social media templates dete hain jinse aap aur logon tak pahunch sakte hain.',
    hinglishContent: 'Not a problem. Top earners ne 5-10 contacts se start kiya. First customers refer others - each happy customer 2-3 leads laata hai. Plus marketing materials aur social media templates provide karte hain reach badhane ke liye.',
  },
  {
    key: 'objection_trust_concern',
    category: 'objection',
    enContent: 'Great question. Rupeezy is an RBI-regulated NBFC and we work with all major banks. We have 50,000+ active Authorized Persons across India. You can check our app ratings - 4.5 stars with 2 lakh+ reviews. We\'re completely transparent - you can see the loan terms before you process any application.',
    hiContent: 'Bahut achha sawal. Rupeezy ek RBI-regulated NBFC hai aur hum sabhi major banks ke saath kaam karte hain. Humare India bhar mein 50,000+ active Authorized Persons hain. Aap humari app ki rating dekh sakte hain - 4.5 stars with 2 lakh+ reviews. Hum completely transparent hain - koi bhi application process karne se pehle aap loan terms dekh sakte hain.',
    hinglishContent: 'Good question. Rupeezy RBI-regulated NBFC hai, major banks ke saath partnership hai. 50,000+ active APs across India. App rating 4.5 stars, 2 lakh+ reviews. Completely transparent - loan terms application se pehle dikh jaate hain.',
  },
  {
    key: 'objection_time_commitment',
    category: 'objection',
    enContent: 'You can do this in your spare time. Many of our Authorized Persons work full-time jobs and do this on weekends or evenings. The entire process is digital - customer fills the form on their phone, documents upload automatically, and approval happens in minutes. You just need to share the link and guide them.',
    hiContent: 'Aap apne spare time mein ye kar sakte hain. Humare bahut se Authorized Persons full-time job karte hain aur weekends ya shaam ko ye karte hain. Poori process digital hai - customer apne phone par form bharta hai, documents automatically upload hote hain, aur approval minutes mein ho jaati hai. Aapko sirf link share karna hai aur unhe guide karna hai.',
    hinglishContent: 'Spare time mein kar sakte ho. Bahut se APs full-time job ke saath weekends/evenings mein karte hain. Complete digital process - customer form bhar ta hai phone par, documents auto-upload, approval in minutes. Just link share karo aur guide karo.',
  },
  {
    key: 'objection_think_later',
    category: 'objection',
    enContent: 'I completely understand. This is an important decision. How about this - I can send you a WhatsApp message with a short video that explains everything and some success stories from people in your city. You can watch it when you have time, and if you\'re interested, you can register directly from the link. No pressure. Does that work?',
    hiContent: 'Main poori tarah se samajhta hoon. Ye ek important decision hai. Ye kaise rahega - main aapko WhatsApp par ek chhota video bhej sakta hoon jo sab kuch explain karta hai aur aapke city ke logon ki kuch success stories hain. Aap jab time ho tab dekh sakte hain, aur agar interested hain to seedha link se register kar sakte hain. Koi pressure nahi. Ye theek rahega?',
    hinglishContent: 'Totally understand. Important decision hai. How about this - WhatsApp par short video bhejta hoon with explanation aur your city ke success stories. Time mile tab dekh lena, interested ho to link se direct register kar sakte ho. No pressure. Works?',
  },
  {
    key: 'closing_hot_handoff',
    category: 'closing',
    enContent: 'Excellent! I\'m really excited to have you join the Rupeezy family. Let me connect you with our Relationship Manager, Priya. She\'ll guide you through the quick registration process and answer any questions you have. She\'ll call you in the next 5 minutes. Looking forward to your success!',
    hiContent: 'Bahut badhiya! Main bahut excited hoon ki aap Rupeezy family join kar rahe hain. Main aapko humari Relationship Manager Priya se connect karta hoon. Wo aapko quick registration process guide karengi aur aapke saare questions ka jawab dengi. Wo aapko agle 5 minute mein call karengi. Aapki success ka intezaar hai!',
    hinglishContent: 'Excellent! Really excited ki aap Rupeezy family join kar rahe ho. Our RM Priya se connect kar raha hoon. Wo registration guide karegi aur questions answer karegi. Next 5 minutes mein call karegi. Looking forward to your success!',
  },
  {
    key: 'closing_warm_whatsapp',
    category: 'closing',
    enContent: 'No problem at all. I\'ll send you a detailed WhatsApp message with all the information - benefits, how it works, earnings calculator, and testimonials. Take your time to review it. If you have any questions, just reply to that message and our team will help you. When you\'re ready, there\'s a registration link in the message. Sound good?',
    hiContent: 'Koi problem nahi. Main aapko WhatsApp par detailed message bhejta hoon jismein saari information hogi - benefits, kaise kaam karta hai, earnings calculator, aur testimonials. Apna time lekar review kar lena. Agar koi question ho to us message par reply kar dena aur humari team aapki help karegi. Jab ready ho to message mein registration link hai. Theek hai?',
    hinglishContent: 'No problem. Detailed WhatsApp message bhej raha hoon with all info - benefits, how it works, earnings calculator, testimonials. Review kar lena. Questions ho to reply karna, team help karegi. Ready ho to registration link message mein hai. Good?',
  },
  {
    key: 'closing_cold_callback',
    category: 'closing',
    enContent: 'I understand, this might not be the right time for you. I\'ll make a note that you\'re not interested right now. If things change in the future and you want to know more, feel free to call us back on our toll-free number. Thank you for your time and have a great day!',
    hiContent: 'Main samajhta hoon, ye abhi aapke liye sahi time nahi hai. Main note kar leta hoon ki aap abhi interested nahi hain. Agar future mein situation change ho aur aap aur jaanna chahein to humari toll-free number par call kar lena. Aapke time ke liye dhanyavaad aur aapka din shubh ho!',
    hinglishContent: 'Understand, right time nahi hai abhi. Note kar raha hoon not interested. Future mein agar situation change ho aur know more karna ho to toll-free number par call kar lena. Thank you for your time, have a great day!',
  },
];
