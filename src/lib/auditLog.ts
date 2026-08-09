import { createSupabaseServerClient } from './supabaseServer';

export type AuditAction =
  | 'GRIEVANCE_CREATED'
  | 'GRIEVANCE_UPDATED'
  | 'GRIEVANCE_VERIFIED'
  | 'GRIEVANCE_DISPUTED'
  | 'GRIEVANCE_CONFIRMED'
  | 'STATUS_UPDATED'
  | 'OFFICER_ASSIGNED'
  | 'ESCALATED'
  | 'USER_LOGIN'
  | 'USER_REGISTER'
  | 'USER_LOGOUT'
  | 'FILE_UPLOADED';

export type ResourceType =
  | 'grievance'
  | 'cluster'
  | 'notification'
  | 'user'
  | 'file';

/**
 * Log an audit event to the database.
 * Fails silently — audit logging should never break the main flow.
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from('audit_log').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
      ip_address: ipAddress || null,
    });
  } catch (error) {
    // Audit logging must never throw — log to console and continue
    console.error('[AuditLog] Failed to write audit entry:', error);
  }
}
