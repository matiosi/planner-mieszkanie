import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { boardId, projectId, roomId } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Pobierz token
  const { data: connection } = await supabase
    .from("pinterest_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .single();

  if (!connection) return NextResponse.json({ error: "Brak połączenia Pinterest" }, { status: 400 });

  // Pobierz piny z tablicy
  const pinsRes = await fetch(
    `https://api.pinterest.com/v5/boards/${boardId}/pins?page_size=100`,
    { headers: { Authorization: `Bearer ${connection.access_token}` } }
  );

  if (!pinsRes.ok) {
    return NextResponse.json({ error: "Błąd pobierania pinów" }, { status: 400 });
  }

  const pinsData = await pinsRes.json();
  const pins = pinsData.items ?? [];

  // Insert inspiracji
  const toInsert = pins.map((pin: {
    id: string;
    title?: string;
    link?: string;
    media?: { images?: Record<string, { url: string }> };
  }) => ({
    project_id: projectId,
    room_id: roomId || null,
    source: "PINTEREST",
    title: pin.title || `Pin ${pin.id}`,
    external_url: pin.link || `https://pinterest.com/pin/${pin.id}`,
    storage_bucket: null,
    storage_path: null,
    designer_note: null,
    selected_for_designer: false,
    category: "Pinterest",
    description: null,
    image_url: pin.media?.images?.["600x"]?.url ?? null,
  }));

  if (toInsert.length) {
    await supabase.from("inspirations").insert(toInsert);
  }

  // Zapisz informację o imporcie tablicy
  await supabase.from("pinterest_boards").upsert(
    {
      project_id: projectId,
      user_id: user.id,
      board_id: boardId,
      board_name: boardId,
      room_id: roomId || null,
      imported_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return NextResponse.json({ imported: toInsert.length });
}
