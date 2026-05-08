import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TopicSubscriptionsService } from './topic_subscriptions.service';

@Controller('topic-subscriptions')
export class TopicSubscriptionsController {
  constructor(private readonly topicSubscriptionsService: TopicSubscriptionsService) {}
}
