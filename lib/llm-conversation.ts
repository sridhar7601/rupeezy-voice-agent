/**
 * Azure OpenAI GPT-4.1 conversation engine for RupeeSpeak.
 *
 * The mock keyword classifier in lib/ai.ts remains the deterministic fallback.
 * When Azure creds are present, every turn goes through GPT-4.1 with:
 *   - the Appendix-A knowledge base as grounded context
 *   - the running conversation history
 *   - explicit rules: never invent facts, never change scripted numbers
 *     (zero joining fee, 100% brokerage share, daily payouts), respond in
 *     the lead's language, handle objections by referencing the KB rebuttals.
 *
 * Production swap: replace base URL + auth → on-prem Llama-3.
 */

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ConversationState, AgentResponse, KnowledgeBaseMap, CallSummary } from "./types"
import type { Language } from "./prisma-types"
import { getContent } from "./kb"

const CACHE_DIR = join(process.cwd(), "data", "llm-cache")

function hashKey(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload, Object.keys(payload as object).sort()))
    .digest("hex")
    .slice(0, 16)
}

function readCache(key: string): string | null {
  const path = join(CACHE_DIR, `${key}.txt`)
  if (!existsSync(path)) return null
  try {
    return readFileSync(path, "utf8")
  } catch {
    return null
  }
}

function writeCache(key: string, text: string): void {
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(join(CACHE_DIR, `${key}.txt`), text)
}

export function hasLLM(): boolean {
  return !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT)
}

async function rawLLM(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 280,
  jsonMode = false,
): Promise<string> {
  const azureKey = process.env.AZURE_OPENAI_API_KEY!
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT!
  const body: Record<string, unknown> = {
    messages,
    max_tokens: maxTokens,
    temperature: 0.4,
  }
  if (jsonMode) body.response_format = { type: "json_object" }
  const res = await fetch(azureEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": azureKey },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Azure OpenAI HTTP ${res.status}`)
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return (json.choices?.[0]?.message?.content ?? "").trim()
}

const LANG_INSTRUCTION: Record<string, string> = {
  ENGLISH: "Respond in clear, friendly English.",
  HINDI:
    "Respond in conversational Hindi (देवनागरी script). Use natural spoken Hindi, not formal/literary Hindi.",
  HINGLISH:
    "Respond in Hinglish — Hindi-English code-mix as Indians actually speak (Roman script Hindi words mixed with English). Example: 'Sir aap already kisi broker ke saath hain, that's great — but kya woh aapko 100% brokerage de raha hai?'",
  TAMIL: "Respond in conversational Tamil (தமிழ் script).",
  TELUGU: "Respond in conversational Telugu (తెలుగు script).",
  MARATHI: "Respond in conversational Marathi (देवनागरी script).",
  GUJARATI: "Respond in conversational Gujarati (ગુજરાતી script).",
  BENGALI: "Respond in conversational Bengali (বাংলা script).",
}

function buildKbContext(kb: KnowledgeBaseMap, language: Language): string {
  const groups: Record<string, string[]> = {}
  for (const entry of Object.values(kb)) {
    if (!groups[entry.category]) groups[entry.category] = []
    const text = getContent(kb, entry.key, language)
    if (text) groups[entry.category].push(`- [${entry.key}] ${text}`)
  }
  return Object.entries(groups)
    .map(([cat, items]) => `## ${cat.toUpperCase()}\n${items.join("\n")}`)
    .join("\n\n")
}

interface AgentTurnInput {
  leadName: string
  leadText: string
  language: Language
  history: Array<{ role: "lead" | "agent"; text: string }>
  state: ConversationState
  kb: KnowledgeBaseMap
}

interface AgentTurnOutput {
  text: string
  detectedLanguage: Language
  intent: string
  topicsCovered: string[]
  objectionsRaised: string[]
  engagementDelta: number // -0.2..+0.2
  shouldClose: boolean
  closeReason?: string
}

export async function generateAgentTurn(
  input: AgentTurnInput,
): Promise<AgentTurnOutput | null> {
  if (!hasLLM()) return null

  const kbBlock = buildKbContext(input.kb, input.language)
  const langRule =
    LANG_INSTRUCTION[input.language] ??
    "Respond in the same language the lead just used. If unclear, use Hinglish."

  const system = `You are an AI sales agent for Rupeezy's Authorized Person (AP) partner program. Your job: warm, conversational pitch + objection handling, NOT a robotic script.

NON-NEGOTIABLE FACTS (never change these numbers):
- Zero joining fee
- 100% brokerage share (industry standard is 60-70%)
- Daily payouts via the RISE Portal
- Industry: stockbroker / financial services partner program

LANGUAGE: ${langRule} If the lead clearly switches language (e.g. they reply in Hindi when you opened in English), switch with them on your NEXT turn.

KNOWLEDGE BASE (ground all answers here):
${kbBlock}

CONVERSATION RULES:
1. First turn → use opening_intro from KB, adapt to lead's name (${input.leadName}).
2. After lead engages, work through benefits in order: zero_joining_fee → brokerage_share → daily_payouts. Don't dump them all at once.
3. When lead objects, MAP THEIR WORDS to the closest objection_* KB key:
   - "already with another broker" → objection_already_with_broker
   - "I don't have contacts / clients / network" → objection_not_enough_contacts
   - "what about support / who handles issues" → objection_support
   - "are you trustworthy / safe / SEBI-registered" → objection_trust
   - "I'll think about it / call me later / busy" → objection_think_later
   Use the KB rebuttal as a STARTING POINT but rephrase it conversationally — don't paste it verbatim. Reference what they actually said.
4. Keep replies SHORT — 1-3 sentences max. This is a phone call, not an email.
5. If turn count > 8 and they're still hot → ask for sign-up commitment.
6. If lead says "not interested" / "stop calling" twice → close politely.

ALREADY COVERED IN THIS CALL: ${input.state.topicsCovered.join(", ") || "(nothing yet)"}
OBJECTIONS ALREADY RAISED: ${input.state.objectionsRaised.join(", ") || "(none)"}
TURN COUNT: ${input.state.turnCount}

OUTPUT FORMAT — return JSON ONLY:
{
  "text": "your reply (1-3 sentences, in the chosen language)",
  "detectedLanguage": "ENGLISH|HINDI|HINGLISH|TAMIL|TELUGU|MARATHI|GUJARATI|BENGALI",
  "intent": "greeting|positive_acknowledgement|already_with_broker|not_enough_contacts|support_question|trust_question|think_later|ready_to_sign_up|not_interested|other",
  "newTopicsCovered": ["zero_joining_fee", ...],
  "newObjectionsRaised": ["already_with_broker", ...],
  "engagementDelta": 0.1,
  "shouldClose": false,
  "closeReason": "optional — only when shouldClose=true"
}`

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: system },
  ]
  for (const h of input.history.slice(-12)) {
    messages.push({
      role: h.role === "agent" ? "assistant" : "user",
      content: h.text,
    })
  }
  messages.push({ role: "user", content: input.leadText })

  const cacheKey = `turn_${hashKey({ messages, lang: input.language })}`
  const cached = readCache(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as AgentTurnOutput
    } catch {
      // fall through
    }
  }

  try {
    const out = await rawLLM(messages, 360, true)
    if (!out) return null
    const parsed = JSON.parse(out) as {
      text: string
      detectedLanguage: string
      intent: string
      newTopicsCovered?: string[]
      newObjectionsRaised?: string[]
      engagementDelta?: number
      shouldClose?: boolean
      closeReason?: string
    }
    const result: AgentTurnOutput = {
      text: parsed.text,
      detectedLanguage: (parsed.detectedLanguage as Language) ?? input.language,
      intent: parsed.intent ?? "other",
      topicsCovered: Array.from(
        new Set([...input.state.topicsCovered, ...(parsed.newTopicsCovered ?? [])]),
      ),
      objectionsRaised: Array.from(
        new Set([...input.state.objectionsRaised, ...(parsed.newObjectionsRaised ?? [])]),
      ),
      engagementDelta: Math.max(-0.3, Math.min(0.3, Number(parsed.engagementDelta) || 0)),
      shouldClose: !!parsed.shouldClose,
      closeReason: parsed.closeReason,
    }
    writeCache(cacheKey, JSON.stringify(result))
    return result
  } catch {
    return null
  }
}

// ─── Post-call summary + handoff narration ───────────────────────────────────
export interface PostCallSummaryInput {
  leadName: string
  language: Language
  durationSec: number
  topicsCovered: string[]
  objectionsRaised: string[]
  interestLevel: "HOT" | "WARM" | "COLD"
  interestScore: number
  turns: Array<{ role: string; text: string }>
}

export async function generatePostCallSummary(
  input: PostCallSummaryInput,
): Promise<{ summary: string; rmHandoffNote: string } | null> {
  if (!hasLLM()) return null

  const cacheKey = `summary_${hashKey(input)}`
  const cached = readCache(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as { summary: string; rmHandoffNote: string }
    } catch {
      // fall through
    }
  }

  const transcript = input.turns
    .slice(0, 30)
    .map((t) => `${t.role.toUpperCase()}: ${t.text}`)
    .join("\n")

  const system = `You are summarising a Rupeezy partner-program sales call for the Relationship Manager (RM) who will follow up. Reply in English (operations team language) with JSON ONLY:
{
  "summary": "2-3 sentence call recap covering what was pitched, lead reaction, and final state",
  "rmHandoffNote": "3-5 actionable bullet points the RM needs before calling the lead — what objections were raised, how the agent rebutted, what the lead seemed to want most, what to lead with"
}
Do NOT invent details that aren't in the transcript. Do NOT change the interest level.`

  const user = `Lead: ${input.leadName} · Language preference: ${input.language}
Duration: ${input.durationSec}s · Interest level (locked by classifier): ${input.interestLevel} (score ${input.interestScore.toFixed(2)})
Topics covered: ${input.topicsCovered.join(", ") || "(none)"}
Objections raised: ${input.objectionsRaised.join(", ") || "(none)"}

Transcript:
${transcript}`

  try {
    const out = await rawLLM(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      360,
      true,
    )
    if (!out) return null
    const parsed = JSON.parse(out) as { summary: string; rmHandoffNote: string }
    const formatted = {
      summary: parsed.summary ?? "",
      rmHandoffNote: parsed.rmHandoffNote ?? "",
    }
    writeCache(cacheKey, JSON.stringify(formatted))
    return formatted
  } catch {
    return null
  }
}

// ─── Dashboard funnel briefing ───────────────────────────────────────────────
export interface FunnelBriefingInput {
  totalLeads: number
  contacted: number
  qualified: number
  handedToRm: number
  hot: number
  warm: number
  cold: number
  topLanguage?: string
  topLanguageCount?: number
  conversionRate: number
}

export async function generateFunnelBriefing(input: FunnelBriefingInput): Promise<string> {
  const cacheKey = `funnel_${hashKey({ ...input, day: new Date().toISOString().slice(0, 10) })}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  if (!hasLLM()) {
    return (
      `${input.totalLeads} leads · ${input.contacted} contacted · ${input.handedToRm} handed to RM. ` +
      `${input.hot} hot, ${input.warm} warm, ${input.cold} cold. ` +
      `Conversion ${(input.conversionRate * 100).toFixed(0)}%. Top language: ${input.topLanguage ?? "—"}.`
    )
  }

  const system =
    "You brief a Rupeezy operations head on the AI voice agent's conversion funnel. " +
    "Reply in English, 3 short sentences (max 70 words). " +
    "Sentence 1: scale + conversion. " +
    "Sentence 2: hot-leads queue size and language mix. " +
    "Sentence 3: where to focus today. Use only the numbers given. Do NOT invent."

  const user =
    `Total leads: ${input.totalLeads}\n` +
    `Contacted: ${input.contacted} · Qualified: ${input.qualified} · Handed to RM: ${input.handedToRm}\n` +
    `Hot: ${input.hot} · Warm: ${input.warm} · Cold: ${input.cold}\n` +
    `Conversion rate: ${(input.conversionRate * 100).toFixed(1)}%\n` +
    `Top language: ${input.topLanguage ?? "—"} (${input.topLanguageCount ?? 0} calls)`

  try {
    const out = await rawLLM(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      240,
    )
    if (out) writeCache(cacheKey, out)
    return out
  } catch {
    return ""
  }
}
