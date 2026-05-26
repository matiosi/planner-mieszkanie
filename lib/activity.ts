import type { SupabaseClient } from "@supabase/supabase-js";

interface LogParams {
  projectId: string;
  userId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  description: string;
}

/**
 * Zapisuje wpis do tabeli activity_log.
 * Błędy są ignorowane — logowanie nie powinno blokować głównej operacji.
 */
export async function logActivity(supabase: SupabaseClient, params: LogParams) {
  await supabase.from("activity_log").insert({
    project_id: params.projectId,
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    description: params.description,
  });
}
