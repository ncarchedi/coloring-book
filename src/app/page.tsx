"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Palette } from "lucide-react";

const options = [
  {
    title: "Create from Theme",
    description: "Describe a theme and we'll generate a full coloring book with unique scenes",
    icon: Palette,
    href: "/create/theme",
  },
  {
    title: "Create from Photos",
    description: "Upload family photos and turn them into coloring book pages",
    icon: Camera,
    href: "/create/photos",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-8 sm:py-16">
      <main className="w-full max-w-2xl space-y-8 sm:space-y-10">
        {/* Header */}
        <header className="relative space-y-2 text-center">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Coloring Book Generator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Create age-appropriate coloring books from themes or family photos
          </p>
        </header>

        {/* Options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((opt) => (
            <Link key={opt.href} href={opt.href} className="group">
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/20 group-focus-visible:ring-2 group-focus-visible:ring-primary">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
                    <opt.icon className="size-6" />
                  </div>
                  <h2 className="text-lg font-semibold">{opt.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by OpenAI &middot; Photos are never stored
          </p>
        </footer>
      </main>
    </div>
  );
}
