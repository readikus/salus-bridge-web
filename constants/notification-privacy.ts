/**
 * Notification Privacy Utilities (COMP-03 Scaffolding)
 *
 * COMP-03: Notifications must never reveal health details, employee names,
 * or conditions in subject/body. All notification content must be sanitized
 * before delivery to prevent accidental exposure of sensitive health data.
 *
 * This module establishes the notification privacy pattern for the entire platform.
 * Phase 1 does not send notifications, but this scaffolding ensures the pattern
 * is available when Phase 2 adds email notifications.
 */

/**
 * Whitelist of fields that may appear in notification content.
 * Health details, employee names, conditions, and diagnosis info are NEVER included.
 */
export const NOTIFICATION_SAFE_FIELDS: string[] = [
  "organisationName",
  "actionRequired",
  "dateRange",
  "departmentName",
  "notificationType",
  "dueDate",
  "dayCount",
  "roleName",
];

/**
 * Patterns that must never appear in notification subject/body.
 * These protect against accidental inclusion of health-sensitive information.
 */
export const NOTIFICATION_FORBIDDEN_PATTERNS: RegExp[] = [
  /diagnosis/i,
  /condition/i,
  /illness/i,
  /symptom/i,
  /medication/i,
  /treatment/i,
  /disability/i,
  /medical/i,
  /health\s*(?:issue|problem|concern|status|record|data)/i,
  /sick(?:ness)?\s*(?:detail|reason|cause)/i,
  /absent(?:ee)?\s*reason/i,
];

/**
 * Strips any forbidden patterns from notification text, replacing with
 * generic placeholders to prevent accidental exposure of sensitive data.
 *
 * @param content - The raw notification content to sanitize
 * @returns Sanitized content with forbidden patterns replaced
 */
export function sanitizeNotificationContent(content: string): string {
  let sanitized = content;

  for (const pattern of NOTIFICATION_FORBIDDEN_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[details available in platform]");
  }

  return sanitized;
}

/**
 * Constructs a notification subject line using only safe fields.
 * Ensures no sensitive information leaks into email subjects, push notification
 * titles, or other externally visible notification metadata.
 *
 * @param type - The notification type (e.g. "action_required", "reminder")
 * @param metadata - Key-value pairs of safe field data
 * @returns A safe subject line
 *
 * @example
 * buildSafeNotificationSubject("action_required", { organisationName: "Acme Corp" })
 * // => "Action required: Review pending item - Acme Corp"
 */
export function buildSafeNotificationSubject(
  type: string,
  metadata: Record<string, string>,
): string {
  // Filter metadata to only include safe fields
  const safeMetadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (NOTIFICATION_SAFE_FIELDS.includes(key)) {
      safeMetadata[key] = value;
    }
  }

  const subjectPrefixes: Record<string, string> = {
    action_required: "Action required: Review pending item",
    reminder: "Reminder: Action needed",
    update: "Update: Status changed",
    invitation: "You have been invited",
    welcome: "Welcome to the platform",
  };

  const prefix = subjectPrefixes[type] || "Notification";
  const orgSuffix = safeMetadata.organisationName ? ` - ${safeMetadata.organisationName}` : "";

  return `${prefix}${orgSuffix}`;
}

/**
 * Validates a notification payload against forbidden patterns.
 * Returns a list of violations if any sensitive content is detected.
 *
 * COMP-03: This should be called before any notification is dispatched.
 *
 * @param payload - The notification payload to validate
 * @returns Object with valid flag and list of violations
 */
export function validateNotificationPayload(payload: {
  subject: string;
  body: string;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const pattern of NOTIFICATION_FORBIDDEN_PATTERNS) {
    if (pattern.test(payload.subject)) {
      violations.push(`Subject contains forbidden pattern: ${pattern.source}`);
    }
    // Reset lastIndex for global-like behavior with test()
    if (pattern.test(payload.body)) {
      violations.push(`Body contains forbidden pattern: ${pattern.source}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
