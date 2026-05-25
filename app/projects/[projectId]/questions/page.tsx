import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate } from "@/lib/formatters";
import { requireProject } from "@/lib/data";
import { upsertQuestion, deleteQuestion } from "@/app/actions/questions";
import { Plus, HelpCircle, CheckCircle2 } from "lucide-react";

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: questions }, { data: rooms }, { data: vendors }] = await Promise.all([
    supabase
      .from("questions")
      .select("id,question,answer,status,assignee_type,assignee_name,room_id,vendor_id,due_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = questions ?? [];
  const roomList = rooms ?? [];
  const vendorList = vendors ?? [];

  const open = list.filter((q) => q.status !== "CLOSED");
  const closed = list.filter((q) => q.status === "CLOSED");

  async function addQuestion(formData: FormData) {
    "use server";
    await upsertQuestion(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Pytania"
        description={`${open.length} otwartych, ${closed.length} zamkniętych`}
      />

      {/* Add form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj pytanie</h2>
        <form action={addQuestion} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pytanie *" className="sm:col-span-2 lg:col-span-3">
            <Textarea name="question" required rows={2} placeholder="np. Jakie gniazdka wybrać do kuchni?" />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="OPEN">
              {Object.entries(labels.questionStatus).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pomieszczenie">
            <Select name="room_id" defaultValue="">
              <option value="">— brak —</option>
              {roomList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Wykonawca">
            <Select name="vendor_id" defaultValue="">
              <option value="">— brak —</option>
              {vendorList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Do kogo skierowane">
            <Input name="assignee_name" placeholder="np. Projektant, Jan Kowalski" />
          </Field>
          <Field label="Termin odpowiedzi">
            <Input name="due_date" type="date" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj pytanie
            </Button>
          </div>
        </form>
      </Card>

      {/* Questions */}
      {!list.length ? (
        <EmptyState title="Brak pytań" description="Dodaj pierwsze pytanie powyżej." className="mt-6" />
      ) : (
        <div className="mt-6 space-y-3">
          {open.map((q) => {
            const roomName = roomList.find((r) => r.id === q.room_id)?.name;
            const vendorName = vendorList.find((v) => v.id === q.vendor_id)?.name;
            return (
              <Card key={q.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="font-medium text-sm">{q.question}</p>
                  </div>
                  <Badge variant={statusVariant(q.status)}>
                    {labelFor(labels.questionStatus, q.status)}
                  </Badge>
                </div>
                {q.answer && (
                  <div className="mt-2 rounded-md bg-green-50 border border-green-200 p-2">
                    <p className="text-sm text-green-800">{q.answer}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {roomName && <Badge variant="gray">{roomName}</Badge>}
                  {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                  {q.assignee_name && <Badge variant="gray">→ {q.assignee_name}</Badge>}
                  {q.due_date && (
                    <span className="text-xs text-muted-foreground">Termin: {formatDate(q.due_date)}</span>
                  )}
                </div>
                <div className="mt-2">
                  <DeleteButton
                    action={deleteQuestion.bind(null, projectId)}
                    id={q.id}
                    confirmMessage={`Usuń pytanie?`}
                    size="sm"
                  />
                </div>
              </Card>
            );
          })}

          {closed.length > 0 && (
            <div className="pt-4">
              <h2 className="font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Zamknięte ({closed.length})
              </h2>
              <div className="space-y-2">
                {closed.map((q) => (
                  <div key={q.id} className="rounded-md border border-border p-3 opacity-60">
                    <p className="text-sm text-muted-foreground">{q.question}</p>
                    {q.answer && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{q.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
