"use client";

import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";

interface PhotoUploadProps {
  photo: string | null;
  onPhotoChange: (photo: string | null) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUpload({ photo, onPhotoChange }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onPhotoChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onPhotoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
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
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (photo) {
    return (
      <Card className="relative overflow-hidden py-0">
        <CardContent className="p-0">
          <img
            src={photo}
            alt="Uploaded photo"
            className="w-full rounded-xl object-contain max-h-80"
          />
        </CardContent>
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => {
            onPhotoChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        >
          <X className="size-4" />
        </Button>
      </Card>
    );
  }

  return (
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
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="rounded-full bg-muted p-4">
          {isDragging ? (
            <Upload className="size-8 text-primary" />
          ) : (
            <ImageIcon className="size-8 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="font-medium">
            {isDragging ? "Drop your photo here" : "Drag & drop a photo"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse — JPG, PNG, WebP
          </p>
        </div>
      </CardContent>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </Card>
  );
}
