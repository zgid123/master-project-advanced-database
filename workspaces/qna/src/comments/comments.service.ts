import { NotificationService } from '../notifications/notification.service';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsRepo } from './comments.repo';
import { TopicsRepo } from '../topics/topic.repo';
import { VoteCommentDto } from './dto/vote-comment.dto';
import { VotesRepo } from '../votes/votes.repo';
import { Types } from 'mongoose';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepo: CommentsRepo,
    private readonly topicsRepo: TopicsRepo,
    private readonly votesRepo: VotesRepo,
  ) { }

  async voteComment(commentId: string, dto: VoteCommentDto) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment || comment.deleted_at) throw new NotFoundException('Comment not found');

    if (![1, -1].includes(dto.point)) {
      throw new ForbiddenException('Invalid vote point');
    }

    await this.votesRepo.vote({
      target_id: new Types.ObjectId(commentId),
      user_id: dto.user_id,
      target_type: 'comment',
      point: dto.point,
    });

    try {
      if (comment.user_id?.toString() !== dto.user_id) {
        const topic = await this.topicsRepo.findById(comment.topic_id.toString());
        if (topic) {
          const notifyType = dto.point === 1 ? 'qna.answer.upvoted' : 'qna.answer.downvoted';
          await NotificationService.sendNotification({
            type: notifyType,
            userId: comment.user_id,
            data: {
              actorUserId: dto.user_id,
              answerId: commentId,
              topicId: comment.topic_id,
              topicTitle: topic.title,
            },
          });
        }
      }
    } catch (err) {
      console.error('Notification error:', err?.message || err);
    }

    return { message: 'Vote recorded' };
  }

  async removeCommentVote(commentId: string, user_id: string) {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment || comment.deleted_at) throw new NotFoundException('Comment not found');
    await this.votesRepo.removeVote(commentId, user_id);
    return { message: 'Vote removed' };
  }

  async getCommentsByTopic(topicId: string) {
    const comments = await this.commentsRepo.getCommentsWithAggregates(topicId);
    const commentIds = comments.map((c: any) => c._id);
    const voteScores = await this.votesRepo.getVotesForTargets(commentIds, 'comment');
    const voteScoreMap = Object.fromEntries(voteScores.map((v: any) => [v._id.toString(), v.score]));
    return comments.map((comment: any) => ({
      id: comment._id,
      topic_id: comment.topic_id,
      user_id: comment.user_id,
      content: comment.content,
      is_accepted: comment.is_accepted,
      created_at: comment.get('created_at'),
      updated_at: comment.get('updated_at'),
      vote_score: voteScoreMap[comment._id.toString()] || 0,
    }));
  }

  async createComment(dto: CreateCommentDto) {
    const topic = await this.topicsRepo.findById(dto.topic_id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    const comment = await this.commentsRepo.create({
      topic_id: new Types.ObjectId(dto.topic_id),
      user_id: dto.user_id,
      content: dto.content,
    });

    return {
      id: comment._id,
      topic_id: comment.topic_id,
      user_id: comment.user_id,
      content: comment.content,
      is_accepted: comment.is_accepted,
      created_at: comment.get('created_at'),
      updated_at: comment.get('updated_at'),
    };
  }

  async updateComment(id: string, dto: UpdateCommentDto) {
    const comment = await this.commentsRepo.findById(id);
    if (!comment || comment.deleted_at) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id.toString() !== dto.user_id) {
      throw new ForbiddenException('You are not the owner of this comment');
    }

    const updateData: any = {};

    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }
    const updated = await this.commentsRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Comment not found after update');
    }

    return {
      id: updated._id,
      topic_id: updated.topic_id,
      user_id: updated.user_id,
      content: updated.content,
      is_accepted: updated.is_accepted,
      created_at: updated.get('created_at'),
      updated_at: updated.get('updated_at'),
    };
  }

  async deleteComment(id: string, user_id: string) {
    const comment = await this.commentsRepo.findById(id);
    if (!comment || comment.deleted_at) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id.toString() !== user_id) {
      throw new ForbiddenException('You are not the owner of this comment');
    }
    if (comment.is_accepted) {
      throw new ForbiddenException('Accepted answer cannot be deleted.');
    }

    await this.commentsRepo.softDelete(id);

    return { message: 'Comment deleted successfully' };
  }

  // async getCommentsByTopic(topicId: string) {
  //   const comments = await this.commentsRepo.findByTopic(topicId);

  //   return comments.map((comment: any) => ({
  //     id: comment._id,
  //     topic_id: comment.topic_id,
  //     user_id: comment.user_id,
  //     content: comment.content,
  //     is_accepted: comment.is_accepted,
  //     created_at: comment.get('created_at'),
  //     updated_at: comment.get('updated_at'),
  //   }));
  // }

  async acceptComment(commentId: string, topicId: string, user_id: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    const comment = await this.commentsRepo.findById(commentId);
    if (!comment || comment.deleted_at) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.topic_id.toString() !== topicId) {
      throw new ForbiddenException('Comment does not belong to this topic');
    }

    if (topic.user_id.toString() !== user_id) {
      throw new ForbiddenException('You are not the owner of this topic');
    }

    const updatedComment = await this.commentsRepo.markAccepted(commentId);
    if (!updatedComment) {
      throw new NotFoundException('Comment not found after marking as accepted');
    }

    await this.topicsRepo.markSolved(topicId);

    return {
      id: updatedComment._id,
      topic_id: updatedComment.topic_id,
      user_id: updatedComment.user_id,
      content: updatedComment.content,
      is_accepted: updatedComment.is_accepted,
      created_at: updatedComment.get('created_at'),
      updated_at: updatedComment.get('updated_at'),
    };
  }
}
