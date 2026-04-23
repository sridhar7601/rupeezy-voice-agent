# RupeeSpeak — AI Voice Agent for Partner Lead Conversion

Browser-based AI voice agent that pitches in the lead's language, handles objections, and qualifies leads in real time.

> **PanIIT AI for Bharat Hackathon** — Theme 7: Voice-Based AI for Social Impact

RupeeSpeak is a browser-based AI voice agent for Rupeezy's partner lead conversion flow. It receives inbound leads, pitches the Authorized Person program in the lead's preferred language, handles the five most common objections conversationally, scores the lead as Hot, Warm, or Cold, and hands qualified leads off to human relationship managers with full conversation context.

## Quick Start

```bash
git clone https://github.com/sridhar7601/rupeezy-voice-agent.git
cd rupeezy-voice-agent
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Data

`npm run seed` populates the knowledge base, seeded multilingual leads, and sample calls that demonstrate objection handling, qualification, and RM handoff or follow-up outcomes.

## Architecture

Lead speech comes in through the browser, the mock conversation engine classifies intent and tracks state turn by turn, then the system selects the right response, scores interest, and hands the lead off with full context.

![Architecture](docs/diagrams/architecture.png)

## Tech Stack

- Next.js App Router + TypeScript
- Prisma + SQLite
- Tailwind CSS + shadcn/ui + Tremor charts
- Web Speech API for recognition and synthesis
- Mock-first conversation engine in `lib/ai.ts`
- lucide-react icons

## Demo Flow

1. Open the dashboard or leads list and click `Call Now` for a seeded lead such as Rajesh Kumar.
2. Use the voice interface to let the agent open the conversation and capture the lead's response through the microphone.
3. Raise a common objection like "already with another broker" and show the intent badge, topic coverage, and rebuttal flow.
4. Continue the conversation until the lead is scored and the call ends.
5. Open the call detail page to review the transcript, reasoning, interest verdict, and RM handoff context.

## Key Features

- Multilingual voice conversations using browser speech input and output.
- Objection handling for the core partner-conversion scenarios documented by Rupeezy.
- Stateful conversation tracking across intents, covered topics, and objections raised.
- Hot/Warm/Cold lead scoring with reasoning and next-step suggestions.
- Knowledge-base-driven responses that business teams can update without changing the flow.

## Documentation

[docs/solution-document.md](docs/solution-document.md) · [PDF](docs/solution-document.pdf)

## Verification

```bash
npm install
npm run build
npm run seed
npm run dev
```

## License

MIT
