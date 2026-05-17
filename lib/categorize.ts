import Anthropic from "@anthropic-ai/sdk";

const CATEGORIES = ["POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"] as const;

export async function categorizeClaim(claim: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ["CULTURE"];

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      system: `You categorize debate claims into one or more of these categories: ${CATEGORIES.join(", ")}.
Respond with ONLY a JSON array of matching category strings, e.g. ["POLITICS"] or ["CULTURE","SPORTS"].
Pick 1-2 categories that best fit. No explanation.`,
      messages: [{ role: "user", content: claim }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((c) => CATEGORIES.includes(c))) {
      return parsed;
    }
  } catch {
    // fall through to default
  }

  return ["CULTURE"];
}
