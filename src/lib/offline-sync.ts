import { createClient } from "@/lib/supabase/client";
import { getPendingMutations, clearPendingMutations } from "@/lib/offline-storage";

export async function syncOfflineMutations(): Promise<number> {
  const pending = await getPendingMutations();
  if (pending.length === 0) return 0;

  const supabase = createClient();
  let synced = 0;

  for (const mutation of pending.sort((a: any, b: any) => a.timestamp - b.timestamp)) {
    try {
      if (mutation.action === "insert") {
        await supabase.from(mutation.table).insert(mutation.data);
      } else if (mutation.action === "update") {
        const { id, ...rest } = mutation.data;
        await supabase.from(mutation.table).update(rest).eq("id", id);
      } else if (mutation.action === "delete") {
        await supabase.from(mutation.table).delete().eq("id", mutation.data.id);
      }
      synced++;
    } catch {
    }
  }

  if (synced > 0) await clearPendingMutations();
  return synced;
}
