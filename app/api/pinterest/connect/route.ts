import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const projectId = searchParams.get("projectId") ?? "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const clientId = process.env.PINTEREST_CLIENT_ID;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI ?? `${origin}/api/pinterest/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Pinterest nie jest skonfigurowany." }, { status: 500 });
  }

  const state = encodeURIComponent(JSON.stringify({ projectId, userId: user.id }));
  const oauthUrl = new URL("https://www.pinterest.com/oauth/");
  oauthUrl.searchParams.set("client_id", clientId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("scope", "boards:read,pins:read");
  oauthUrl.searchParams.set("state", state);

  return NextResponse.redirect(oauthUrl.toString());
}
