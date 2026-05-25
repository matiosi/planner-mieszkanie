"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PaintCalculator({ projectId }: { projectId: string }) {
  const [wallArea, setWallArea] = useState("");
  const [coats, setCoats] = useState("2");
  const [coverage, setCoverage] = useState("10");
  const [canSize, setCanSize] = useState("");
  const [result, setResult] = useState<{ liters: number; cans?: number } | null>(null);

  function calculate() {
    const areaNum = parseFloat(wallArea);
    const coatsNum = parseInt(coats);
    const coverageNum = parseFloat(coverage); // m² per liter
    const canSizeNum = parseFloat(canSize);

    if (isNaN(areaNum) || areaNum <= 0) return;

    const liters = (areaNum * coatsNum) / coverageNum;
    const cans = canSizeNum > 0 ? Math.ceil(liters / canSizeNum) : undefined;

    setResult({ liters, cans });
  }

  return (
    <Card>
      <h2 className="font-semibold mb-4">🎨 Farba</h2>
      <div className="space-y-3">
        <Field label="Powierzchnia ścian (m²)">
          <Input
            type="number"
            step="0.01"
            value={wallArea}
            onChange={(e) => setWallArea(e.target.value)}
            placeholder="np. 45"
          />
        </Field>
        <Field label="Liczba warstw">
          <Input
            type="number"
            value={coats}
            onChange={(e) => setCoats(e.target.value)}
            placeholder="2"
          />
        </Field>
        <Field label="Wydajność farby (m²/litr)">
          <Input
            type="number"
            step="0.1"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            placeholder="10"
          />
        </Field>
        <Field label="Pojemność opakowania (l) — opcjonalnie">
          <Input
            type="number"
            step="0.1"
            value={canSize}
            onChange={(e) => setCanSize(e.target.value)}
            placeholder="np. 2.5"
          />
        </Field>
        <Button type="button" onClick={calculate} size="sm">
          Oblicz
        </Button>

        {result && (
          <div className="mt-3 rounded-md bg-muted p-3 space-y-1">
            <p className="text-sm">
              Potrzeba farby: <strong>{result.liters.toFixed(1)} l</strong>
            </p>
            {result.cans && canSize && (
              <p className="text-sm">
                Opakowania ({canSize} l/szt.): <strong>{result.cans} szt.</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
