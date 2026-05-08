import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vote } from './schemas/vote.schema';

@Injectable()
export class VotesRepo {
    constructor(
        @InjectModel(Vote.name) private model: Model<Vote>,
    ) { }

    async vote(data: Partial<Vote>) {
        return this.model.findOneAndUpdate(
            {
                target_id: data.target_id,
                user_id: data.user_id,
                target_type: data.target_type,
            },
            data,
            { upsert: true, new: true },
        );
    }

    async removeVote(targetId: string, userId: string) {
        return this.model.deleteOne({
            target_id: targetId,
            user_id: userId,
        });
    }

    async getScore(targetId: string) {
        const result = await this.model.aggregate([
            { $match: { target_id: targetId } },
            { $group: { _id: null, score: { $sum: '$point' } } },
        ]);
        return result[0]?.score || 0;
    }

    async getVoteByUser(targetId: string, userId: string, targetType: string) {
        return this.model.findOne({ target_id: targetId, user_id: userId, target_type: targetType });
    }

    async getVotesForTargets(targetIds: string[], targetType: string) {
        // Returns vote scores for multiple targets
        const result = await this.model.aggregate([
            { $match: { target_id: { $in: targetIds }, target_type: targetType } },
            { $group: { _id: "$target_id", score: { $sum: "$point" } } },
        ]);
        return result;
    }
}