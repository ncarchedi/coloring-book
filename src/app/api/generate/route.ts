import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

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
    const { photo, age, description, variationIndex = 0 } = body;

    if (!photo || typeof photo !== "string") {
      return NextResponse.json(
        { error: "A photo is required" },
        { status: 400 }
      );
    }

    if (!age || typeof age !== "number" || age < 1 || age > 12) {
      return NextResponse.json(
        { error: "Age must be a number between 1 and 12" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "A description is required" },
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

    const complexityPrompt = getComplexityPrompt(age);

    const variationStyles = [
      "faithful recreation of the scene",
      "whimsical cartoon interpretation",
      "storybook illustration style",
      "playful chibi/cute style",
      "nature-themed decorative border around the scene",
      "comic book panel style",
    ];

    const styleVariation = variationStyles[variationIndex % variationStyles.length];

    const imagePrompt = `Convert this photo into a black and white coloring book page. Scene context: ${description}. Style: ${complexityPrompt}. Artistic approach: ${styleVariation}. The image must be pure black outlines on a white background, no shading, no gray tones, no color — only clean line art suitable for coloring in with crayons. Preserve the composition, poses, and key details of the original photo. Fill the entire frame with the artwork — no large empty margins.`;

    const imageBuffer = Buffer.from(base64Data, "base64");
    const extension = mediaType === "image/png" ? "png" : mediaType === "image/webp" ? "webp" : "jpg";
    const imageFile = await toFile(imageBuffer, `photo.${extension}`, { type: mediaType });

    const imageResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: imagePrompt,
      n: 1,
      size: "1024x1536",
      quality: "medium",
    });

    const imageBase64 = imageResponse.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Failed to generate coloring page image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
