import type { TNotification } from '../schemas';

export type TNotificationEntity = TNotification;

export class NotificationEntity implements TNotificationEntity {
  public id: string;
  public body: string;
  public title: string;
  public sent: boolean;
  public read: boolean;
  public userId: string;
  public createdAt: Date;
  public updatedAt: Date;
  public metadata: unknown | null;

  constructor({
    id,
    body,
    sent,
    read,
    title,
    userId,
    metadata,
    updatedAt,
    createdAt,
  }: TNotificationEntity) {
    this.id = id;
    this.body = body;
    this.sent = sent;
    this.read = read;
    this.title = title;
    this.userId = userId;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static create(params: TNotificationEntity): NotificationEntity {
    return new NotificationEntity(params);
  }
}
