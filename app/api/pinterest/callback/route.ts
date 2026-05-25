import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?pinterest_error=cancelled`);
  }

  let projectId = "";
  let action = "connect";
  let next = "/projects";
  try {
    const state = JSON.parse(decodeURIComponent(stateRaw ?? "{}"));
    projectId = state.projectId ?? "";
    action = state.action ?? "connect";
    next = state.next ?? "/projects";
  } catch {
    return NextResponse.redirect(`${origin}/login?pinterest_error=state`);
  }

  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI ?? `${origin}/api/pinterest/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?pinterest_error=config`);
  }

  // Wymiana kodu na token
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
    return NextResponse.redirect(`${origin}/login?pinterest_error=token`);
  }

  const tokenData = await tokenRes.json();
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Pobierz profil Pinterest (username + id)
  const profileRes = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : null;
  const pinterestUserId: string | null = profile?.id ?? null;

  // ─── FLOW: CONNECT (łączenie tablic z zalogowanym kontem) ───────────────────
  if (action === "connect") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/login`);

    await supabase.from("pinterest_connections").upsert(
      {
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at: expiresAt,
        pinterest_user_id: pinterestUserId,
      },
      { onConflict: "user_id" }
    );

    const redirectTo = projectId
      ? `/projects/${projectId}/inspirations/pinterest`
      : "/projects";
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // ─── FLOW: LOGIN (logowanie przez Pinterest) ────────────────────────────────
  if (!pinterestUserId) {
    return NextResponse.redirect(`${origin}/login?pinterest_error=no_id`);
  }

  const admin = createAdminClient();

  // Szukamy istniejącego połączenia po Pinterest user ID
  const { data: connection } = await admin
    .from("pinterest_connections")
    .select("user_id")
    .eq("pinterest_user_id", pinterestUserId)
    .single();

  if (!connection) {
    // Brak połączenia — Pinterest nigdy nie był powiązany z żadnym kontem
    return NextResponse.redirect(`${origin}/login?pinterest_error=not_linked`);
  }

  // Pobierz email Supabase usera
  const { data: { user: supabaseUser } } = await admin.auth.admin.getUserById(connection.user_id);
  if (!supabaseUser?.email) {
    return NextResponse.redirect(`${origin}/login?pinterest_error=no_email`);
  }

  // Odśwież token w bazie
  await admin.from("pinterest_connections").upsert(
    {
      user_id: connection.user_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      expires_at: expiresAt,
      pinterest_user_id: pinterestUserId,
    },
    { onConflict: "user_id" }
  );

  // Wygeneruj magic link — przekierowanie do niego auto-loguje użytkownika
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: supabaseUser.email,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${origin}/login?pinterest_error=sign_in`);
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
