import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from './schemas/comment.schema';

@Injectable()
export class CommentsRepo {
    constructor(
        @InjectModel(Comment.name) private model: Model<Comment>,
    ) { }

    async create(data: Partial<Comment>) {
        return this.model.create(data);
    }

    async update(id: string, data: Partial<Comment>) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async softDelete(id: string) {
        return this.model.findByIdAndUpdate(id, {
            deleted_at: new Date(),
        });
    }

    async findByTopic(topicId: string) {
        return this.model.find({
            topic_id: topicId,
            deleted_at: null,
        });
    }

    async findById(id: string) {
        return this.model.findById(id);
    }

    async markAccepted(commentId: string) {
        return this.model.findByIdAndUpdate(commentId, {
            is_accepted: true,
        });
    }

    async getCommentsWithAggregates(topicId: string) {
        const filter = { topic_id: topicId, deleted_at: null };
        const comments = await this.model.find(filter).sort({ created_at: 1 });
        return comments;
    }

    async countByTopic(topicId: string) {
        return this.model.countDocuments({ topic_id: topicId, deleted_at: null });
    }

    async getAcceptedComment(topicId: string) {
        return this.model.findOne({ topic_id: topicId, is_accepted: true, deleted_at: null });
    }
}