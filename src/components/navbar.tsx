"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isLogin = pathname === "/login";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* Left: back button or spacer */}
        <div className="flex items-center gap-2">
          {!isHome && !isLogin && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-colors hover:text-primary"
          >
            <BookOpen className="size-4" />
            <span className="text-sm">Coloring Book Generator</span>
          </Link>
        </div>

        {/* Right: logout + theme toggle */}
        <div className="flex items-center gap-1">
          {!isLogin && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
