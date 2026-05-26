import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/env";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", getPublicSiteUrl()), {
    status: 302,
  });
}
