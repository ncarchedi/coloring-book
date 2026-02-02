import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo } = body;

    if (!photo || typeof photo !== "string") {
      return NextResponse.json(
        { error: "A photo is required" },
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

    const base64Data = photo.includes(",") ? photo.split(",")[1] : photo;
    const mediaType = photo.startsWith("data:image/png")
      ? "image/png"
      : photo.startsWith("data:image/webp")
        ? "image/webp"
        : "image/jpeg";

    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe the main subjects and scene in this family photo in 2-3 sentences. Focus on the people, their activities, and the setting. Be specific but concise.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const description =
      analysis.choices[0]?.message?.content ?? "a family scene";

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Photo analysis error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
