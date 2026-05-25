"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { deleteInspiration, toggleSelectedForDesigner } from "@/app/actions/inspirations";
import { labelFor, labels } from "@/lib/labels";
import { Image as ImageIcon, Link as LinkIcon, Star, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Inspiration {
  id: string;
  title: string;
  source: string;
  category: string | null;
  external_url: string | null;
  designer_note: string | null;
  selected_for_designer: boolean;
  room_id: string | null;
  displayUrl: string | null;
}

interface Room {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  inspirations: Inspiration[];
  roomList: Room[];
}

export function InspirationGallery({ projectId, inspirations, roomList }: Props) {
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const activeIndex = inspirations.findIndex((i) => i.id === lightboxId);
  const active = activeIndex >= 0 ? inspirations[activeIndex] : null;

  const openLightbox = (id: string) => setLightboxId(id);
  const closeLightbox = () => setLightboxId(null);

  const prev = useCallback(() => {
    if (activeIndex > 0) setLightboxId(inspirations[activeIndex - 1].id);
  }, [activeIndex, inspirations]);

  const next = useCallback(() => {
    if (activeIndex < inspirations.length - 1) setLightboxId(inspirations[activeIndex + 1].id);
  }, [activeIndex, inspirations]);

  useEffect(() => {
    if (!lightboxId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxId, prev, next]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    if (lightboxId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxId]);

  if (!inspirations.length) return null;

  return (
    <>
      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {inspirations.map((insp) => {
          const roomName = roomList.find((r) => r.id === insp.room_id)?.name;
          return (
            <div key={insp.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Obraz — klikalny */}
              <button
                onClick={() => openLightbox(insp.id)}
                className="relative aspect-video bg-muted w-full block hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Podgląd: ${insp.title}`}
              >
                {insp.displayUrl ? (
                  <img
                    src={insp.displayUrl}
                    alt={insp.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                {insp.selected_for_designer && (
                  <div className="absolute top-2 right-2 rounded-full bg-amber-400 p-1">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                )}
                {insp.displayUrl && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/50 rounded px-2 py-1 transition-opacity">
                      Powiększ
                    </span>
                  </div>
                )}
              </button>

              {/* Info */}
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium leading-snug">{insp.title}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="gray">{labelFor(labels.inspirationSource, insp.source)}</Badge>
                  {roomName && <Badge variant="gray">{roomName}</Badge>}
                  {insp.category && <Badge variant="gray">{insp.category}</Badge>}
                </div>
                {insp.designer_note && (
                  <p className="text-xs text-muted-foreground italic">&quot;{insp.designer_note}&quot;</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <form action={async (fd: FormData) => {
                    fd.set("id", insp.id);
                    fd.set("selected", insp.selected_for_designer ? "false" : "true");
                    await toggleSelectedForDesigner(projectId, fd);
                  }}>
                    <Button type="submit" variant="ghost" size="sm" className="text-xs">
                      {insp.selected_for_designer ? "Odznacz" : "Wybierz ★"}
                    </Button>
                  </form>
                  {insp.external_url && (
                    <a href={insp.external_url} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="ghost" size="sm" className="text-xs">
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  <DeleteButton
                    action={deleteInspiration.bind(null, projectId)}
                    id={insp.id}
                    confirmMessage={`Usuń inspirację "${insp.title}"?`}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Prev */}
          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              aria-label="Poprzednie"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next */}
          {activeIndex < inspirations.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              aria-label="Następne"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div
            className="flex flex-col items-center max-w-5xl w-full max-h-[95vh] gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {active.displayUrl ? (
              <img
                src={active.displayUrl}
                alt={active.title}
                className="max-h-[75vh] max-w-full object-contain rounded-md"
              />
            ) : (
              <div className="flex items-center justify-center h-64 w-full bg-white/5 rounded-md text-white/40">
                <ImageIcon className="h-16 w-16" />
              </div>
            )}

            <div className="text-center text-white space-y-1 max-w-lg">
              <p className="font-semibold text-lg">{active.title}</p>
              {active.designer_note && (
                <p className="text-sm text-white/70 italic">&quot;{active.designer_note}&quot;</p>
              )}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {active.category && (
                  <span className="text-xs text-white/50">{active.category}</span>
                )}
                {active.external_url && (
                  <a
                    href={active.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-3 w-3" /> Otwórz źródło
                  </a>
                )}
                <span className="text-xs text-white/30">
                  {activeIndex + 1} / {inspirations.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
