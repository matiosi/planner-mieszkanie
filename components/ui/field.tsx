import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
  error?: string;
}

export function Field({ label, children, className, hint, error }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
