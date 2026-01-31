"use client";

import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

function getComplexityLabel(age: number): { label: string; description: string } {
  if (age <= 4) {
    return { label: "Simple", description: "Large shapes, thick lines, few elements" };
  }
  if (age <= 7) {
    return { label: "Medium", description: "Moderate detail, some small elements" };
  }
  return { label: "Detailed", description: "Fine lines, complex scenes, many elements" };
}

interface AgeSelectorProps {
  age: number;
  onAgeChange: (age: number) => void;
}

export function AgeSelector({ age, onAgeChange }: AgeSelectorProps) {
  const complexity = getComplexityLabel(age);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="age-slider" className="text-sm font-medium">
            Child&apos;s Age
          </Label>
          <div className="text-right">
            <span className="text-2xl font-bold">{age}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              {complexity.label}
            </span>
          </div>
        </div>

        <Slider
          id="age-slider"
          min={1}
          max={12}
          step={1}
          value={[age]}
          onValueChange={([v]) => onAgeChange(v)}
        />

        <p className="text-xs text-muted-foreground">{complexity.description}</p>
      </CardContent>
    </Card>
  );
}
