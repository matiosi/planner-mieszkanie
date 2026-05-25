"use client";

import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";

function PlanPane({ title, url }: { title: string; url: string | null }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3 font-semibold text-sm">{title}</div>
      {url ? (
        <TransformWrapper initialScale={1} minScale={0.3} maxScale={5}>
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              <div className="flex flex-wrap gap-2 border-b border-border p-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => zoomIn()}>Przybliż +</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => zoomOut()}>Oddal −</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => resetTransform()}>Reset</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => centerView()}>Dopasuj</Button>
              </div>
              <TransformComponent wrapperClass="!h-[540px] !w-full bg-muted" contentClass="!w-full !h-full">
                <img src={url} alt={title} className="h-full w-full object-contain" />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : (
        <div className="flex h-[540px] items-center justify-center bg-muted text-sm text-muted-foreground">
          Brak przesłanego planu.
        </div>
      )}
    </div>
  );
}

export function PlanComparison({
  originalUrl,
  designerUrl,
}: {
  originalUrl: string | null;
  designerUrl: string | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PlanPane title="Plan pierwotny" url={originalUrl} />
      <PlanPane title="Plan projektanta" url={designerUrl} />
    </div>
  );
}
