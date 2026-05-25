import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/delete-button";
import { labelFor, labels, statusVariant } from "@/lib/labels";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { requireProject, signedUrl } from "@/lib/data";
import { uploadDocument, deleteDocument } from "@/app/actions/documents";
import { Plus, FileText, Download } from "lucide-react";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await requireProject(projectId);

  const [{ data: documents }, { data: rooms }, { data: vendors }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,title,type,original_file_name,mime_type,file_size,purchase_date,warranty_until,amount,invoice_number,notes,storage_bucket,storage_path,room_id,vendor_id,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("rooms").select("id,name").eq("project_id", projectId).order("sort_order"),
    supabase.from("vendors").select("id,name").eq("project_id", projectId).order("name"),
  ]);

  const list = documents ?? [];
  const roomList = rooms ?? [];
  const vendorList = vendors ?? [];

  // Generate signed URLs
  const withUrls = await Promise.all(
    list.map(async (doc) => ({
      ...doc,
      url: await signedUrl(doc.storage_bucket, doc.storage_path),
    }))
  );

  async function addDocument(formData: FormData) {
    "use server";
    await uploadDocument(projectId, formData);
  }

  return (
    <>
      <PageHeader
        title="Dokumenty"
        description={`${list.length} dokumentów`}
      />

      {/* Upload form */}
      <Card className="mt-6">
        <h2 className="font-semibold mb-4">Dodaj dokument</h2>
        <form action={addDocument} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tytuł *" className="sm:col-span-2">
            <Input name="title" required placeholder="np. Faktura za płytki" />
          </Field>
          <Field label="Typ">
            <Select name="type" defaultValue="OTHER">
              {Object.entries(labels.documentType).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Plik *">
            <Input name="file" type="file" required />
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
          <Field label="Kwota">
            <Input name="amount" type="number" step="0.01" placeholder="0.00" />
          </Field>
          <Field label="Data zakupu">
            <Input name="purchase_date" type="date" />
          </Field>
          <Field label="Gwarancja do">
            <Input name="warranty_until" type="date" />
          </Field>
          <Field label="Nr faktury">
            <Input name="invoice_number" placeholder="FV/2024/001" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" /> Dodaj dokument
            </Button>
          </div>
        </form>
      </Card>

      {/* Document list */}
      {!list.length ? (
        <EmptyState title="Brak dokumentów" description="Dodaj faktury, gwarancje i inne dokumenty." className="mt-6" />
      ) : (
        <Card className="mt-6">
          <div className="space-y-3">
            {withUrls.map((doc) => {
              const roomName = roomList.find((r) => r.id === doc.room_id)?.name;
              const vendorName = vendorList.find((v) => v.id === doc.vendor_id)?.name;
              const isImage = doc.mime_type?.startsWith("image/");
              return (
                <div key={doc.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="shrink-0 rounded-md bg-muted p-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{doc.title}</p>
                      <Badge variant={statusVariant(doc.type)}>
                        {labelFor(labels.documentType, doc.type)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roomName && <Badge variant="gray">{roomName}</Badge>}
                      {vendorName && <Badge variant="gray">{vendorName}</Badge>}
                      {doc.amount && <Badge variant="gray">{formatCurrency(doc.amount)}</Badge>}
                      {doc.warranty_until && (
                        <Badge variant="amber">Gwarancja do: {formatDate(doc.warranty_until)}</Badge>
                      )}
                    </div>
                    {doc.invoice_number && (
                      <p className="text-xs text-muted-foreground mt-0.5">Nr: {doc.invoice_number}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(doc.created_at)}</p>
                    <div className="flex gap-2 mt-2">
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.original_file_name}>
                          <Button variant="secondary" size="sm">
                            <Download className="h-3 w-3" /> Pobierz
                          </Button>
                        </a>
                      )}
                      <DeleteButton
                        action={deleteDocument.bind(null, projectId)}
                        id={doc.id}
                        confirmMessage={`Usuń dokument "${doc.title}"?`}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
