import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes } from "react";
import { inputClass } from "./input";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, "cursor-pointer", className)} {...props} />;
}
