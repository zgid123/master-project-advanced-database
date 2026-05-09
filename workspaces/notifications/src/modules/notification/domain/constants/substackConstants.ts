export const SUBSTACK_TOPIC_CREATED_NOTIFICATION_TITLE = 'New substack topic';
export const SUBSTACK_APPROVED_NOTIFICATION_TITLE = 'Substack approved';
export const SUBSTACK_CREATED_NOTIFICATION_TITLE = 'Substack created';
export const SUBSTACK_SUBSCRIBED_NOTIFICATION_TITLE = 'New substack subscriber';

export function createSubstackTopicCreatedNotificationBody(
  topicTitle: string,
  substackName: string,
): string {
  return `"${topicTitle}" was published in ${substackName}.`;
}

export function createSubstackApprovedNotificationBody(
  substackName: string,
): string {
  return `${substackName} has been approved.`;
}

export function createSubstackCreatedNotificationBody(
  substackName: string,
): string {
  return `${substackName} was created and is waiting for approval.`;
}

export function createSubstackSubscribedNotificationBody(
  actorName: string,
  substackName: string,
): string {
  return `${actorName} subscribed to ${substackName}.`;
}
