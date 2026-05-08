import { forwardRef, Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { TopicsRepo } from './topic.repo';
import { VotesModule } from 'src/votes/votes.module';
import { CommentsModule } from 'src/comments/comments.module';
import { TopicSubscriptionsModule } from 'src/topic_subscriptions/topic_subscriptions.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './schemas/topic.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Topic.name,
        schema: TopicSchema,
      },
    ]),
    forwardRef(() => VotesModule),
    forwardRef(() => CommentsModule),
    forwardRef(() => TopicSubscriptionsModule),
  ],
  controllers: [TopicsController],
  providers: [TopicsService, TopicsRepo],
  exports: [TopicsRepo],
})
export class TopicsModule { }
