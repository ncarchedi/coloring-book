"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useColoringBook } from "@/context/coloring-book-context";
import { AgeSelector } from "@/components/age-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Dices, Download, Loader2, Sparkles } from "lucide-react";

interface GeneratedPage {
  image: string;
  scene: string;
  selected: boolean;
  error?: string;
  loading?: boolean;
}

export default function CreateFromTheme() {
  const router = useRouter();
  const coloringBook = useColoringBook();
  const [theme, setTheme] = useState("");
  const [age, setAge] = useState(3);
  const [pageCount, setPageCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const abortRef = useRef(false);

  const handleSurpriseMe = async () => {
    setSurpriseLoading(true);
    try {
      const res = await fetch("/api/surprise-theme", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate theme");
      const data = await res.json();
      setTheme(data.theme);
    } catch {
      // silently fail — user can just type their own theme
    } finally {
      setSurpriseLoading(false);
    }
  };

  const selectedPages = pages.filter((p) => p.selected && p.image);
  const successPages = pages.filter((p) => p.image);


  async function handleGenerate() {
    if (!theme.trim()) return;

    abortRef.current = false;
    setGenerating(true);
    setError(null);
    setPages([]);
    setProgress({ current: 0, total: pageCount, phase: "Planning scenes" });

    try {
      // Step 1: Plan scenes
      const planRes = await fetch("/api/generate-theme/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim(), pageCount }),
      });

      const planData = await planRes.json();

      if (!planRes.ok) {
        setError(planData.error || "Failed to plan scenes");
        setGenerating(false);
        return;
      }

      const scenes: string[] = planData.scenes;

      // Initialize pages with loading state
      setPages(
        scenes.map((scene) => ({
          image: "",
          scene,
          selected: true,
          loading: true,
        }))
      );

      // Step 2: Generate each page sequentially
      for (let i = 0; i < scenes.length; i++) {
        if (abortRef.current) break;

        setProgress({
          current: i + 1,
          total: scenes.length,
          phase: `Generating page ${i + 1} of ${scenes.length}`,
        });

        try {
          const pageRes = await fetch("/api/generate-theme/page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scene: scenes[i], age }),
          });

          const pageData = await pageRes.json();

          if (!pageRes.ok) {
            setPages((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? { ...p, loading: false, error: pageData.error || "Failed", selected: false }
                  : p
              )
            );
          } else {
            setPages((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? { ...p, loading: false, image: pageData.image }
                  : p
              )
            );
          }
        } catch {
          setPages((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, loading: false, error: "Generation failed", selected: false }
                : p
            )
          );
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0, phase: "" });
    }
  }

  function togglePageSelection(index: number) {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  }

  const handleContinueToPreview = useCallback(() => {
    coloringBook.reset();
    const imagesToExport = selectedPages.length > 0 ? selectedPages : pages.filter((p) => p.image);
    imagesToExport.forEach((p) => coloringBook.addPage(p.image));
    router.push("/preview");
  }, [coloringBook, pages, selectedPages, router]);

  const completedCount = pages.filter((p) => !p.loading).length;
  const hasAnyResults = pages.some((p) => p.image);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Page Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create from Theme
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Describe a theme and we&apos;ll generate a full coloring book
          </p>
        </div>

        {/* Theme Input */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-input" className="text-sm font-medium">
                Theme Description
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSurpriseMe}
                disabled={surpriseLoading || generating}
              >
                {surpriseLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Dices className="h-4 w-4" />
                )}
                {surpriseLoading ? "Thinking..." : "Surprise Me"}
              </Button>
            </div>
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
              min={1}
              max={10}
              step={1}
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
              {progress.phase || "Generating\u2026"}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Coloring Book
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <Card className="border-destructive animate-in fade-in duration-300">
            <CardContent className="p-6">
              <p className="text-destructive text-center text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Grid (shown during and after generation) */}
        {pages.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {generating
                  ? `${completedCount} of ${pages.length} pages generated`
                  : `${successPages.length} page${successPages.length !== 1 ? "s" : ""} generated`}
                {!generating &&
                  selectedPages.length > 0 &&
                  selectedPages.length < successPages.length &&
                  ` \u00b7 ${selectedPages.length} selected`}
              </p>
            </div>

            {/* Progress bar */}
            {generating && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pages.length > 0 ? (completedCount / pages.length) * 100 : 0}%`,
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {pages.map((page, index) => (
                <Card
                  key={index}
                  className={`transition-all duration-200 ${
                    page.loading
                      ? ""
                      : page.error
                        ? "border-destructive opacity-60"
                        : `cursor-pointer hover:shadow-md ${
                            page.selected
                              ? "ring-2 ring-primary"
                              : "opacity-60 hover:opacity-80"
                          }`
                  }`}
                  onClick={() => !page.error && !page.loading && togglePageSelection(index)}
                >
                  <CardContent className="p-3 space-y-2">
                    {page.loading ? (
                      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    ) : page.error ? (
                      <div className="aspect-[2/3] w-full rounded-lg bg-destructive/10 flex items-center justify-center">
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
                          className="w-full rounded-lg border animate-in fade-in duration-500"
                        />
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate mr-2">
                        Page {index + 1}
                        {page.loading && (
                          <span className="ml-1 text-muted-foreground/60">
                            {index < progress.current ? " — generating\u2026" : " — waiting"}
                          </span>
                        )}
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

            {/* Continue to Preview */}
            {hasAnyResults && !generating && (
              <Button
                className="w-full transition-all duration-200"
                size="lg"
                onClick={handleContinueToPreview}
              >
                <BookOpen className="size-4" />
                Continue to Book Preview
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by OpenAI &middot; All generation happens via AI
          </p>
        </footer>
      </div>
    </div>
  );
}
