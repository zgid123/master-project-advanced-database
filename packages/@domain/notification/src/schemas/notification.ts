import { BaseUuid } from '@domain/core';
import { type } from 'arktype';

export const Notification = BaseUuid.and({
  body: 'string',
  title: 'string',
  sent: 'boolean',
  read: 'boolean',
  userId: 'string',
  metadata: 'unknown | null',
});

export const CreateNotification = Notification.pick(
  'body',
  'title',
  'userId',
  'metadata',
);

export const CreateSystemNotification = type.or(
  {
    type: "'auth.sign-up.welcome'",
    userId: 'string',
    data: {
      email: 'string.email',
    },
  },
  {
    type: "'qna.topic.upvoted' | 'qna.topic.downvoted'",
    userId: 'string',
    data: {
      actorUserId: 'string',
      topicId: 'string',
      topicTitle: 'string',
    },
  },
  {
    type: "'qna.answer.upvoted' | 'qna.answer.downvoted'",
    userId: 'string',
    data: {
      actorUserId: 'string',
      answerId: 'string',
      topicId: 'string',
      topicTitle: 'string',
    },
  },
  {
    type: "'social.user.subscribed'",
    userId: 'string',
    data: {
      actorUserId: 'string',
    },
  },
  {
    type: "'substack.topic.created'",
    userId: 'string',
    data: {
      topicId: 'string',
      topicTitle: 'string',
      substackId: 'string',
      substackName: 'string',
      substackSlug: 'string',
      authorUserId: 'string',
    },
  },
  {
    type: "'substack.subscribed'",
    userId: 'string',
    data: {
      actorName: 'string',
      substackId: 'string',
      actorUserId: 'string',
      substackName: 'string',
      substackSlug: 'string',
    },
  },
  {
    type: "'substack.approved' | 'substack.created'",
    userId: 'string',
    data: {
      substackId: 'string',
      substackName: 'string',
      substackSlug: 'string',
    },
  },
);

export const CreateSystemNotificationsBatch = type({
  notifications: CreateSystemNotification.array(),
});

export type TNotification = typeof Notification.infer;

export type TCreateNotification = typeof CreateNotification.infer;

export type TCreateSystemNotification = typeof CreateSystemNotification.infer;

export type TCreateSystemNotificationsBatch =
  typeof CreateSystemNotificationsBatch.infer;
