"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { AgeSelector } from "@/components/age-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, FileDown, Loader2, Sparkles } from "lucide-react";

interface GeneratedPage {
  image: string;
  scene: string;
  selected: boolean;
  error?: string;
}

export default function CreateFromTheme() {
  const [theme, setTheme] = useState("");
  const [age, setAge] = useState(3);
  const [pageCount, setPageCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedPages = pages.filter((p) => p.selected && p.image);

  const handleExportPdf = useCallback(() => {
    const toExport = selectedPages.length > 0 ? selectedPages : pages.filter((p) => p.image);
    if (toExport.length === 0) return;

    let loaded = 0;
    const images: { img: HTMLImageElement; src: string }[] = [];

    toExport.forEach((page, i) => {
      const img = new Image();
      img.onload = () => {
        images[i] = { img, src: page.image };
        loaded++;
        if (loaded === toExport.length) {
          const first = images[0].img;
          const isLandscape = first.width > first.height;
          const orientation = isLandscape ? "landscape" : "portrait";
          const pdf = new jsPDF({ orientation, unit: "in", format: "letter" });

          images.forEach(({ img: im, src }, idx) => {
            if (idx > 0) {
              const land = im.width > im.height;
              pdf.addPage("letter", land ? "landscape" : "portrait");
            }
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const scale = Math.min(pageW / im.width, pageH / im.height);
            const w = im.width * scale;
            const h = im.height * scale;
            const x = (pageW - w) / 2;
            const y = (pageH - h) / 2;
            pdf.addImage(src, "PNG", x, y, w, h);
          });

          pdf.save("coloring-book.pdf");
        }
      };
      img.src = page.image;
    });
  }, [pages, selectedPages]);

  async function handleGenerate() {
    if (!theme.trim()) return;

    setGenerating(true);
    setError(null);
    setPages([]);

    try {
      const response = await fetch("/api/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim(), age, pageCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate coloring book");
        return;
      }

      const generated: GeneratedPage[] = data.scenes.map(
        (s: { image: string; scene: string; error?: string }) => ({
          image: s.image,
          scene: s.scene,
          selected: !s.error,
          error: s.error,
        })
      );

      setPages(generated);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function togglePageSelection(index: number) {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  const successPages = pages.filter((p) => p.image);

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

        {/* Theme Input */}
        <Card>
          <CardContent className="space-y-3">
            <Label htmlFor="theme-input" className="text-sm font-medium">
              Theme Description
            </Label>
            <Textarea
              id="theme-input"
              placeholder="e.g. underwater ocean adventure, dinosaurs in space, magical fairy garden..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Age Selector */}
        <AgeSelector age={age} onAgeChange={setAge} />

        {/* Page Count Selector */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="page-count-slider" className="text-sm font-medium">
                Number of Pages
              </Label>
              <span className="text-2xl font-bold">{pageCount}</span>
            </div>
            <Slider
              id="page-count-slider"
              min={2}
              max={10}
              step={2}
              value={[pageCount]}
              onValueChange={([v]) => setPageCount(v)}
            />
            <p className="text-xs text-muted-foreground">
              Each page will be a unique scene based on your theme
            </p>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          className="w-full transition-all duration-200"
          size="lg"
          disabled={!theme.trim() || generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating {pageCount} pages&hellip;
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Coloring Book
            </>
          )}
        </Button>

        {/* Loading Skeleton */}
        {generating && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <p className="text-sm text-muted-foreground text-center">
              Planning scenes and generating pages&hellip; this may take a moment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {Array.from({ length: pageCount }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive animate-in fade-in duration-300">
            <CardContent className="p-6">
              <p className="text-destructive text-center text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {pages.length > 0 && !generating && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {successPages.length} page{successPages.length !== 1 ? "s" : ""} generated
                {selectedPages.length > 0 && selectedPages.length < successPages.length
                  ? ` · ${selectedPages.length} selected`
                  : ""}
              </p>
              {successPages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  className="transition-all duration-200"
                >
                  <FileDown className="size-4" />
                  Export PDF
                  {selectedPages.length > 0 && selectedPages.length < successPages.length
                    ? ` (${selectedPages.length})`
                    : ""}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {pages.map((page, index) => (
                <Card
                  key={index}
                  className={`transition-all duration-200 ${
                    page.error
                      ? "border-destructive opacity-60"
                      : `cursor-pointer hover:shadow-md ${
                          page.selected
                            ? "ring-2 ring-primary"
                            : "opacity-60 hover:opacity-80"
                        }`
                  }`}
                  onClick={() => !page.error && togglePageSelection(index)}
                >
                  <CardContent className="p-3 space-y-2">
                    {page.error ? (
                      <div className="aspect-square w-full rounded-lg bg-destructive/10 flex items-center justify-center">
                        <p className="text-destructive text-xs text-center px-4">
                          Failed to generate: {page.error}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.image}
                          alt={`Coloring page ${index + 1}: ${page.scene}`}
                          className="w-full rounded-lg border"
                        />
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate mr-2">
                        Page {index + 1}
                      </span>
                      {page.image && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="transition-colors duration-200"
                        >
                          <a href={page.image} download={`coloring-page-${index + 1}.png`}>
                            <Download className="size-3" />
                            PNG
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by OpenAI &middot; All generation happens via AI
          </p>
        </footer>
      </main>
    </div>
  );
}
