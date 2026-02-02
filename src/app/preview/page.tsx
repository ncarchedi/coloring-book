"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { useColoringBook } from "@/context/coloring-book-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUp,
  ArrowDown,
  Download,
  FileDown,
  Trash2,
} from "lucide-react";

export default function BookPreview() {
  const { title, pages, setTitle, removePage, reorderPages } =
    useColoringBook();

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) reorderPages(index, index - 1);
    },
    [reorderPages]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < pages.length - 1) reorderPages(index, index + 1);
    },
    [reorderPages, pages.length]
  );

  const buildPdf = useCallback((): Promise<jsPDF> => {
    return new Promise((resolve) => {
      let loaded = 0;
      const images: { img: HTMLImageElement; src: string }[] = [];

      pages.forEach((page, i) => {
        const img = new Image();
        img.onload = () => {
          images[i] = { img, src: page.image };
          loaded++;
          if (loaded === pages.length) {
            const pdf = new jsPDF({ unit: "in", format: "letter" });

            if (title.trim()) {
              const coverW = pdf.internal.pageSize.getWidth();
              const coverH = pdf.internal.pageSize.getHeight();
              pdf.setFontSize(36);
              pdf.text(title.trim(), coverW / 2, coverH / 2, {
                align: "center",
              });
              pdf.setFontSize(14);
              pdf.setTextColor(128);
              pdf.text("A Coloring Book", coverW / 2, coverH / 2 + 0.6, {
                align: "center",
              });
              pdf.setTextColor(0);
            }

            images.forEach(({ img: im, src }, idx) => {
              if (idx > 0 || title.trim()) {
                const land = im.width > im.height;
                pdf.addPage("letter", land ? "landscape" : "portrait");
              }
              const pageW = pdf.internal.pageSize.getWidth();
              const pageH = pdf.internal.pageSize.getHeight();
              const margin = 0.5;
              const printW = pageW - margin * 2;
              const printH = pageH - margin * 2;
              const scale = Math.min(printW / im.width, printH / im.height);
              const w = im.width * scale;
              const h = im.height * scale;
              const x = (pageW - w) / 2;
              const y = (pageH - h) / 2;
              pdf.addImage(src, "PNG", x, y, w, h);
            });

            resolve(pdf);
          }
        };
        img.src = page.image;
      });
    });
  }, [pages, title]);

  const handleExportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    const pdf = await buildPdf();
    pdf.save(
      title.trim()
        ? `${title.trim().toLowerCase().replace(/\s+/g, "-")}.pdf`
        : "coloring-book.pdf"
    );
  }, [pages, title, buildPdf]);

  if (pages.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            No pages yet. Generate some coloring pages first!
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        {/* Page Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Book Preview
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Reorder, remove pages, and export your coloring book
          </p>
        </div>

        {/* Book Title */}
        <Card>
          <CardContent className="space-y-2">
            <Label htmlFor="book-title" className="text-sm font-medium">
              Book Title (optional)
            </Label>
            <Input
              id="book-title"
              placeholder="My Coloring Book"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Appears as a cover page in the exported PDF
            </p>
          </CardContent>
        </Card>

        {/* Pages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleExportPdf}
                className="transition-all duration-200"
              >
                <FileDown className="size-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pages.map((page, index) => (
              <Card
                key={`${index}-${page.image.slice(-20)}`}
                className="group relative overflow-hidden py-0"
              >
                <CardContent className="p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.image}
                    alt={`Page ${index + 1}`}
                    className="w-full aspect-square object-contain bg-white"
                  />
                  {/* Page number */}
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      Page {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 px-1.5 text-xs"
                    >
                      <a
                        href={page.image}
                        download={`coloring-page-${index + 1}.png`}
                      >
                        <Download className="size-3" />
                        PNG
                      </a>
                    </Button>
                  </div>
                  {/* Hover controls */}
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {index > 0 && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMoveUp(index)}
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                    )}
                    {index < pages.length - 1 && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMoveDown(index)}
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-7"
                      onClick={() => removePage(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
