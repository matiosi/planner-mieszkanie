"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const MAX_SCANS_PER_UPLOAD = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionForMime(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function titleForScan(baseTitle: string, fileName: string, index: number, total: number) {
  if (baseTitle) return total > 1 ? `${baseTitle} — strona ${index + 1}` : baseTitle;
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return nameWithoutExtension || `Ankieta — strona ${index + 1}`;
}

interface Props {
  projectId: string;
  rooms: { id: string; name: string }[];
}

export function SurveyScanUploadForm({ projectId, rooms }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadScans(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const files = formData
      .getAll("files")
      .filter((value): value is File => typeof value !== "string" && value.size > 0);
    if (!files.length) return setError("Wybierz co najmniej jedno zdjęcie ankiety.");
    if (files.length > MAX_SCANS_PER_UPLOAD) {
      return setError(`Możesz dodać maksymalnie ${MAX_SCANS_PER_UPLOAD} zdjęć naraz.`);
    }
    if (files.some((file) => !ALLOWED_TYPES.includes(file.type))) {
      return setError("Dozwolone są pliki JPG, PNG i WEBP.");
    }
    if (files.some((file) => file.size > MAX_FILE_BYTES)) {
      return setError("Każde zdjęcie może mieć maksymalnie 10 MB.");
    }

    setPending(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setPending(false);
      setError("Sesja wygasła. Odśwież stronę i zaloguj się ponownie.");
      return;
    }

    const baseTitle = String(formData.get("title") ?? "").trim();
    const roomId = String(formData.get("room_id") ?? "").trim() || null;
    const storageBucket = "survey-scans";
    const uploadedPaths: string[] = [];

    try {
      const rows = [];
      for (const [index, file] of files.entries()) {
        const storagePath = `users/${user.id}/projects/${projectId}/survey-scans/${crypto.randomUUID()}.${extensionForMime(file.type)}`;
        const { error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        uploadedPaths.push(storagePath);
        rows.push({
          project_id: projectId,
          room_id: roomId,
          title: titleForScan(baseTitle, file.name, index, files.length),
          storage_bucket: storageBucket,
          storage_path: storagePath,
          mime_type: file.type,
          original_file_name: file.name,
        });
      }

      const { error: insertError } = await supabase.from("survey_scans").insert(rows);
      if (insertError) throw new Error(insertError.message);

      formRef.current?.reset();
      setSuccess(`Dodano ${files.length} ${files.length === 1 ? "zdjęcie" : files.length < 5 ? "zdjęcia" : "zdjęć"} ankiety.`);
      router.refresh();
    } catch (uploadError) {
      if (uploadedPaths.length) await supabase.storage.from(storageBucket).remove(uploadedPaths);
      setError(uploadError instanceof Error ? uploadError.message : "Nie udało się dodać zdjęć ankiety.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={uploadScans} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Tytuł (opcjonalnie)">
        <Input name="title" placeholder="np. Ankieta remontowa" />
      </Field>
      <Field label="Pomieszczenie">
        <Select name="room_id" defaultValue="">
          <option value="">Wszystkie PDF-y briefu</option>
          {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
        </Select>
      </Field>
      <Field
        label="Zdjęcia ankiety *"
        hint="Wybierz do 20 zdjęć naraz, maks. 10 MB każde."
        className="sm:col-span-2"
      >
        <Input name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
          <ScanLine className={pending ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
          {pending ? "Dodawanie…" : "Dodaj zdjęcia ankiety"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="sm:col-span-2 lg:col-span-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="sm:col-span-2 lg:col-span-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}
    </form>
  );
}
