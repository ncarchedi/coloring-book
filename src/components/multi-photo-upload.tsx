"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  ImageIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface MultiPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function MultiPhotoUpload({
  photos,
  onPhotosChange,
}: MultiPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList) => {
      const validFiles = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type)
      );
      if (validFiles.length === 0) return;

      let loaded = 0;
      const results: string[] = [];

      validFiles.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          results[i] = e.target?.result as string;
          loaded++;
          if (loaded === validFiles.length) {
            onPhotosChange([...photos, ...results]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [photos, onPhotosChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  const removePhoto = useCallback(
    (index: number) => {
      onPhotosChange(photos.filter((_, i) => i !== index));
    },
    [photos, onPhotosChange]
  );

  const movePhoto = useCallback(
    (index: number, direction: "up" | "down") => {
      const newPhotos = [...photos];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= newPhotos.length) return;
      [newPhotos[index], newPhotos[target]] = [
        newPhotos[target],
        newPhotos[index],
      ];
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  return (
    <div className="space-y-4">
      {/* Thumbnail grid of uploaded photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <Card
              key={index}
              className="relative overflow-hidden py-0 group"
            >
              <CardContent className="p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              </CardContent>
              {/* Remove button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1.5 right-1.5 size-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => removePhoto(index)}
              >
                <X className="size-3" />
              </Button>
              {/* Reorder buttons */}
              <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={() => movePhoto(index, "up")}
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-6"
                  disabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, "down")}
                >
                  <ChevronDown className="size-3" />
                </Button>
              </div>
              {/* Index label */}
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-xs font-medium rounded-full size-5 flex items-center justify-center">
                {index + 1}
              </span>
            </Card>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-dashed hover:border-primary/50 hover:shadow-sm"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent
          className={`flex flex-col items-center justify-center gap-3 ${
            photos.length > 0 ? "py-6" : "py-12"
          }`}
        >
          <div className="rounded-full bg-muted p-3">
            {isDragging ? (
              <Upload className="size-6 text-primary" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">
              {isDragging
                ? "Drop your photos here"
                : photos.length > 0
                ? "Add more photos"
                : "Drag & drop photos"}
            </p>
            <p className="text-xs text-muted-foreground">
              Select multiple files — JPG, PNG, WebP
            </p>
          </div>
        </CardContent>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </Card>
    </div>
  );
}
