import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, pageCount } = body;

    if (!theme || typeof theme !== "string" || theme.trim().length === 0) {
      return NextResponse.json(
        { error: "A theme description is required" },
        { status: 400 }
      );
    }

    if (!pageCount || typeof pageCount !== "number" || pageCount < 1 || pageCount > 10) {
      return NextResponse.json(
        { error: "Page count must be between 1 and 10" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const planResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a creative children's coloring book designer. Given a theme, generate unique scene descriptions for coloring book pages. Each scene should be distinct and varied while staying on theme. Return ONLY a JSON array of strings, no other text.",
        },
        {
          role: "user",
          content: `Theme: "${theme.trim()}"\n\nGenerate exactly ${pageCount} unique, vivid scene descriptions for coloring book pages based on this theme. Each scene should be different (different characters, settings, activities, or perspectives). Return a JSON array of ${pageCount} strings.`,
        },
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    const planText = planResponse.choices[0]?.message?.content ?? "[]";
    let scenes: string[];
    try {
      const jsonMatch = planText.match(/\[[\s\S]*\]/);
      scenes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      scenes = Array.from(
        { length: pageCount },
        (_, i) => `Scene ${i + 1} based on the theme: ${theme.trim()}`
      );
    }

    while (scenes.length < pageCount) {
      scenes.push(`Another scene based on the theme: ${theme.trim()}`);
    }
    scenes = scenes.slice(0, pageCount);

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error("Theme planning error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
