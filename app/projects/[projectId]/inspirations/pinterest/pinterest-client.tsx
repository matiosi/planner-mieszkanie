"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { disconnectPinterest } from "@/app/actions/pinterest";
import { BookImage, ExternalLink, Loader2, Import, Unlink } from "lucide-react";

interface Board {
  id: string;
  name: string;
  pin_count: number;
  media?: { image_cover_url?: string };
  description?: string;
}

interface Props {
  projectId: string;
}

export function PinterestClient({ projectId }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<Record<string, number>>({});

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pinterest/boards`);
      if (res.ok) {
        const data = await res.json();
        setConnected(true);
        setBoards(data.boards ?? []);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(boardId: string, boardName: string) {
    setImporting(boardId);
    try {
      const res = await fetch("/api/pinterest/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, boardName, projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResults((prev) => ({ ...prev, [boardId]: data.imported }));
      }
    } finally {
      setImporting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Pinterest"
        description="Importuj tablice z Pinteresta do inspiracji."
        actions={
          connected ? (
            <form action={disconnectPinterest}>
              <Button type="submit" variant="secondary" size="sm">
                <Unlink className="h-4 w-4" /> Rozłącz Pinterest
              </Button>
            </form>
          ) : null
        }
      />

      {!connected ? (
        <div className="mt-12 flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-red-50 p-6">
            <BookImage className="h-12 w-12 text-red-400" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-semibold">Połącz swoje konto Pinterest</h2>
            <p className="text-muted-foreground text-sm">
              Zaloguj się przez Pinterest, żeby importować tablice z inspiracjami.
            </p>
          </div>
          <Button asChild size="lg">
            <a href={`/api/pinterest/connect?projectId=${projectId}`}>
              <BookImage className="h-5 w-5" />
              Połącz Pinterest
            </a>
          </Button>
        </div>
      ) : boards.length === 0 ? (
        <EmptyState
          title="Brak tablic"
          description="Nie znaleziono tablic na Twoim koncie Pinterest."
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card key={board.id} className="flex flex-col gap-3">
              {board.media?.image_cover_url && (
                <img
                  src={board.media.image_cover_url}
                  alt={board.name}
                  className="h-32 w-full object-cover rounded-md -mt-1"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{board.name}</p>
                  {board.pin_count != null && (
                    <p className="text-xs text-muted-foreground">{board.pin_count} pinów</p>
                  )}
                </div>
                <a
                  href={`https://www.pinterest.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {board.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{board.description}</p>
              )}

              {importResults[board.id] != null ? (
                <Badge variant="green">✓ Zaimportowano {importResults[board.id]} pinów</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImport(board.id, board.name)}
                  disabled={importing === board.id}
                >
                  {importing === board.id ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importuję…</>
                  ) : (
                    <><Import className="h-3.5 w-3.5" /> Importuj tablicę</>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
