"use client";

import { useState } from "react";
import { PhotoUpload } from "@/components/photo-upload";
import { AgeSelector } from "@/components/age-selector";

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [age, setAge] = useState(3);

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
      </main>
    </div>
  );
}
