"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { PhotoUpload } from "@/components/photo-upload";
import { AgeSelector } from "@/components/age-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileDown, Loader2 } from "lucide-react";

interface ColoringPage {
  image: string;
  selected: boolean;
}

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [age, setAge] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [pages, setPages] = useState<ColoringPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedPages = pages.filter((p) => p.selected);

  const handleExportPdf = useCallback(() => {
    const toExport = selectedPages.length > 0 ? selectedPages : pages;
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
    if (!photo) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, age, variationIndex: pages.length }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate coloring page");
        return;
      }

      setPages((prev) => [...prev, { image: data.image, selected: true }]);
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

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-8 sm:py-12">
      <main className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="relative space-y-1 text-center">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Coloring Book Generator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Upload a family photo and we&apos;ll turn it into an age-appropriate coloring page
          </p>
        </header>

        {/* Upload + Age */}
        <div className="space-y-4 sm:space-y-6">
          <PhotoUpload photo={photo} onPhotoChange={setPhoto} />
          <AgeSelector age={age} onAgeChange={setAge} />
        </div>

        {/* Generate Button */}
        <Button
          className="w-full transition-all duration-200"
          size="lg"
          disabled={!photo || generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating&hellip;
            </>
          ) : pages.length === 0 ? (
            "Generate Coloring Page"
          ) : (
            "Generate Another Variation"
          )}
        </Button>

        {/* Loading Skeleton */}
        {generating && (
          <Card className="animate-in fade-in duration-300">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="aspect-square w-full rounded-lg" />
            </CardContent>
          </Card>
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
                {pages.length} page{pages.length !== 1 ? "s" : ""} generated
                {selectedPages.length > 0 && selectedPages.length < pages.length
                  ? ` · ${selectedPages.length} selected`
                  : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                className="transition-all duration-200"
              >
                <FileDown className="size-4" />
                Export PDF
                {selectedPages.length > 0 && selectedPages.length < pages.length
                  ? ` (${selectedPages.length})`
                  : ""}
              </Button>
            </div>

            <div
              className={`grid gap-3 sm:gap-4 ${
                pages.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {pages.map((page, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    page.selected
                      ? "ring-2 ring-primary"
                      : "opacity-60 hover:opacity-80"
                  }`}
                  onClick={() => togglePageSelection(index)}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.image}
                      alt={`Coloring page ${index + 1}`}
                      className="w-full rounded-lg border"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Page {index + 1}
                      </span>
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
            Powered by OpenAI &middot; Photos are never stored
          </p>
        </footer>
      </main>
    </div>
  );
}
