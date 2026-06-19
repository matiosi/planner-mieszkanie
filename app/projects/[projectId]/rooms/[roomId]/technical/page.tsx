import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireProjectAccess } from "@/lib/data";
import { upsertRoomTechnicalDetails } from "@/app/actions/technical";
import { ArrowLeft, Ruler } from "lucide-react";

export default async function RoomTechnicalPage({
  params,
}: {
  params: Promise<{ projectId: string; roomId: string }>;
}) {
  const { projectId, roomId } = await params;
  const { supabase } = await requireProjectAccess(projectId);
  const [{ data: room }, { data: technical }] = await Promise.all([
    supabase.from("rooms").select("id,name").eq("id", roomId).eq("project_id", projectId).single(),
    supabase.from("room_technical_details").select("*").eq("project_id", projectId).eq("room_id", roomId).maybeSingle(),
  ]);
  if (!room) notFound();

  return (
    <>
      <PageHeader
        title={`Karta techniczna: ${room.name}`}
        description="Dane do kalkulatorów, briefów i paczki wykonawcy."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${projectId}/rooms/${roomId}`}>
              <ArrowLeft className="h-4 w-4" /> Wróć
            </Link>
          </Button>
        }
      />

      <Card className="mt-6">
        <form action={upsertRoomTechnicalDetails.bind(null, projectId, roomId)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Wysokość sufitu (cm)">
            <Input name="ceiling_height" type="number" step="0.1" defaultValue={technical?.ceiling_height ?? ""} />
          </Field>
          <Field label="Powierzchnia podłogi (m²)">
            <Input name="flooring_area" type="number" step="0.01" defaultValue={technical?.flooring_area ?? ""} />
          </Field>
          <Field label="Powierzchnia ścian (m²)">
            <Input name="wall_area" type="number" step="0.01" defaultValue={technical?.wall_area ?? ""} />
          </Field>
          <Field label="Długość listew (mb)">
            <Input name="skirting_length" type="number" step="0.01" defaultValue={technical?.skirting_length ?? ""} />
          </Field>
          <Field label="Punkty światła">
            <Input name="number_of_light_points" type="number" step="1" defaultValue={technical?.number_of_light_points ?? ""} />
          </Field>
          <Field label="Gniazdka">
            <Input name="number_of_sockets" type="number" step="1" defaultValue={technical?.number_of_sockets ?? ""} />
          </Field>
          <Field label="Okna" className="sm:col-span-2">
            <Input name="window_dimensions" defaultValue={technical?.window_dimensions ?? ""} placeholder="np. 2x 120x150 cm" />
          </Field>
          <Field label="Drzwi" className="sm:col-span-2">
            <Input name="door_dimensions" defaultValue={technical?.door_dimensions ?? ""} placeholder="np. 90x205 cm, lewe" />
          </Field>
          <Field label="Notatki techniczne" className="sm:col-span-2 lg:col-span-4">
            <Textarea name="notes" rows={4} defaultValue={technical?.notes ?? ""} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" size="sm">
              <Ruler className="h-4 w-4" /> Zapisz kartę techniczną
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
