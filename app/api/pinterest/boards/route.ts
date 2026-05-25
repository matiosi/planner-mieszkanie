import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabase
    .from("pinterest_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .single();

  if (!connection) return NextResponse.json({ error: "No connection" }, { status: 404 });

  const res = await fetch("https://api.pinterest.com/v5/boards?page_size=50", {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Token wygasł — usuń połączenie
      await supabase.from("pinterest_connections").delete().eq("user_id", user.id);
    }
    return NextResponse.json({ error: "Pinterest API error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ boards: data.items ?? [] });
}
