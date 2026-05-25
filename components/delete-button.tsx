"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage?: string;
  label?: string;
  size?: "sm" | "md";
}

export function DeleteButton({
  action,
  id,
  confirmMessage = "Czy na pewno chcesz usunąć ten element?",
  label = "Usuń",
  size = "sm",
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <Button type="button" variant="danger" size={size} onClick={handleClick} disabled={isPending}>
      {isPending ? "Usuwanie…" : label}
    </Button>
  );
}
