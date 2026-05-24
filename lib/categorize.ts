import Anthropic from "@anthropic-ai/sdk";

const CATEGORIES = ["POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_DEFINITIONS = `
- POLITICS: government, elections, politicians, policy, political parties, law, geopolitics, war, diplomacy, public officials (presidents, senators, ministers, VPs, etc.)
- CULTURE: entertainment, music, film, art, social trends, celebrities, media, religion, lifestyle, philosophy
- SPORTS: athletics, teams, players, leagues, tournaments, coaches, sporting events
- TECH: technology, software, AI, startups, companies, science, engineering, the internet
- CALLOUTS: direct personal challenges or accusations targeting a specific named individual (not a public policy debate — a personal beef with someone)
`.trim();

export async function categorizeClaim(claim: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ["POLITICS"];

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      system: `You categorize debate claims. Apply ALL categories that clearly fit — do not limit yourself to one.

Categories and what they mean:
${CATEGORY_DEFINITIONS}

Rules:
- A claim about a politician or government official ALWAYS gets POLITICS, even if it also touches culture.
- A claim that directly targets a named person for personal conduct gets CALLOUTS in addition to any other relevant tag.
- Respond with ONLY a JSON array of uppercase strings from this list: ${CATEGORIES.join(", ")}.
- Example: ["POLITICS","CULTURE"] or ["SPORTS"] or ["POLITICS","CALLOUTS"]
- No explanation. No other text.`,
      messages: [{ role: "user", content: claim }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    // Strip markdown code fences if the model wraps the response
    const clean = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/,"").trim();
    const parsed = JSON.parse(clean);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((c): c is Category => CATEGORIES.includes(c as Category))
    ) {
      return parsed;
    }
  } catch {
    // fall through to default
  }

  return ["POLITICS"];
}
