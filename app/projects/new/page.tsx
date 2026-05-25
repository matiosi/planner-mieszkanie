import { createProject } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";

export default function NewProjectPage() {
  return (
    <AppShell>
      <PageHeader title="Nowy projekt" description="Podaj podstawowe dane mieszkania." />
      <Card className="mt-6 max-w-2xl">
        <form action={createProject} className="grid gap-4">
          <Field label="Nazwa">
            <input className={inputClass} name="name" required placeholder="Mieszkanie B2-C134" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Metraż">
              <input className={inputClass} name="area" type="number" step="0.01" placeholder="81.52" />
            </Field>
            <Field label="Budżet docelowy">
              <input className={inputClass} name="target_budget" type="number" step="1" placeholder="180000" />
            </Field>
          </div>
          <Field label="Styl">
            <input className={inputClass} name="style" placeholder="Japandi, jasne kolory" />
          </Field>
          <Field label="Etap">
            <select className={inputClass} name="stage" defaultValue="PLANNING">
              <option value="PLANNING">Planowanie</option>
              <option value="CONCEPT">Koncepcja</option>
              <option value="QUOTES">Wyceny</option>
              <option value="IN_PROGRESS">W trakcie</option>
              <option value="FINISHING">Wykończenie</option>
              <option value="DONE">Gotowe</option>
            </select>
          </Field>
          <Field label="Opis">
            <textarea className={inputClass} name="description" rows={4} />
          </Field>
          <Button>Utwórz projekt</Button>
        </form>
      </Card>
    </AppShell>
  );
}
