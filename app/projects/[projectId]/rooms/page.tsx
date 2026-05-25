import Link from "next/link";
import { deleteRow, upsertRoom } from "@/app/actions";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { formatCurrency, numberFormatter } from "@/lib/formatters";
import { labelFor, labels } from "@/lib/labels";
import { getRooms } from "@/lib/data";

export default async function RoomsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const rooms = await getRooms(projectId);

  return (
    <>
      <PageHeader title="Pomieszczenia" description="Lista pokoi z budżetem, statusem i notatkami koncepcyjnymi." />
      <Card className="mt-6">
        <form action={upsertRoom.bind(null, projectId)} className="grid gap-3 md:grid-cols-6">
          <Field label="Nazwa"><input className={inputClass} name="name" required /></Field>
          <Field label="Metraż"><input className={inputClass} name="area" type="number" step="0.01" /></Field>
          <Field label="Status"><select className={inputClass} name="status"><option value="NOT_STARTED">Nierozpoczęte</option><option value="CONCEPT">Koncepcja</option><option value="PRICING">Wycena</option><option value="ORDERING">Zamówienia</option><option value="IN_PROGRESS">W trakcie</option><option value="DONE">Gotowe</option></select></Field>
          <Field label="Budżet"><input className={inputClass} name="budget_planned" type="number" /></Field>
          <Field label="Koncepcja"><input className={inputClass} name="concept_description" /></Field>
          <div className="flex items-end"><Button className="w-full">Dodaj</Button></div>
        </form>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id}>
            <div className="flex items-start justify-between gap-3">
              <Link href={`/projects/${projectId}/rooms/${room.id}`} className="text-lg font-semibold hover:text-primary">{room.name}</Link>
              <Badge>{labelFor(labels.roomStatus, room.status)}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{room.concept_description || "Brak opisu koncepcji"}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <span>Metraż: {room.area ? `${numberFormatter.format(room.area)} m²` : "Brak"}</span>
              <span>Budżet: {formatCurrency(room.budget_planned)}</span>
            </div>
            <form action={deleteRow.bind(null, projectId, "rooms", "/rooms")} className="mt-4">
              <input type="hidden" name="id" value={room.id} />
              <Button variant="danger">Usuń</Button>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
