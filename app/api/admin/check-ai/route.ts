import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI detection using Claude
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Ask Claude to analyze the text
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this text and determine if it was likely written by AI (like ChatGPT, Claude, etc.) or by a human.

Text to analyze:
"""
${text}
"""

Respond ONLY with a JSON object in this exact format:
{
  "confidence": <number 0-100>,
  "isAI": <boolean>,
  "reasoning": "<brief explanation>",
  "telltales": ["<specific phrase or pattern 1>", "<pattern 2>", ...]
}

Where:
- confidence: 0 = definitely human, 100 = definitely AI
- isAI: true if confidence > 70
- reasoning: 1-2 sentences explaining why
- telltales: specific AI tells you found (empty array if none)

Common AI tells:
- "It's important to note"
- "Let's delve into"
- "In conclusion"
- Overly formal tone
- Perfect grammar with no typos
- Excessive hedging ("perhaps", "one might argue")
- Repetitive sentence structures`,
        },
      ],
    });

    // Extract the response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    const result = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("AI detection error:", error);
    return NextResponse.json(
      {
        error: "Failed to check text",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
