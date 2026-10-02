import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface JudgeMessage {
  side: "CHALLENGER" | "RESPONDER";
  handle: string;
  content: string;
  createdAt: string;
}

export interface JudgeResult {
  winner: "CHALLENGER" | "RESPONDER";
  decision: string;
  judgeId: string;
  judgeName: string;
}

interface JudgeDef {
  id: string;
  name: string;
  envKey: string;
  call: (apiKey: string, prompt: string) => Promise<string>;
}

const JUDGES: JudgeDef[] = [
  {
    id: "claude",
    name: "Claude",
    envKey: "ANTHROPIC_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.content[0].type === "text" ? res.content[0].text : "";
    },
  },
  {
    id: "chatgpt",
    name: "GPT-4o",
    envKey: "OPENAI_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey });
      const res = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "grok",
    name: "Grok",
    envKey: "XAI_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
      const res = await client.chat.completions.create({
        model: "grok-3",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    envKey: "DEEPSEEK_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
      const res = await client.chat.completions.create({
        model: "deepseek-chat",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "kimi",
    name: "Kimi",
    envKey: "MOONSHOT_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey, baseURL: "https://api.moonshot.cn/v1" });
      const res = await client.chat.completions.create({
        model: "moonshot-v1-32k",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "perplexity",
    name: "Perplexity",
    envKey: "PERPLEXITY_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey, baseURL: "https://api.perplexity.ai" });
      const res = await client.chat.completions.create({
        model: "llama-3.1-sonar-large-128k-chat",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "gemini",
    name: "Gemini",
    envKey: "GEMINI_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      });
      const res = await client.chat.completions.create({
        model: "gemini-1.5-flash",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
  {
    id: "llama",
    name: "Llama 3",
    envKey: "GROQ_API_KEY",
    call: async (apiKey, prompt) => {
      const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
      const res = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0].message.content ?? "";
    },
  },
];

function buildPrompt(claim: string, messages: JudgeMessage[]): string {
  const thread = messages
    .map((m) => `[${m.side} — @${m.handle}]\n${m.content}`)
    .join("\n\n---\n\n");

  return `You are the AI judge for BEEF — a paid debate platform where people stake real money on their arguments. Read the thread below and decide who made the more convincing case.

THE CLAIM: "${claim}"

THE THREAD:
${thread || "(No messages posted — the thread is empty)"}

JUDGING RULES:
- Pick exactly one winner: CHALLENGER (who made the original claim) or RESPONDER (who disputed it)
- If the thread is empty or one side posted nothing, the silent side loses
- Judge on argument quality, evidence, and rhetoric — not just who you personally agree with
- Be direct and decisive — this is for real money
- Keep your decision to 2-4 sentences

Respond with ONLY valid JSON, no other text:
{"winner": "CHALLENGER", "decision": "Your concise verdict here."}`;
}

function pickRandomJudge(): { judge: JudgeDef; apiKey: string } | null {
  const available = JUDGES.filter((j) => !!process.env[j.envKey]);
  if (available.length === 0) return null;
  const judge = available[Math.floor(Math.random() * available.length)];
  return { judge, apiKey: process.env[judge.envKey]! };
}

function parseVerdict(raw: string): { winner: "CHALLENGER" | "RESPONDER"; decision: string } | null {
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (
      (parsed.winner === "CHALLENGER" || parsed.winner === "RESPONDER") &&
      typeof parsed.decision === "string"
    ) {
      return { winner: parsed.winner, decision: parsed.decision };
    }
  } catch {
    // try to extract from malformed response
    const winnerMatch = raw.match(/"winner"\s*:\s*"(CHALLENGER|RESPONDER)"/);
    const decisionMatch = raw.match(/"decision"\s*:\s*"([^"]+)"/);
    if (winnerMatch && decisionMatch) {
      return {
        winner: winnerMatch[1] as "CHALLENGER" | "RESPONDER",
        decision: decisionMatch[1],
      };
    }
  }
  return null;
}

export async function judgeBeef(
  claim: string,
  messages: JudgeMessage[]
): Promise<JudgeResult> {
  const picked = pickRandomJudge();

  if (!picked) {
    return {
      winner: messages.length === 0 ? "CHALLENGER" : "CHALLENGER",
      decision: "No judge was available. The challenger wins by default.",
      judgeId: "default",
      judgeName: "Default",
    };
  }

  const { judge, apiKey } = picked;
  const prompt = buildPrompt(claim, messages);

  let raw = "";
  try {
    raw = await judge.call(apiKey, prompt);
  } catch (err) {
    console.error(`Judge ${judge.id} failed:`, err);
    throw new Error(`Judge ${judge.name} could not be reached`);
  }

  const verdict = parseVerdict(raw);
  if (!verdict) {
    throw new Error(`Judge ${judge.name} returned an unparseable verdict: ${raw.slice(0, 200)}`);
  }

  return {
    winner: verdict.winner,
    decision: verdict.decision,
    judgeId: judge.id,
    judgeName: judge.name,
  };
}
