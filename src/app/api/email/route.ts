import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured. Set RESEND_API_KEY in .env.local." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const email = formData.get("email") as string | null;
    const bookTitle = (formData.get("title") as string | null) || "Your Coloring Book";
    const pdfFile = formData.get("pdf") as File | null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!pdfFile) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Coloring Book <onboarding@resend.dev>",
      to: email,
      subject: bookTitle,
      html: `<p>Here's your coloring book: <strong>${bookTitle}</strong></p><p>The PDF is attached — print it out and have fun coloring!</p>`,
      attachments: [
        {
          filename: `${bookTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email." },
      { status: 500 }
    );
  }
}
