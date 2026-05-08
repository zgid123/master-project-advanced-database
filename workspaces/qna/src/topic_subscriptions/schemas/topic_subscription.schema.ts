import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TopicSubscription {
  @Prop()
  topic_id: Types.ObjectId;

  @Prop()
  user_id: string;
}

export const TopicSubscriptionSchema = SchemaFactory.createForClass(TopicSubscription);

// Each user can only subscribe once per topic
TopicSubscriptionSchema.index(
  { topic_id: 1, user_id: 1 },
  { unique: true }
);