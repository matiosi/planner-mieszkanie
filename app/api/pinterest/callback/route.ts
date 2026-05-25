import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/projects?pinterest_error=1`);
  }

  let projectId = "";
  try {
    const state = JSON.parse(decodeURIComponent(stateRaw ?? "{}"));
    projectId = state.projectId ?? "";
  } catch {
    return NextResponse.redirect(`${origin}/projects?pinterest_error=1`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI ?? `${origin}/api/pinterest/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/projects?pinterest_error=config`);
  }

  // Exchange code for token
  const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/projects?pinterest_error=token`);
  }

  const tokenData = await tokenRes.json();
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await supabase.from("pinterest_connections").upsert(
    {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: expiresAt,
    },
    { onConflict: "user_id" }
  );

  const redirectTo = projectId
    ? `/projects/${projectId}/inspirations/pinterest`
    : "/projects";

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
