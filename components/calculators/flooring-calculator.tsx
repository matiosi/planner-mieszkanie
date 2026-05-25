"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FlooringCalculator({ projectId }: { projectId: string }) {
  const [area, setArea] = useState("");
  const [waste, setWaste] = useState("10");
  const [result, setResult] = useState<{ total: number; packs?: number; packSize?: number } | null>(null);
  const [packSize, setPackSize] = useState("");

  function calculate() {
    const areaNum = parseFloat(area);
    const wasteNum = parseFloat(waste) / 100;
    const packSizeNum = parseFloat(packSize);

    if (isNaN(areaNum) || areaNum <= 0) return;

    const totalArea = areaNum * (1 + wasteNum);
    const packs = packSizeNum > 0 ? Math.ceil(totalArea / packSizeNum) : undefined;

    setResult({ total: totalArea, packs, packSize: packSizeNum || undefined });
  }

  return (
    <Card>
      <h2 className="font-semibold mb-4">🪵 Podłoga / Panele</h2>
      <div className="space-y-3">
        <Field label="Powierzchnia pomieszczenia (m²)">
          <Input
            type="number"
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="np. 20.5"
          />
        </Field>
        <Field label="Naddatek na odpady (%)">
          <Input
            type="number"
            value={waste}
            onChange={(e) => setWaste(e.target.value)}
            placeholder="10"
          />
        </Field>
        <Field label="Paczka (m²) — opcjonalnie">
          <Input
            type="number"
            step="0.01"
            value={packSize}
            onChange={(e) => setPackSize(e.target.value)}
            placeholder="np. 1.998"
          />
        </Field>
        <Button type="button" onClick={calculate} size="sm">
          Oblicz
        </Button>

        {result && (
          <div className="mt-3 rounded-md bg-muted p-3 space-y-1">
            <p className="text-sm">
              Potrzeba: <strong>{result.total.toFixed(2)} m²</strong>
            </p>
            {result.packs && result.packSize && (
              <p className="text-sm">
                Paczki ({result.packSize} m²/szt.): <strong>{result.packs} szt.</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
