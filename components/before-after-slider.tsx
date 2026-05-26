"use client";

import { useState } from "react";

interface Photo {
  id: string;
  title: string | null;
  url: string;
  roomName: string | null;
  phase: string;
}

interface Props {
  before: Photo[];
  after: Photo[];
}

export function BeforeAfterSlider({ before, after }: Props) {
  const [beforeId, setBeforeId] = useState<string>(before[0]?.id ?? "");
  const [afterId, setAfterId] = useState<string>(after[0]?.id ?? "");
  const [pos, setPos] = useState(50);

  const beforePhoto = before.find((p) => p.id === beforeId) ?? before[0];
  const afterPhoto = after.find((p) => p.id === afterId) ?? after[0];

  if (!beforePhoto || !afterPhoto) {
    return (
      <p className="text-sm text-muted-foreground">
        Potrzebujesz co najmniej jednego zdjęcia z etapu „Przed" i jednego z „Po".
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selektory */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
            Przed
          </label>
          <select
            value={beforeId}
            onChange={(e) => setBeforeId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {before.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ?? "Zdjęcie"} {p.roomName ? `(${p.roomName})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
            Po
          </label>
          <select
            value={afterId}
            onChange={(e) => setAfterId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {after.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ?? "Zdjęcie"} {p.roomName ? `(${p.roomName})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slider porównania */}
      <div
        className="relative w-full overflow-hidden rounded-lg select-none"
        style={{ aspectRatio: "16/9", background: "#f3f4f6" }}
      >
        {/* Zdjęcie PO — pod spodem */}
        <img
          src={afterPhoto.url}
          alt="Po"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Zdjęcie PRZED — na górze, przycięte */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={beforePhoto.url}
            alt="Przed"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Etykiety */}
        <div className="absolute top-2 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
          PRZED
        </div>
        <div className="absolute top-2 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
          PO
        </div>

        {/* Linia podziału */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          {/* Kółko z ikonką */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 8H11M5 8L3 6M5 8L3 10M11 8L13 6M11 8L13 10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Range input */}
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="text-xs text-center text-muted-foreground">
        Przesuń suwak aby porównać
      </p>
    </div>
  );
}
