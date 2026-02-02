import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email sending is not configured (missing RESEND_API_KEY)" },
      { status: 500 }
    );
  }

  let body: { pdf?: string; email?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pdf, email, title } = body;

  if (!pdf || typeof pdf !== "string") {
    return NextResponse.json({ error: "Missing pdf data" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const filename = title?.trim()
    ? `${title.trim().toLowerCase().replace(/\s+/g, "-")}.pdf`
    : "coloring-book.pdf";

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: "Coloring Book <onboarding@resend.dev>",
      to: email,
      subject: title?.trim()
        ? `Your Coloring Book: ${title.trim()}`
        : "Your Coloring Book",
      text: "Your coloring book PDF is attached. Enjoy!",
      attachments: [
        {
          filename,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
