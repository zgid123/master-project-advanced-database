import { Module } from '@nestjs/common';
import { TopicSubscriptionsService } from './topic_subscriptions.service';
import { TopicSubscriptionsController } from './topic_subscriptions.controller';
import { TopicSubscriptionsRepo } from './topic_subscriptions.repo';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicSubscription, TopicSubscriptionSchema } from './schemas/topic_subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TopicSubscription.name,
        schema: TopicSubscriptionSchema,
      },
    ]),
  ],
  controllers: [TopicSubscriptionsController],
  providers: [TopicSubscriptionsService, TopicSubscriptionsRepo],
  exports: [TopicSubscriptionsRepo],
})
export class TopicSubscriptionsModule { }
