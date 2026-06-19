import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

type FieldChildProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
  error?: string;
}

export function Field({ label, children, className, hint, error }: FieldProps) {
  const generatedId = useId();
  const inputId = `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const child = Children.only(children);
  const childElement = isValidElement<FieldChildProps>(child) ? child : null;
  const childId = childElement?.props.id ?? inputId;
  const enhancedChild = childElement
    ? cloneElement(childElement as ReactElement<FieldChildProps>, {
        id: childId,
        "aria-describedby": childElement.props["aria-describedby"] ?? describedBy,
        "aria-invalid": childElement.props["aria-invalid"] ?? !!error,
      })
    : child;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={childElement ? childId : undefined}>{label}</Label>
      {enhancedChild}
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
