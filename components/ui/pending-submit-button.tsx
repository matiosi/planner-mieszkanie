"use client";

import { useFormStatus } from "react-dom";
import { type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";

interface PendingSubmitButtonProps extends ButtonProps {
  pendingLabel?: ReactNode;
}

export function PendingSubmitButton({
  children,
  disabled,
  pendingLabel = "Zapisywanie…",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
