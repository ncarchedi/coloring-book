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
    const { scene, age } = body;

    if (!scene || typeof scene !== "string") {
      return NextResponse.json(
        { error: "A scene description is required" },
        { status: 400 }
      );
    }

    if (!age || typeof age !== "number" || age < 1 || age > 12) {
      return NextResponse.json(
        { error: "Age must be a number between 1 and 12" },
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
    const complexityPrompt = getComplexityPrompt(age);

    const imagePrompt = `Create a black and white coloring book page. Scene: ${scene}. Style: ${complexityPrompt}. The image must be pure black outlines on a white background, no shading, no gray tones, no color — only clean line art suitable for coloring in with crayons.`;

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = imageResponse.data?.[0]?.b64_json;

    if (imageBase64) {
      return NextResponse.json({
        image: `data:image/png;base64,${imageBase64}`,
        scene,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to generate image", scene },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Page generation error:", error);
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
