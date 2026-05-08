import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TopicsModule } from './topics/topics.module';
import { CommentsModule } from './comments/comments.module';
import { VotesModule } from './votes/votes.module';
import { TopicSubscriptionsModule } from './topic_subscriptions/topic_subscriptions.module';
import { MongoModule } from './database/mongo.module';

@Module({
  imports: [TopicsModule, CommentsModule, VotesModule, TopicSubscriptionsModule, MongoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
