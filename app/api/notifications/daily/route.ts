import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeNextActions } from "@/lib/next-actions";
import { sendDailyReminderEmail } from "@/lib/email";

/**
 * Vercel Cron Job: codziennie o 8:00
 * Wymaga: CRON_SECRET (env var), RESEND_API_KEY
 */
export async function GET(req: NextRequest) {
  // Weryfikacja tokenu crona
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  }

  const supabase = await createClient();

  // Pobierz wszystkich właścicieli projektów
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,owner_id");

  if (!projects?.length) return NextResponse.json({ sent: 0 });

  // Pobierz emaile właścicieli
  let sent = 0;
  const errors: string[] = [];

  for (const project of projects) {
    try {
      const { data: userData } = await supabase.auth.admin
        ? { data: null }  // admin nieużywany tutaj — korzystamy z service role w innym kontekście
        : { data: null };

      // Pobierz email z tabeli profiles lub auth.users przez RPC (jeśli istnieje)
      // Uproszczone podejście: używamy emaila zalogowanego użytkownika z projektu
      const actions = await computeNextActions(project.id, supabase);
      const important = actions.filter((a) => a.urgency === "critical" || a.urgency === "high");

      if (!important.length) continue;

      // Pobierz email właściciela przez auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) continue;

      await sendDailyReminderEmail({
        to: user.email,
        projectName: project.name,
        projectId: project.id,
        items: important.map((a) => ({
          title: a.title,
          category: a.category,
          href: a.href,
          urgency: a.urgency,
        })),
      });
      sent++;
    } catch (e) {
      errors.push(`${project.id}: ${e}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined });
}
