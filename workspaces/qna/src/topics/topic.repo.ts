import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic } from './schemas/topic.schema';

@Injectable()
export class TopicsRepo {
    constructor(
        @InjectModel(Topic.name) private model: Model<Topic>,
    ) { }

    async create(data: Partial<Topic>) {
        return this.model.create(data);
    }

    async findById(id: string) {
        return this.model.findById(id);
    }

    async update(id: string, data: Partial<Topic>) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async softDelete(id: string) {
        return this.model.findByIdAndUpdate(id, {
            deleted_at: new Date(),
        });
    }

    async search(query: string) {
        return this.model.find({
            $text: { $search: query },
            deleted_at: null,
        });
    }

    async markSolved(id: string) {
        return this.model.findByIdAndUpdate(id, {
            is_solved: true,
        });
    }

    async getTopicDetails(id: string) {
        const topic = await this.model.findOne({ _id: id, deleted_at: null });
        if (!topic) return null;
        return topic;
    }

    async getTopicsWithAggregates(query: string, page: number, limit: number) {
        const filter: any = { deleted_at: null };
        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }
        const skip = (page - 1) * limit;
        const topics = await this.model.find(filter).skip(skip).limit(limit).sort({ created_at: -1 });
        const total = await this.model.countDocuments(filter);
        return { topics, total };
    }
}