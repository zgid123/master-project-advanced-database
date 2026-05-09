export const QNA_TOPIC_UPVOTED_NOTIFICATION_TITLE = 'New topic upvote';
export const QNA_TOPIC_DOWNVOTED_NOTIFICATION_TITLE = 'New topic downvote';

export function createTopicVoteNotificationBody(
  action: 'upvoted' | 'downvoted',
  topicTitle: string,
): string {
  return `Someone ${action} your topic "${topicTitle}".`;
}

export const QNA_ANSWER_UPVOTED_NOTIFICATION_TITLE = 'New answer upvote';
export const QNA_ANSWER_DOWNVOTED_NOTIFICATION_TITLE = 'New answer downvote';

export function createAnswerVoteNotificationBody(
  action: 'upvoted' | 'downvoted',
  topicTitle: string,
): string {
  return `Someone ${action} your answer on "${topicTitle}".`;
}
