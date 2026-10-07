import Anthropic from "@anthropic-ai/sdk";

const CATEGORIES = ["POLITICS", "CULTURE", "SPORTS", "TECH", "CALLOUTS"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_DEFINITIONS = `
- POLITICS: government, elections, politicians, policy, political parties, law, geopolitics, war, diplomacy, public officials (presidents, senators, ministers, VPs, etc.)
- CULTURE: entertainment, music, film, art, social trends, celebrities, media, religion, lifestyle, philosophy
- SPORTS: athletics, teams, players, leagues, tournaments, coaches, sporting events, championships
- TECH: technology, software, AI, startups, companies, science, engineering, the internet
- CALLOUTS: direct personal challenges or accusations targeting a specific named individual (not a public policy debate — a personal beef with someone)
`.trim();

export async function categorizeClaim(claim: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ["CULTURE"];

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 100,
      system: `You categorize debate claims. Apply ALL categories that clearly fit — use multiple when appropriate.

Categories:
${CATEGORY_DEFINITIONS}

Examples:
- "The Chiefs will win the Super Bowl" → ["SPORTS"]
- "LeBron is washed up" → ["SPORTS"]
- "JD Vance is a menace to society" → ["POLITICS", "CALLOUTS"]
- "Trump's policies will destroy America" → ["POLITICS"]
- "Pineapple belongs on pizza" → ["CULTURE"]
- "Taylor Swift is overrated" → ["CULTURE"]
- "AI will replace all jobs by 2030" → ["TECH"]
- "Elon Musk is ruining Twitter" → ["TECH", "CALLOUTS"]
- "@john123 doesn't know what he's talking about" → ["CALLOUTS"]

Rules:
- Sports teams, players, leagues, championships → ALWAYS SPORTS
- Politicians, government officials, policy → ALWAYS POLITICS
- Direct attacks on named people → add CALLOUTS
- Can assign multiple categories when truly relevant
- Be specific: don't default to POLITICS unless it's actually political

Respond with ONLY a JSON array: ${CATEGORIES.join(", ")}
No explanation. No markdown. Just the array.`,
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
  } catch (error) {
    console.error("Categorization failed:", error);
  }

  // Default fallback if categorization fails
  return ["CULTURE"];
}
