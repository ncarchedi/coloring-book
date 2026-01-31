"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { PhotoUpload } from "@/components/photo-upload";
import { AgeSelector } from "@/components/age-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [age, setAge] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExportPdf = useCallback(() => {
    if (!result) return;

    const img = new Image();
    img.onload = () => {
      const isLandscape = img.width > img.height;
      const orientation = isLandscape ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "in", format: "letter" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const scale = Math.min(pageW / img.width, pageH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;

      pdf.addImage(result, "PNG", x, y, w, h);
      pdf.save("coloring-book.pdf");
    };
    img.src = result;
  }, [result]);

  async function handleGenerate() {
    if (!photo) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, age }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate coloring page");
        return;
      }

      setResult(data.image);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <main className="w-full max-w-xl space-y-8">
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
          {generating ? "Generating…" : "Generate Coloring Page"}
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

        {result && !generating && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Your coloring page is ready!
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result}
                alt="Generated coloring page"
                className="w-full rounded-lg border"
              />
              <div className="flex gap-3">
                <Button className="flex-1" asChild>
                  <a href={result} download="coloring-page.png">
                    Download PNG
                  </a>
                </Button>
                <Button className="flex-1" variant="outline" onClick={handleExportPdf}>
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
