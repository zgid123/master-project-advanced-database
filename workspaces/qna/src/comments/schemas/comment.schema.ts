import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Comment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  topic_id: Types.ObjectId;

  @Prop({ required: true })
  user_id: string;

  @Prop()
  content: string;

  @Prop({ default: false })
  is_accepted: boolean;

  @Prop()
  deleted_at?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// INDEXES
CommentSchema.index({ topic_id: 1 });
CommentSchema.index({ user_id: 1 });