import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TopicSubscription } from './schemas/topic_subscription.schema';

@Injectable()
export class TopicSubscriptionsRepo {
    constructor(
        @InjectModel(TopicSubscription.name)
        private model: Model<TopicSubscription>,
    ) { }

    async subscribe(topicId: string, userId: string) {
        return this.model.create({ topic_id: topicId, user_id: userId });
    }

    async unsubscribe(topicId: string, userId: string) {
        return this.model.deleteOne({ topic_id: topicId, user_id: userId });
    }

    async getSubscribers(topicId: string) {
        return this.model.find({ topic_id: topicId });
    }

    async isSubscribed(topicId: string, userId: string) {
        return this.model.findOne({ topic_id: topicId, user_id: userId });
    }

    async countByTopic(topicId: string) {
        return this.model.countDocuments({ topic_id: topicId });
    }
}