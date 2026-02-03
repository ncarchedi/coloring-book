import { NextRequest, NextResponse } from "next/server";

const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const COOKIE_NAME = "coloring-book-auth";

export async function POST(request: NextRequest) {
  if (!AUTH_PASSWORD) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { password } = body;

  if (password === AUTH_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
