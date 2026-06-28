import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

type AuditEntry = {
  action: string
  entity?: string
  entityId?: string
  details?: Record<string, unknown>
  actorId?: string | null
  actorEmail?: string | null
}

/** Best-effort audit logging; never throws into the calling flow. */
export async function writeAudit(entry: AuditEntry) {
  try {
    const admin = createAdminClient()
    await admin.from("oes_audit_logs").insert({
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? null,
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
    })
  } catch (e) {
    console.error("audit log failed", e)
  }
}
