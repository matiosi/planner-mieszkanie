"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TilesCalculator({ projectId }: { projectId: string }) {
  const [area, setArea] = useState("");
  const [tileW, setTileW] = useState("");
  const [tileH, setTileH] = useState("");
  const [waste, setWaste] = useState("15");
  const [result, setResult] = useState<{ total: number; pieces: number } | null>(null);

  function calculate() {
    const areaNum = parseFloat(area);
    const tileWNum = parseFloat(tileW) / 100; // cm → m
    const tileHNum = parseFloat(tileH) / 100;
    const wasteNum = parseFloat(waste) / 100;

    if (isNaN(areaNum) || areaNum <= 0) return;
    if (isNaN(tileWNum) || tileWNum <= 0 || isNaN(tileHNum) || tileHNum <= 0) {
      setResult({ total: areaNum * (1 + wasteNum), pieces: 0 });
      return;
    }

    const totalArea = areaNum * (1 + wasteNum);
    const tileArea = tileWNum * tileHNum;
    const pieces = Math.ceil(totalArea / tileArea);

    setResult({ total: totalArea, pieces });
  }

  return (
    <Card>
      <h2 className="font-semibold mb-4">🔲 Płytki / Kafelki</h2>
      <div className="space-y-3">
        <Field label="Powierzchnia (m²)">
          <Input
            type="number"
            step="0.01"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="np. 8.5"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Szerokość płytki (cm)">
            <Input
              type="number"
              value={tileW}
              onChange={(e) => setTileW(e.target.value)}
              placeholder="np. 60"
            />
          </Field>
          <Field label="Wysokość płytki (cm)">
            <Input
              type="number"
              value={tileH}
              onChange={(e) => setTileH(e.target.value)}
              placeholder="np. 120"
            />
          </Field>
        </div>
        <Field label="Naddatek (%)">
          <Input
            type="number"
            value={waste}
            onChange={(e) => setWaste(e.target.value)}
            placeholder="15"
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
            {result.pieces > 0 && (
              <p className="text-sm">
                Liczba płytek: <strong>{result.pieces} szt.</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
