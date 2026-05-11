import type { TNotification } from '@domain/notification';
import mongoose, { type Model } from 'mongoose';

const notificationSchema = new mongoose.Schema<TNotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    sent: {
      type: Boolean,
      required: true,
      default: false,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    collection: 'notifications',
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

notificationSchema.index({
  userId: 1,
  read: 1,
  createdAt: -1,
});

export const NotificationModel =
  (mongoose.models.Notification as Model<TNotification> | undefined) ||
  mongoose.model<TNotification>('Notification', notificationSchema);
