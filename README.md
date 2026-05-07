# RupeeSpeak — AI Voice Agent for Partner Lead Conversion

Browser-based AI voice agent for Rupeezy's Authorized Person (AP) partner program. Pitches in the lead's language (Hindi / English / Hinglish + regional bonus languages), handles the 5 core objections **contextually with real Azure GPT-4.1**, scores leads as Hot / Warm / Cold, and hands qualified leads off to human RMs with AI-generated conversation context.

> **PanIIT AI for Bharat Hackathon** — Theme 7: AI Voice Agent for Partner Lead Conversion · Sponsor: **Rupeezy**

## 🎥 Demo Video

[![RupeeSpeak — 5-min walkthrough](demo/video/poster.jpg)](demo/video/demo.mp4)

> Voiceover by ElevenLabs (Roger, male). Pipeline reproducible — see `demo/video/`.

---

## What's inside (winning features)

1. **Real GPT-4.1 conversation engine** — every turn goes through `lib/llm-conversation.ts` with the Appendix-A knowledge base as grounded context. The model reads the lead's last message, picks a KB rebuttal if it's an objection, **rephrases conversationally instead of pasting verbatim**, and tracks topics + objections itself. Verified live: lead said *"Haan bolo, kya hai? Main already kisi broker ke saath hoon"* → agent replied (in real Hinglish): *"Bilkul samajh sakta hoon, Rohit ji. Lekin aapko pata hai, traditional brokers aapke earnings ka 50-60% cut le lete hain, jabki Rupeezy mein aapko 100% brokerage milta hai…"*

2. **Multilingual + code-mix native** — Hindi (देवनागरी), English, Hinglish (Roman code-mix), plus Tamil / Telugu / Marathi / Gujarati / Bengali. The agent **detects language switches mid-call** and adapts on the next turn. Hinglish prompt is explicit: *"Sir aap already kisi broker ke saath hain, that's great — but kya woh aapko 100% brokerage de raha hai?"*

3. **5-objection contextual handling** — explicit mapping in the system prompt: *already_with_broker / not_enough_contacts / support / trust / think_later*. KB rebuttals are reference material; the LLM grounds in them but rephrases naturally. Numbers (zero joining fee, 100% brokerage, daily payouts) are explicitly locked.

4. **AI post-call summary + RM handoff note** — when the call ends, GPT-4.1 generates two artefacts: a 2-3 sentence call recap AND a 3-5 bullet RM handoff note (*"what objections were raised, how the agent rebutted, what to lead with"*). The interest level (HOT/WARM/COLD) is **locked by the rule-based scorer** — the LLM only narrates.

5. **AI funnel briefing on dashboard** — 3-sentence operations brief grounded on live counts: total leads, contacted, hot queue size, language mix, today's focus. Verified output: *"We've scaled to 10 leads, with 7 contacted and 3 qualified, but no conversions yet. Hot-leads queue is 3, mostly in Hinglish. Today, focus on RM follow-up for hot leads."*

6. **Bounded LLM by construction** — verdict (HOT/WARM/COLD) owned by `lib/scoring.ts`, not the LLM. KB facts (zero fee, 100% share, daily payouts) explicitly locked. SHA-256 disk cache means replays are free. Mock fallback (`lib/ai.ts`) kicks in if Azure unavailable — demo never crashes.

---

## How AI is used (and how it's bounded)

| Use case | Where | Grounded on | Failure mode |
|---|---|---|---|
| Per-turn agent reply | `lib/llm-conversation.ts → generateAgentTurn`, called from `/api/calls/[id]/turn` | Appendix-A KB + last 12 turns + state | Falls back to mock keyword classifier in `lib/ai.ts` |
| Post-call summary + RM handoff | `lib/llm-conversation.ts → generatePostCallSummary`, called from `/api/calls/[id]/end` | Locked interest level + transcript | Falls back to deterministic scorer reasoning |
| Funnel briefing | `lib/llm-conversation.ts → generateFunnelBriefing`, called from `/api/dashboard/funnel` | Live DB aggregates only | Falls back to deterministic count summary |
| Lead qualification (Hot/Warm/Cold) | `lib/scoring.ts → scoreCall` | Engagement + topics + objections + intents | (Always deterministic; LLM cannot override) |
| Knowledge base | `lib/kb.ts` + `prisma/schema.prisma` | Appendix-A script ingested at seed | (Always deterministic) |

**Key principle:** the LLM never changes a verdict, never invents the locked numbers (zero fee / 100% share / daily payouts), and falls back to deterministic templates if Azure is unavailable.

---

## Quick start

```bash
git clone https://github.com/sridhar7601/rupeezy-voice-agent.git
cd rupeezy-voice-agent
cp .env.example .env.local              # add Azure GPT-4.1 keys (or skip for mock-only mode)
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```env
DATABASE_URL="file:./dev.db"
USE_MOCK_AI="true"                        # mock keyword fallback. LLM is independent.
AZURE_OPENAI_API_KEY=...                  # required for real GPT-4.1 conversation
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/openai/deployments/<model>/chat/completions?api-version=2025-01-01-preview
```

LLM responses are SHA-256-cached on disk under `data/llm-cache/`. Replays are free + instant.

---

## Demo flow (5 minutes)

1. **Dashboard** — open http://localhost:3000. Top card is the live AI funnel briefing.
2. **Leads** — click `Call Now` on a Hindi or Hinglish lead.
3. **Voice / chat interface** — type or speak: *"Main already kisi broker ke saath hoon"* → agent replies in Hinglish, references your exact words, rebuts conversationally.
4. **Switch language mid-call** — say something in English; agent adapts on next turn.
5. **End call** — see locked HOT/WARM/COLD verdict + AI summary + RM handoff note.
6. **RM view** — open the call detail; the RM picks up not a name+number but a structured handoff with what was discussed, which objections, and what to lead with.

---

## Architecture

```
Next.js 16 App Router + TypeScript
  ├── app/
  │   ├── page.tsx                       ← dashboard with AI funnel briefing
  │   ├── leads/                         ← lead list + bulk upload
  │   ├── call/[id]/                     ← live voice/chat interface
  │   ├── calls/[id]/                    ← post-call detail with summary + handoff
  │   └── api/
  │       ├── calls/[id]/turn/           ← REAL GPT-4.1 turn generation
  │       ├── calls/[id]/end/            ← deterministic scorer + AI summary
  │       └── dashboard/funnel/          ← AI funnel briefing
  ├── components/                          ← shadcn/ui + Tremor
  └── lib/
      ├── ai.ts                            ← mock keyword classifier (fallback)
      ├── llm-conversation.ts              ← Azure GPT-4.1 (cached) — 3 functions
      ├── scoring.ts                       ← deterministic Hot/Warm/Cold scorer
      ├── kb.ts                            ← Appendix-A knowledge base loader
      └── db.ts                            ← Prisma singleton
```

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma + SQLite** (PostgreSQL-portable)
- **Tailwind v3 + shadcn/ui + Tremor**
- **Web Speech API** for browser STT / TTS (kn-IN, hi-IN, en-IN supported)
- **Azure OpenAI GPT-4.1** for conversation engine (OpenAI-compatible; production swap is one URL change)

---

## Multi-turn memory & language switching

- **Per-call state**: `topicsCovered`, `objectionsRaised`, `interestScore`, `language` persist on the `Call` row and roll forward on every turn.
- **Cross-call memory**: `Lead` model carries status (`NEW / CONTACTED / QUALIFIED / HANDED_OFF / DO_NOT_CALL`) so a follow-up call sees prior context.
- **Language detection**: the LLM returns `detectedLanguage` on each turn. If the lead switches (English → Hindi mid-call), the next turn flips automatically. The detected language is also persisted to the `Call` row.
- **Code-mix handling**: explicit Hinglish instruction in the system prompt with a verbatim example so the model doesn't fall back to formal Hindi or English.

---

## Risks & mitigation

| Risk | Mitigation |
|---|---|
| LLM hallucinates a verdict | Verdict locked by `lib/scoring.ts`; LLM only narrates |
| LLM invents a number | Numbers (zero fee, 100% share, daily payouts) explicitly locked in system prompt |
| LLM ignores language preference | System prompt has per-language rule + verbatim Hinglish example |
| LLM unavailable mid-demo | Mock keyword classifier in `lib/ai.ts` runs as fallback |
| API cost runaway | SHA-256 disk cache + capped to one LLM call per turn |
| Real STT/TTS poor on Indic | Web Speech API today; Round-2 adds Bhashini / Sarvam ASR |
| RM gets a thin handoff | AI generates structured handoff note: objections raised, how rebutted, what to lead with |

---

## Round-2 roadmap (with Rupeezy)

**Phase 1 — Real telephony (3 weeks)**
- Twilio / Exotel / Plivo for inbound + outbound calls
- Real-time STT (Sarvam / Bhashini) for Indian languages with code-mix
- TTS (ElevenLabs / Sarvam) for natural voice in Hindi + Hinglish

**Phase 2 — Stronger conversation (3 weeks)**
- Indic-tuned LLM (Sarvam-1) for code-mix correctness
- RAG over the full Rupeezy product catalogue + FAQ + RISE Portal docs
- Voice activity detection + barge-in handling

**Phase 3 — RM workflow (4 weeks)**
- Live warm-transfer with conversation summary in CRM
- WhatsApp signup link auto-send on Warm leads
- Cross-call lead memory: prior calls' transcripts + objections inform next pitch

**Phase 4 — Production (4 weeks)**
- PostgreSQL + Redis + queue
- On-prem Llama-3 / Sarvam-1 swap (same OpenAI-compatible API)
- RBAC: ops manager / RM / partner lead

### Cost estimate

- **Sandbox / pilot:** ~₹50,000 / month (Azure GPT-4.1 metered + small VM)
- **Production at 50K calls/month:** ~₹4 L / month (on-prem GPU + Sarvam ASR + Twilio + Postgres)

### Why this lifts conversion from 18% → 40%+

| Failure mode (today) | Fix |
|---|---|
| 5-min response window missed | Agent answers within seconds, 24×7 |
| English-only RMs vs Hindi leads | LLM responds in same language as lead |
| 1 RM handles 1 call | Agent handles unbounded parallel calls |
| RM gets only name + number | RM gets full transcript + AI handoff note |
| Static script feels robotic | LLM rephrases KB rebuttals using lead's own words |

---

## Verification

```bash
npm install
npx tsc --noEmit
npm run build
npm run seed
npm run dev
```

## Licence

MIT — synthetic data only; no real PII. Sample lead names are faker-generated.
