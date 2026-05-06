import { type InferSchemaType, model, models, Schema } from 'mongoose';

const notificationSchema = new Schema(
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
      type: Schema.Types.Mixed,
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

export type TNotification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel =
  models.Notification || model('Notification', notificationSchema);
