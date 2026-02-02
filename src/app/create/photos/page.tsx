"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useColoringBook } from "@/context/coloring-book-context";
import { MultiPhotoUpload } from "@/components/multi-photo-upload";
import { AgeSelector } from "@/components/age-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Loader2 } from "lucide-react";

interface PhotoPage {
  originalPhoto: string;
  coloringImage: string | null;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

export default function CreateFromPhotos() {
  const router = useRouter();
  const coloringBook = useColoringBook();
  const [photos, setPhotos] = useState<string[]>([]);
  const [age, setAge] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [pages, setPages] = useState<PhotoPage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const abortRef = useRef(false);

  const completedCount = pages.filter((p) => p.status === "done").length;
  const totalCount = pages.length;

  const handleContinueToPreview = useCallback(() => {
    coloringBook.reset();
    pages
      .filter((p) => p.status === "done" && p.coloringImage)
      .forEach((p) => coloringBook.addPage(p.coloringImage!));
    router.push("/preview");
  }, [coloringBook, pages, router]);

  async function handleGenerate() {
    if (photos.length === 0) return;

    abortRef.current = false;
    setGenerating(true);

    // Initialize pages from uploaded photos
    const initial: PhotoPage[] = photos.map((photo) => ({
      originalPhoto: photo,
      coloringImage: null,
      status: "pending" as const,
    }));
    setPages(initial);
    setCurrentIndex(0);

    // Generate sequentially
    for (let i = 0; i < photos.length; i++) {
      if (abortRef.current) break;

      setCurrentIndex(i);
      setPages((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "generating" } : p))
      );

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: photos[i], age, variationIndex: i }),
        });

        const data = await response.json();

        if (!response.ok) {
          setPages((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: "error",
                    error: data.error || "Failed to generate",
                  }
                : p
            )
          );
        } else {
          setPages((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: "done", coloringImage: data.image }
                : p
            )
          );
        }
      } catch {
        setPages((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: "error", error: "Network error" }
              : p
          )
        );
      }
    }

    setGenerating(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Page Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create from Photos
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Upload multiple photos and we&apos;ll turn each one into a coloring
            page
          </p>
        </div>

        {/* Upload + Age */}
        {!generating && pages.length === 0 && (
          <div className="space-y-4 sm:space-y-6">
            <MultiPhotoUpload photos={photos} onPhotosChange={setPhotos} />
            <AgeSelector age={age} onAgeChange={setAge} />
          </div>
        )}

        {/* Generate Button */}
        {!generating && pages.length === 0 && (
          <Button
            className="w-full transition-all duration-200"
            size="lg"
            disabled={photos.length === 0}
            onClick={handleGenerate}
          >
            Generate Coloring Book ({photos.length} photo
            {photos.length !== 1 ? "s" : ""})
          </Button>
        )}

        {/* Progress */}
        {generating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Converting photo {currentIndex + 1} of {totalCount}
              </span>
              <span className="font-medium">
                {completedCount} of {totalCount} done
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Results grid */}
        {pages.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pages.map((page, index) => (
                <Card key={index} className="overflow-hidden py-0">
                  <CardContent className="p-0">
                    {/* Original photo thumbnail */}
                    <div className="grid grid-cols-2 gap-0">
                      {/* Original */}
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.originalPhoto}
                          alt={`Original photo ${index + 1}`}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Original
                        </span>
                      </div>

                      {/* Coloring page or skeleton */}
                      <div className="relative bg-muted">
                        {page.status === "done" && page.coloringImage ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={page.coloringImage}
                              alt={`Coloring page ${index + 1}`}
                              className="w-full aspect-[2/3] object-cover"
                            />
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              Coloring Page
                            </span>
                          </>
                        ) : page.status === "error" ? (
                          <div className="w-full aspect-[2/3] flex items-center justify-center p-2">
                            <p className="text-xs text-destructive text-center">
                              {page.error || "Failed"}
                            </p>
                          </div>
                        ) : page.status === "generating" ? (
                          <div className="w-full aspect-[2/3] flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Generating…
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Skeleton className="w-full aspect-[2/3] rounded-none" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Continue to Preview */}
            {!generating && completedCount > 0 && (
              <Button
                className="w-full transition-all duration-200"
                size="lg"
                onClick={handleContinueToPreview}
              >
                <BookOpen className="size-4" />
                Continue to Book Preview ({completedCount} page
                {completedCount !== 1 ? "s" : ""})
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-2 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by OpenAI &middot; Photos are never stored
          </p>
        </footer>
      </div>
    </div>
  );
}
