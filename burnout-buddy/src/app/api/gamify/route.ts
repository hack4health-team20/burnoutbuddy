import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GamificationInput, GamificationStories } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const buildPrompt = (payload: GamificationInput) => {
  const summary = JSON.stringify(payload, null, 2);
  return [
    {
      role: "system" as const,
      content:
        "You are Burnout Buddy's gentle narrator. Write concise, uplifting narratives for physicians navigating burnout. Always respond with valid JSON: {\"achievementStory\": string, \"streakCelebration\": string, \"progressNarrative\": string}. Keep each field under 90 words, warm but professional, no medical advice.",
    },
    {
      role: "user" as const,
      content: `Craft three pieces (achievementStory, streakCelebration, progressNarrative) for this physician data:\n${summary}`,
    },
  ];
};

const parseAIResponse = (text: string): GamificationStories => {
  try {
    const parsed = JSON.parse(text) as GamificationStories;
    if (
      typeof parsed.achievementStory === "string" &&
      typeof parsed.streakCelebration === "string" &&
      typeof parsed.progressNarrative === "string"
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse AI response", error);
  }
  throw new Error("AI response was malformed.");
};

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI storytelling is unavailable. Add OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  let body: GamificationInput;
  try {
    body = (await req.json()) as GamificationInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildPrompt(body),
      temperature: 0.7,
      max_output_tokens: 800,
      text: {
        format: {
          type: "json_schema",
          name: "gamification_stories",
          schema: {
            type: "object",
            properties: {
              achievementStory: { type: "string" },
              streakCelebration: { type: "string" },
              progressNarrative: { type: "string" },
            },
            required: ["achievementStory", "streakCelebration", "progressNarrative"],
            additionalProperties: false,
          },
        },
      },
    });

    const textOutput = response.output?.[0]?.content?.[0];
    if (textOutput?.type !== "output_text") {
      throw new Error("Unexpected AI response format.");
    }

    const stories = parseAIResponse(textOutput.text ?? "");
    return NextResponse.json({ stories });
  } catch (error) {
    console.error("Gamification AI error", error);
    return NextResponse.json(
      { error: "We couldn't craft a story right now. Try again later." },
      { status: 500 }
    );
  }
}

