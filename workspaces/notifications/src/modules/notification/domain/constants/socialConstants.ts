export const SOCIAL_USER_SUBSCRIBED_NOTIFICATION_TITLE = 'New subscriber';

export function createSocialUserSubscribedNotificationBody(
  actorName: string,
): string {
  return `${actorName} subscribed to you.`;
}
