"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { PhotoUpload } from "@/components/photo-upload";
import { AgeSelector } from "@/components/age-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <main className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Coloring Book Generator
          </h1>
          <p className="text-muted-foreground">
            Upload a family photo and turn it into a coloring page
          </p>
        </div>

        <PhotoUpload photo={photo} onPhotoChange={setPhoto} />
        <AgeSelector age={age} onAgeChange={setAge} />

        <Button
          className="w-full"
          size="lg"
          disabled={!photo || generating}
          onClick={handleGenerate}
        >
          {generating
            ? "Generating…"
            : pages.length === 0
              ? "Generate Coloring Page"
              : "Generate Another Variation"}
        </Button>

        {generating && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="aspect-square w-full rounded-lg" />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive text-center text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {pages.length > 0 && !generating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? "s" : ""} generated
                {selectedPages.length > 0 && selectedPages.length < pages.length
                  ? ` · ${selectedPages.length} selected for export`
                  : ""}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  Export PDF{selectedPages.length > 0 && selectedPages.length < pages.length
                    ? ` (${selectedPages.length})`
                    : ""}
                </Button>
              </div>
            </div>

            <div className={`grid gap-4 ${pages.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {pages.map((page, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    page.selected
                      ? "ring-2 ring-primary"
                      : "opacity-60"
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
                      >
                        <a href={page.image} download={`coloring-page-${index + 1}.png`}>
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
      </main>
    </div>
  );
}
