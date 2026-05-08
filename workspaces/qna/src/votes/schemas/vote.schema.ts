import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Vote {
  @Prop()
  target_id: Types.ObjectId;

  @Prop({ enum: ['topic', 'comment'] })
  target_type: string;

  @Prop()
  user_id: string;

  @Prop()
  point: number;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

// Each user can only vote once per target (topic/comment)
VoteSchema.index(
  { target_id: 1, target_type: 1, user_id: 1 },
  { unique: true }
);