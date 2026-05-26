"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { labelFor, labels } from "@/lib/labels";

interface ScheduleItem {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  room_id: string | null;
  description?: string | null;
}

interface Room { id: string; name: string }

interface Props {
  items: ScheduleItem[];
  roomList: Room[];
}

const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-green-500",
  IN_PROGRESS: "bg-blue-500",
  DELAYED: "bg-amber-500",
  PLANNED: "bg-slate-400",
  CANCELLED: "bg-slate-300 opacity-50",
};

function parseDate(s: string) {
  return new Date(s + "T00:00:00");
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatMonth(d: Date) {
  return d.toLocaleDateString("pl-PL", { month: "short", year: "numeric" });
}

export function ScheduleGantt({ items, roomList }: Props) {
  // Tylko etapy z datami
  const dated = items.filter((i) => i.start_date && i.end_date);

  const { minDate, maxDate, totalDays, months } = useMemo(() => {
    if (!dated.length) return { minDate: new Date(), maxDate: new Date(), totalDays: 1, months: [] };

    const starts = dated.map((i) => parseDate(i.start_date!));
    const ends = dated.map((i) => parseDate(i.end_date!));

    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));

    // Dodaj margines
    min.setDate(1); // pierwszy dzień miesiąca
    max.setMonth(max.getMonth() + 1, 0); // ostatni dzień miesiąca

    const total = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / 86400000));

    // Wygeneruj nagłówki miesięcy
    const monthHeaders: { label: string; widthPct: number }[] = [];
    let cursor = new Date(min);
    while (cursor <= max) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const visibleStart = monthStart < min ? min : monthStart;
      const visibleEnd = monthEnd > max ? max : monthEnd;
      const days = Math.ceil((visibleEnd.getTime() - visibleStart.getTime()) / 86400000) + 1;
      monthHeaders.push({ label: formatMonth(monthStart), widthPct: (days / total) * 100 });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    return { minDate: min, maxDate: max, totalDays: total, months: monthHeaders };
  }, [dated]);

  const noDateItems = items.filter((i) => !i.start_date || !i.end_date);

  if (!dated.length) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Brak etapów z datami. Dodaj daty rozpoczęcia i zakończenia, żeby zobaczyć Gantt.
      </div>
    );
  }

  function pct(d: Date) {
    return Math.max(0, Math.min(100, ((d.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100));
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Nagłówek miesięcy */}
        <div className="flex border-b border-border mb-1">
          <div className="w-40 shrink-0" />
          <div className="flex-1 flex">
            {months.map((m, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground font-medium px-1 border-l border-border first:border-l-0"
                style={{ width: `${m.widthPct}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Wiersze */}
        <div className="space-y-1">
          {dated.map((item) => {
            const start = parseDate(item.start_date!);
            const end = parseDate(item.end_date!);
            const endInclusive = addDays(end, 1);
            const leftPct = pct(start);
            const widthPct = Math.max(0.5, pct(endInclusive) - leftPct);
            const color = STATUS_COLORS[item.status] ?? "bg-slate-400";
            const roomName = roomList.find((r) => r.id === item.room_id)?.name;

            return (
              <div key={item.id} className="flex items-center gap-2 group">
                {/* Nazwa */}
                <div className="w-40 shrink-0 pr-2">
                  <p className="text-xs font-medium truncate" title={item.title}>{item.title}</p>
                  {roomName && <p className="text-[10px] text-muted-foreground truncate">{roomName}</p>}
                </div>

                {/* Pasek */}
                <div className="flex-1 relative h-7">
                  {/* Tło siatki */}
                  <div className="absolute inset-0 flex">
                    {months.map((m, i) => (
                      <div key={i} className="border-l border-border/30 first:border-l-0" style={{ width: `${m.widthPct}%` }} />
                    ))}
                  </div>

                  {/* Pasek zadania */}
                  <div
                    className={`absolute top-1 bottom-1 rounded ${color} flex items-center px-1.5 min-w-[4px]`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${item.title} • ${labelFor(labels.scheduleStatus, item.status)}`}
                  >
                    <span className="text-[10px] text-white font-medium truncate hidden group-hover:block">
                      {labelFor(labels.scheduleStatus, item.status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-border">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`h-2.5 w-5 rounded-sm ${color}`} />
              {labelFor(labels.scheduleStatus, status)}
            </div>
          ))}
        </div>

        {/* Etapy bez dat */}
        {noDateItems.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Bez dat ({noDateItems.length}):</p>
            <div className="flex flex-wrap gap-2">
              {noDateItems.map((i) => (
                <Badge key={i.id} variant="gray">{i.title}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
