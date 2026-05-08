import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Topic {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  body: string;

  @Prop()
  slug: string;

  @Prop({ default: false })
  is_solved: boolean;

  @Prop({ required: true })
  user_id: string;

  @Prop()
  substack_id?: string;

  @Prop()
  deleted_at?: Date;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// INDEXES
TopicSchema.index({ slug: 1 }, { unique: true });
TopicSchema.index({ user_id: 1 });
TopicSchema.index({ created_at: -1 });
TopicSchema.index({ title: 'text' }); // search