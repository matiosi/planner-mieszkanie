import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteUrl = getPublicSiteUrl(request.headers);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/projects";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sprawdź czy user ma oczekujące zaproszenia
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: invitations } = await supabase
          .from("pending_invitations")
          .select("id,project_id,role")
          .eq("email", user.email.toLowerCase());

        if (invitations && invitations.length > 0) {
          for (const inv of invitations) {
            await supabase.from("project_members").insert({
              project_id: inv.project_id,
              user_id: user.id,
              role: inv.role,
            });
            await supabase.from("pending_invitations").delete().eq("id", inv.id);
          }
        }
      }

      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}
