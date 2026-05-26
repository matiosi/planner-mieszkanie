import { AppShell } from "@/components/app-shell";
import { LibraryTabs } from "@/components/library-tabs";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <LibraryTabs />
      {children}
    </AppShell>
  );
}
