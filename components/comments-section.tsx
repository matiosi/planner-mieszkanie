"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment, deleteComment } from "@/app/actions/comments";
import { Trash2, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/formatters";

interface Comment {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
}

interface Props {
  projectId: string;
  entityType: string;
  entityId: string;
  currentUserId: string;
}

export function CommentsSection({ projectId, entityType, entityId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchComments();
  }, [entityId]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set("body", body);
    fd.set("entity_type", entityType);
    fd.set("entity_id", entityId);
    startTransition(async () => {
      await createComment(projectId, fd);
      setBody("");
      await fetchComments();
    });
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteComment(projectId, fd);
      await fetchComments();
    });
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">
          Komentarze {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Ładowanie…
        </div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{c.body}</p>
                    {c.created_by === currentUserId && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                        aria-label="Usuń komentarz"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Dodaj komentarz…"
              rows={2}
              className="flex-1 text-sm"
            />
            <Button type="submit" size="sm" disabled={isPending || !body.trim()} className="self-end">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Wyślij"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
