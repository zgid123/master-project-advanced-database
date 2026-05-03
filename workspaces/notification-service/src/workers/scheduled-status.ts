export const scheduledNotificationStatus = {
  pending: 0,
  processing: 1,
  fired: 2,
  cancelled: 3,
  failed: 4,
} as const;

export function scheduledRetryDelaySeconds(attempts: number): number {
  const boundedAttempts = Math.max(1, Math.min(attempts, 8));
  return Math.min(3_600, 30 * (2 ** (boundedAttempts - 1)));
}
