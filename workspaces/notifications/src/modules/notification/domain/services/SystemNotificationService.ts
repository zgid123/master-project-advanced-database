import type {
  TCreateNotification,
  TCreateSystemNotification,
} from '@domain/notification';

import {
  AUTH_SIGN_UP_WELCOME_NOTIFICATION_BODY,
  AUTH_SIGN_UP_WELCOME_NOTIFICATION_TITLE,
  createAnswerVoteNotificationBody,
  createSubstackApprovedNotificationBody,
  createSubstackCreatedNotificationBody,
  createSubstackSubscribedNotificationBody,
  createSubstackTopicCreatedNotificationBody,
  createTopicVoteNotificationBody,
  QNA_ANSWER_DOWNVOTED_NOTIFICATION_TITLE,
  QNA_ANSWER_UPVOTED_NOTIFICATION_TITLE,
  QNA_TOPIC_DOWNVOTED_NOTIFICATION_TITLE,
  QNA_TOPIC_UPVOTED_NOTIFICATION_TITLE,
  SOCIAL_USER_SUBSCRIBED_NOTIFICATION_BODY,
  SOCIAL_USER_SUBSCRIBED_NOTIFICATION_TITLE,
  SUBSTACK_APPROVED_NOTIFICATION_TITLE,
  SUBSTACK_CREATED_NOTIFICATION_TITLE,
  SUBSTACK_SUBSCRIBED_NOTIFICATION_TITLE,
  SUBSTACK_TOPIC_CREATED_NOTIFICATION_TITLE,
} from '../constants';

export class SystemNotificationService {
  public create(params: TCreateSystemNotification): TCreateNotification {
    switch (params.type) {
      case 'auth.sign-up.welcome':
        return {
          userId: params.userId,
          body: AUTH_SIGN_UP_WELCOME_NOTIFICATION_BODY,
          title: AUTH_SIGN_UP_WELCOME_NOTIFICATION_TITLE,
          metadata: {
            source: 'auth',
            type: params.type,
            email: params.data.email,
          },
        };
      case 'qna.topic.upvoted':
        return {
          userId: params.userId,
          title: QNA_TOPIC_UPVOTED_NOTIFICATION_TITLE,
          body: createTopicVoteNotificationBody(
            'upvoted',
            params.data.topicTitle,
          ),
          metadata: {
            source: 'qna',
            type: params.type,
            topicId: params.data.topicId,
            topicTitle: params.data.topicTitle,
            actorUserId: params.data.actorUserId,
          },
        };
      case 'qna.topic.downvoted':
        return {
          userId: params.userId,
          title: QNA_TOPIC_DOWNVOTED_NOTIFICATION_TITLE,
          body: createTopicVoteNotificationBody(
            'downvoted',
            params.data.topicTitle,
          ),
          metadata: {
            source: 'qna',
            type: params.type,
            topicId: params.data.topicId,
            topicTitle: params.data.topicTitle,
            actorUserId: params.data.actorUserId,
          },
        };
      case 'qna.answer.upvoted':
        return {
          userId: params.userId,
          title: QNA_ANSWER_UPVOTED_NOTIFICATION_TITLE,
          body: createAnswerVoteNotificationBody(
            'upvoted',
            params.data.topicTitle,
          ),
          metadata: {
            source: 'qna',
            type: params.type,
            topicId: params.data.topicId,
            answerId: params.data.answerId,
            topicTitle: params.data.topicTitle,
            actorUserId: params.data.actorUserId,
          },
        };
      case 'qna.answer.downvoted':
        return {
          userId: params.userId,
          title: QNA_ANSWER_DOWNVOTED_NOTIFICATION_TITLE,
          body: createAnswerVoteNotificationBody(
            'downvoted',
            params.data.topicTitle,
          ),
          metadata: {
            source: 'qna',
            type: params.type,
            topicId: params.data.topicId,
            answerId: params.data.answerId,
            topicTitle: params.data.topicTitle,
            actorUserId: params.data.actorUserId,
          },
        };
      case 'social.user.subscribed':
        return {
          userId: params.userId,
          title: SOCIAL_USER_SUBSCRIBED_NOTIFICATION_TITLE,
          body: SOCIAL_USER_SUBSCRIBED_NOTIFICATION_BODY,
          metadata: {
            source: 'social',
            type: params.type,
            actorUserId: params.data.actorUserId,
          },
        };
      case 'substack.topic.created':
        return {
          userId: params.userId,
          title: SUBSTACK_TOPIC_CREATED_NOTIFICATION_TITLE,
          body: createSubstackTopicCreatedNotificationBody(
            params.data.topicTitle,
            params.data.substackName,
          ),
          metadata: {
            source: 'substack',
            type: params.type,
            topicId: params.data.topicId,
            topicTitle: params.data.topicTitle,
            substackId: params.data.substackId,
            authorUserId: params.data.authorUserId,
            substackName: params.data.substackName,
            substackSlug: params.data.substackSlug,
          },
        };
      case 'substack.subscribed':
        return {
          userId: params.userId,
          title: SUBSTACK_SUBSCRIBED_NOTIFICATION_TITLE,
          body: createSubstackSubscribedNotificationBody(
            params.data.actorName,
            params.data.substackName,
          ),
          metadata: {
            source: 'substack',
            type: params.type,
            actorName: params.data.actorName,
            substackId: params.data.substackId,
            actorUserId: params.data.actorUserId,
            substackName: params.data.substackName,
            substackSlug: params.data.substackSlug,
          },
        };
      case 'substack.approved':
        return {
          userId: params.userId,
          title: SUBSTACK_APPROVED_NOTIFICATION_TITLE,
          body: createSubstackApprovedNotificationBody(
            params.data.substackName,
          ),
          metadata: {
            source: 'substack',
            type: params.type,
            substackId: params.data.substackId,
            substackName: params.data.substackName,
            substackSlug: params.data.substackSlug,
          },
        };
      case 'substack.created':
        return {
          userId: params.userId,
          title: SUBSTACK_CREATED_NOTIFICATION_TITLE,
          body: createSubstackCreatedNotificationBody(params.data.substackName),
          metadata: {
            source: 'substack',
            type: params.type,
            substackId: params.data.substackId,
            substackName: params.data.substackName,
            substackSlug: params.data.substackSlug,
          },
        };
    }
  }
}
