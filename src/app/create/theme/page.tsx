"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Palette } from "lucide-react";

export default function CreateFromTheme() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-8 sm:py-12">
      <main className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="relative space-y-1 text-center">
          <div className="absolute left-0 top-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create from Theme
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Describe a theme and we&apos;ll generate a full coloring book
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Palette className="size-8" />
            </div>
            <p className="text-muted-foreground">
              Theme-based generation coming soon. This feature will let you describe a theme and auto-generate an entire coloring book.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
