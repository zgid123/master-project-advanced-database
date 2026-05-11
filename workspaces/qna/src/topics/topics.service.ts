import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { NotificationService } from '../notifications/notification.service';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicsRepo } from './topic.repo';
import { VoteTopicDto } from './dto/vote-topic.dto';
import { VotesRepo } from '../votes/votes.repo';
import { TopicSubscriptionsRepo } from '../topic_subscriptions/topic_subscriptions.repo';
import { CommentsRepo } from '../comments/comments.repo';
import { Types } from 'mongoose';
import { SearchTopicDto } from './dto/search-topic.dto';
import { SearchService } from 'src/search/search.service';
import { randomUUID } from 'crypto';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class TopicsService {
  constructor(
    private readonly topicsRepo: TopicsRepo,
    private readonly votesRepo: VotesRepo,
    private readonly topicSubscriptionsRepo: TopicSubscriptionsRepo,
    private readonly commentsRepo: CommentsRepo,
    private readonly searchService: SearchService,
  ) { }

  async voteTopic(topicId: string, dto: VoteTopicDto) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) throw new NotFoundException('Topic not found');

    if (![1, -1].includes(dto.point)) {
      throw new ForbiddenException('Invalid vote point');
    }

    await this.votesRepo.vote({
      target_id: new Types.ObjectId(topicId),
      user_id: dto.user_id,
      target_type: 'topic',
      point: dto.point,
    });

    try {
      const subscribers = await this.topicSubscriptionsRepo.getSubscribers(topicId);
      const notifyType = dto.point === 1 ? 'qna.topic.upvoted' : 'qna.topic.downvoted';
      for (const sub of subscribers) {
        const subscriberId = sub.user_id?.toString();
        if (!subscriberId || subscriberId === dto.user_id) continue;
        await NotificationService.sendNotification({
          type: notifyType,
          userId: subscriberId,
          data: {
            actorUserId: dto.user_id,
            topicId: topicId,
            topicTitle: topic.title,
          },
        });
      }
    } catch (err) {
      console.error('Notification error:', err?.message || err);
    }

    return { message: 'Vote recorded' };
  }

  async removeVote(topicId: string, user_id: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) throw new NotFoundException('Topic not found');

    await this.votesRepo.removeVote(topicId, user_id);

    return { message: 'Vote removed' };
  }

  async removeTopicVote(topicId: string, user_id: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) throw new NotFoundException('Topic not found');

    await this.votesRepo.removeVote(topicId, user_id);

    return { message: 'Vote removed' };
  }

  async subscribeTopic(topicId: string, user_id: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) throw new NotFoundException('Topic not found');

    const existing = await this.topicSubscriptionsRepo.isSubscribed(topicId, user_id);
    if (existing) return { message: 'Already subscribed' };

    await this.topicSubscriptionsRepo.subscribe(topicId, user_id);

    return { message: 'Subscribed' };
  }

  async unsubscribeTopic(topicId: string, user_id: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at) throw new NotFoundException('Topic not found');

    const existing = await this.topicSubscriptionsRepo.isSubscribed(topicId, user_id);
    if (!existing) return { message: 'Not subscribed' };

    await this.topicSubscriptionsRepo.unsubscribe(topicId, user_id);

    return { message: 'Unsubscribed' };
  }

  async getTopicDetails(topicId: string) {
    const topic = await this.topicsRepo.getTopicDetails(topicId);
    if (!topic) throw new NotFoundException('Topic not found');

    const [vote_score, comments_count, subscriptions_count, accepted_comment] = await Promise.all([
      this.votesRepo.getVotesForTargets([new Types.ObjectId(topicId)], 'topic').then(res => res[0]?.score || 0),
      this.commentsRepo.countByTopic(topicId),
      this.topicSubscriptionsRepo.countByTopic(topicId),
      this.commentsRepo.getAcceptedComment(topicId),
    ]);

    return {
      id: topic._id,
      title: topic.title,
      body: topic.body,
      slug: topic.slug,
      is_solved: topic.is_solved,
      user_id: topic.user_id,
      substack_id: topic.substack_id,
      created_at: topic.get('created_at'),
      updated_at: topic.get('updated_at'),
      vote_score,
      comments_count,
      subscriptions_count,
      accepted_comment: accepted_comment
        ? {
          id: accepted_comment._id,
          content: accepted_comment.content,
          user_id: accepted_comment.user_id,
          created_at: accepted_comment.get('created_at'),
        }
        : null,
    };
  }

  async searchTopics(dto: SearchTopicDto, user_id?: string) {
    const { query, page, limit, substack_id } = dto;

    // const { topics, total } = await this.topicsRepo.getTopicsWithAggregates(query, page, limit);

    const searchResult = await this.searchService.searchTopics(
      query,
      page,
      limit,
      substack_id,
    );

    const topics = await this.topicsRepo.findByIds(
      searchResult.ids.filter((id): id is string => typeof id === 'string'),
      substack_id,
    );

    const topicMap = new Map(
      topics.map(topic => [topic._id.toString(), topic]),
    );

    const orderedTopics = searchResult.ids
      .filter((id): id is string => typeof id === 'string')
      .map(id => topicMap.get(id))
      .filter(Boolean);

    const total = searchResult.total;

    const topicIds = topics.map((t: any) => t._id);

    const [voteScores, commentsCounts, subscriptionsCounts, acceptedComments, isSubscribed] = await Promise.all([
      this.votesRepo.getVotesForTargets(topicIds, 'topic'),
      Promise.all(topicIds.map(id => this.commentsRepo.countByTopic(id))),
      Promise.all(topicIds.map(id => this.topicSubscriptionsRepo.countByTopic(id))),
      Promise.all(topicIds.map(id => this.commentsRepo.getAcceptedComment(id))),
      user_id ? Promise.all(topicIds.map(id => this.topicSubscriptionsRepo.isSubscribed(id, user_id))) : Promise.resolve([]),
    ]);

    const voteScoreMap = Object.fromEntries(voteScores.map((v: any) => [v._id.toString(), v.score]));

    return {
      data: orderedTopics.map((topic: any, i: number) => ({
        id: topic._id,
        title: topic.title,
        body: topic.body,
        slug: topic.slug,
        is_solved: topic.is_solved,
        user_id: topic.user_id,
        substack_id: topic.substack_id,
        created_at: topic.get('created_at'),
        updated_at: topic.get('updated_at'),
        vote_score: voteScoreMap[topic._id.toString()] || 0,
        comments_count: commentsCounts[i],
        subscriptions_count: subscriptionsCounts[i],
        has_accepted_answer: !!acceptedComments[i],
        is_subscribed: isSubscribed[i] || false,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async createTopic(dto: CreateTopicDto) {
    const baseSlug = slugify(dto.title);

    let slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;

    const topic = await this.topicsRepo.create({
      title: dto.title,
      body: dto.body,
      slug,
      user_id: dto.user_id,
      substack_id: dto.substack_id ? dto.substack_id : undefined,
    });

    await this.searchService.indexTopic(topic);

    return {
      id: topic._id,
      title: topic.title,
      body: topic.body,
      slug: topic.slug,
      is_solved: topic.is_solved,
      user_id: topic.user_id,
      substack_id: topic.substack_id,
      created_at: topic.get('created_at'),
      updated_at: topic.get('updated_at'),
    };
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }
    if (topic.user_id.toString() !== dto.user_id) {
      throw new ForbiddenException('You are not the owner of this topic');
    }

    const updateData: any = {};

    if (dto.title) {
      updateData.title = dto.title;
      updateData.slug = slugify(dto.title);
    }
    if (dto.body !== undefined) {
      updateData.body = dto.body;
    }

    const updated = await this.topicsRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Topic not found after update');
    }

    await this.searchService.updateTopic(updated);

    return {
      id: updated._id,
      title: updated.title,
      body: updated.body,
      slug: updated.slug,
      is_solved: updated.is_solved,
      user_id: updated.user_id,
      substack_id: updated.substack_id,
      created_at: updated.get('created_at'),
      updated_at: updated.get('updated_at'),
    };
  }

  async deleteTopic(id: string, user_id: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }
    if (topic.user_id.toString() !== user_id) {
      throw new ForbiddenException('You are not the owner of this topic');
    }

    await this.topicsRepo.softDelete(id);

    await this.searchService.deleteTopic(id);

    return { message: 'Topic deleted successfully' };
  }

  async getTopicById(id: string, user_id?: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    const [voteScore, commentsCount, subscriptionsCount, acceptedComment, isSubscribed] = await Promise.all([
      this.votesRepo.getVotesForTargets([new Types.ObjectId(id)], 'topic').then(res => res[0]?.score || 0),
      this.commentsRepo.countByTopic(id),
      this.topicSubscriptionsRepo.countByTopic(id),
      this.commentsRepo.getAcceptedComment(id),
      user_id ? this.topicSubscriptionsRepo.isSubscribed(id, user_id) : Promise.resolve(false),
    ]);

    return {
      id: topic._id,
      title: topic.title,
      body: topic.body,
      slug: topic.slug,
      is_solved: topic.is_solved,
      user_id: topic.user_id,
      substack_id: topic.substack_id,
      created_at: topic.get('created_at'),
      updated_at: topic.get('updated_at'),
      vote_score: voteScore || 0,
      comments_count: commentsCount,
      subscriptions_count: subscriptionsCount,
      has_accepted_answer: !!acceptedComment,
      is_subscribed: isSubscribed || false,
    };
  }

  async getCommentsByTopic(id: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    const comments = await this.commentsRepo.findByTopic(id);

    return comments.map((comment: any) => ({
      id: comment._id,
      topic_id: comment.topic_id,
      user_id: comment.user_id,
      content: comment.content,
      is_accepted: comment.is_accepted,
      created_at: comment.get('created_at'),
      updated_at: comment.get('updated_at'),
    }));
  }

  // async searchTopics(dto: SearchTopicDto) {
  //   const topics = await this.topicsRepo.search(dto.query);

  //   return topics.map((topic: any) => ({
  //     id: topic._id,
  //     title: topic.title,
  //     body: topic.body,
  //     slug: topic.slug,
  //     is_solved: topic.is_solved,
  //     user_id: topic.user_id,
  //     substack_id: topic.substack_id,
  //     created_at: topic.get('created_at'),
  //     updated_at: topic.get('updated_at'),
  //   }));
  // }

  async markSolved(id: string, user_id: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.user_id.toString() !== user_id) {
      throw new ForbiddenException('You are not the owner of this topic');
    }

    const updated = await this.topicsRepo.markSolved(id);
    if (!updated) {
      throw new NotFoundException('Topic not found after marking as solved');
    }

    return {
      id: updated._id,
      title: updated.title,
      body: updated.body,
      slug: updated.slug,
      is_solved: updated.is_solved,
      user_id: updated.user_id,
      substack_id: updated.substack_id,
      created_at: updated.get('created_at'),
      updated_at: updated.get('updated_at'),
    };
  }
}
