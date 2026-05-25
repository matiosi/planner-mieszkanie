"use client";

import { useActionState, useEffect, useRef } from "react";
import { importInspirationFromUrl } from "@/app/actions/inspirations";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

interface Room { id: string; name: string }

interface Props {
  projectId: string;
  roomList: Room[];
}

export function ImportUrlForm({ projectId, roomList }: Props) {
  const [state, formAction, pending] = useActionState(
    importInspirationFromUrl.bind(null, projectId),
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Wyczyść formularz po sukcesie
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Link do strony / pina *" className="sm:col-span-2">
        <Input
          name="url"
          type="url"
          required
          placeholder="https://www.pinterest.com/pin/… lub bezpośredni link do zdjęcia"
        />
      </Field>
      <Field label="Tytuł (opcjonalnie)">
        <Input name="title" placeholder="Zostanie pobrany z og:title" />
      </Field>
      <Field label="Pomieszczenie">
        <Select name="room_id" defaultValue="">
          <option value="">— brak —</option>
          {roomList.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
      </Field>

      {state.error && (
        <div className="sm:col-span-2 lg:col-span-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="sm:col-span-2 lg:col-span-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          ✓ Inspiracja zaimportowana! Pojawi się w galerii.
        </div>
      )}

      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Pobieranie…</>
          ) : (
            <><Download className="h-4 w-4" /> Importuj z linku</>
          )}
        </Button>
      </div>
    </form>
  );
}
