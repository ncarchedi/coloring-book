import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getComplexityPrompt(age: number): string {
  if (age <= 4) {
    return "very simple coloring page for toddlers: large bold outlines, thick lines, very few elements, big simple shapes, no fine detail";
  }
  if (age <= 7) {
    return "medium complexity coloring page for young children: moderate detail, clear outlines, some smaller elements but still easy to color, medium-thick lines";
  }
  return "detailed coloring page for older children: fine lines, complex scene with many elements, intricate patterns and details, thin clean outlines";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, age, pageCount } = body;

    if (!theme || typeof theme !== "string" || theme.trim().length === 0) {
      return NextResponse.json(
        { error: "A theme description is required" },
        { status: 400 }
      );
    }

    if (!age || typeof age !== "number" || age < 1 || age > 12) {
      return NextResponse.json(
        { error: "Age must be a number between 1 and 12" },
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

    // Step 1: Use GPT-4o to brainstorm unique scene descriptions for the theme
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
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = planText.match(/\[[\s\S]*\]/);
      scenes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      scenes = Array.from(
        { length: pageCount },
        (_, i) => `Scene ${i + 1} based on the theme: ${theme.trim()}`
      );
    }

    // Ensure we have exactly the right number of scenes
    while (scenes.length < pageCount) {
      scenes.push(`Another scene based on the theme: ${theme.trim()}`);
    }
    scenes = scenes.slice(0, pageCount);

    // Step 2: Generate each coloring page image
    const complexityPrompt = getComplexityPrompt(age);
    const results: { image: string; scene: string; error?: string }[] = [];

    for (const scene of scenes) {
      try {
        const imagePrompt = `Create a black and white coloring book page. Scene: ${scene}. Style: ${complexityPrompt}. The image must be pure black outlines on a white background, no shading, no gray tones, no color — only clean line art suitable for coloring in with crayons. Fill the entire frame with the artwork — no large empty margins.`;

        const imageResponse = await openai.images.generate({
          model: "gpt-image-1",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1536",
          quality: "medium",
        });

        const imageBase64 = imageResponse.data?.[0]?.b64_json;

        if (imageBase64) {
          results.push({
            image: `data:image/png;base64,${imageBase64}`,
            scene,
          });
        } else {
          results.push({ image: "", scene, error: "Failed to generate image" });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        results.push({ image: "", scene, error: message });
      }
    }

    return NextResponse.json({ scenes: results });
  } catch (error) {
    console.error("Theme generation error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
