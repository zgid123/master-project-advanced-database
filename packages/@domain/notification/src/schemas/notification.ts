import { BaseUuid } from '@domain/core';

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

export type TNotification = typeof Notification.infer;

export type TCreateNotification = typeof CreateNotification.infer;
