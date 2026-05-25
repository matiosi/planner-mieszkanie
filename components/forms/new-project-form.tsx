"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createProject } from "@/app/actions/projects";

export function NewProjectForm() {
  const [state, action, pending] = useActionState(createProject, null);

  return (
    <Card className="mt-6 max-w-2xl">
      <form action={action} className="grid gap-4">
        {state?.error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <Field label="Nazwa projektu *">
          <Input name="name" required placeholder="np. Mieszkanie B2-C134" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Metraż (m²)">
            <Input name="area" type="number" step="0.01" placeholder="np. 65.5" />
          </Field>
          <Field label="Budżet docelowy (PLN)">
            <Input name="target_budget" type="number" step="1000" placeholder="np. 150000" />
          </Field>
        </div>
        <Field label="Styl">
          <Input name="style" placeholder="np. Skandynawski, nowoczesny" />
        </Field>
        <Field label="Etap">
          <Select name="stage" defaultValue="PLANNING">
            <option value="PLANNING">Planowanie</option>
            <option value="CONCEPT">Koncepcja</option>
            <option value="QUOTES">Wyceny</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="FINISHING">Wykończenie</option>
            <option value="DONE">Gotowe</option>
          </Select>
        </Field>
        <Field label="Rezerwa (%)">
          <Input name="contingency_percent" type="number" min="0" max="50" defaultValue="10" />
        </Field>
        <Field label="Opis">
          <Textarea name="description" rows={3} placeholder="Dodatkowe informacje o projekcie…" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Tworzenie…" : "Utwórz projekt"}
        </Button>
      </form>
    </Card>
  );
}
