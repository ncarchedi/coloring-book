import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 60,
      temperature: 1.2,
      messages: [
        {
          role: "system",
          content:
            "You generate creative, fun, imaginative coloring book themes for kids. Respond with ONLY the theme — a short phrase (3-8 words) in sentence case (only capitalize the first word), no quotes, no punctuation, no explanation.",
        },
        {
          role: "user",
          content: "Give me a random fun coloring book theme for kids.",
        },
      ],
    });

    const theme = response.choices[0]?.message?.content?.trim() ?? "animals on a space adventure";

    return NextResponse.json({ theme });
  } catch (error) {
    console.error("Surprise theme error:", error);
    return NextResponse.json(
      { error: "Failed to generate theme" },
      { status: 500 }
    );
  }
}
