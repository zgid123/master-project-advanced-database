import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RecommendationService } from 'src/recommendations/recommendation.service';
// biome-ignore lint/style/useImportType: NestJS needs the class value for dependency injection
import { SearchService } from 'src/search/search.service';

// biome-ignore lint/style/useImportType: NestJS needs the class value for dependency injection
import { CommentsRepo } from '../comments/comments.repo';
import { NotificationService } from '../notifications/notification.service';
// biome-ignore lint/style/useImportType: NestJS needs the class value for dependency injection
import { TopicSubscriptionsRepo } from '../topic_subscriptions/topic_subscriptions.repo';
// biome-ignore lint/style/useImportType: NestJS needs the class value for dependency injection
import { VotesRepo } from '../votes/votes.repo';
import type { CreateTopicDto } from './dto/create-topic.dto';
import type { SearchTopicDto } from './dto/search-topic.dto';
import type { UpdateTopicDto } from './dto/update-topic.dto';
import type { VoteTopicDto } from './dto/vote-topic.dto';
// biome-ignore lint/style/useImportType: NestJS needs the class value for dependency injection
import { TopicsRepo } from './topic.repo';

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
  ) {}

  async voteTopic(topicId: string, dto: VoteTopicDto) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at)
      throw new NotFoundException('Topic not found');

    if (![1, -1].includes(dto.point)) {
      throw new ForbiddenException('Invalid vote point');
    }

    if (!dto.user_id) {
      throw new BadRequestException('User ID is required in x-user-id header');
    }

    await this.votesRepo.vote({
      target_id: new Types.ObjectId(topicId),
      user_id: dto.user_id,
      target_type: 'topic',
      point: dto.point,
    });

    try {
      await RecommendationService.sendVoteEvent({
        type: 'vote.created',
        userId: dto.user_id,
        targetType: 'topic',
        targetId: topicId,
        voteType: dto.point === 1 ? 'up' : 'down',
        substackId: topic.substack_id?.toString?.() ?? undefined,
      });
    } catch (err) {
      console.error('RecSys vote event error:', err?.message || err);
    }

    try {
      const subscribers =
        await this.topicSubscriptionsRepo.getSubscribers(topicId);
      const notifyType =
        dto.point === 1 ? 'qna.topic.upvoted' : 'qna.topic.downvoted';
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

  async removeVote(topicId: string, userId: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at)
      throw new NotFoundException('Topic not found');

    await this.votesRepo.removeVote(topicId, userId);

    try {
      await RecommendationService.sendVoteEvent({
        type: 'vote.deleted',
        userId: userId,
        targetType: 'topic',
        targetId: topicId,
      });
    } catch (err) {
      console.error('RecSys vote event error:', err?.message || err);
    }

    return { message: 'Vote removed' };
  }

  async removeTopicVote(topicId: string, userId: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at)
      throw new NotFoundException('Topic not found');

    await this.votesRepo.removeVote(topicId, userId);

    try {
      await RecommendationService.sendVoteEvent({
        type: 'vote.deleted',
        userId: userId,
        targetType: 'topic',
        targetId: topicId,
      });
    } catch (err) {
      console.error('RecSys vote event error:', err?.message || err);
    }

    return { message: 'Vote removed' };
  }

  async subscribeTopic(topicId: string, userId: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at)
      throw new NotFoundException('Topic not found');

    const existing = await this.topicSubscriptionsRepo.isSubscribed(
      topicId,
      userId,
    );
    if (existing) return { message: 'Already subscribed' };

    await this.topicSubscriptionsRepo.subscribe(topicId, userId);

    try {
      await RecommendationService.sendSubscriptionEvent({
        type: 'subscription.created',
        userId: userId,
        targetType: 'topic',
        targetId: topicId,
      });
    } catch (err) {
      console.error('RecSys subscription event error:', err?.message || err);
    }

    return { message: 'Subscribed' };
  }

  async unsubscribeTopic(topicId: string, userId: string) {
    const topic = await this.topicsRepo.findById(topicId);
    if (!topic || topic.deleted_at)
      throw new NotFoundException('Topic not found');

    const existing = await this.topicSubscriptionsRepo.isSubscribed(
      topicId,
      userId,
    );
    if (!existing) return { message: 'Not subscribed' };

    await this.topicSubscriptionsRepo.unsubscribe(topicId, userId);

    try {
      await RecommendationService.sendSubscriptionEvent({
        type: 'subscription.deleted',
        userId: userId,
        targetType: 'topic',
        targetId: topicId,
      });
    } catch (err) {
      console.error('RecSys subscription event error:', err?.message || err);
    }

    return { message: 'Unsubscribed' };
  }

  async getTopicDetails(topicId: string) {
    const topic = await this.topicsRepo.getTopicDetails(topicId);
    if (!topic) throw new NotFoundException('Topic not found');

    const [voteScore, commentsCount, subscriptionsCount, acceptedComment] =
      await Promise.all([
        this.votesRepo
          .getVotesForTargets([new Types.ObjectId(topicId)], 'topic')
          .then((res) => res[0]?.score || 0),
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
      vote_score: voteScore,
      comments_count: commentsCount,
      subscriptions_count: subscriptionsCount,
      accepted_comment: acceptedComment
        ? {
            id: acceptedComment._id,
            content: acceptedComment.content,
            user_id: acceptedComment.user_id,
            created_at: acceptedComment.get('created_at'),
          }
        : null,
    };
  }

  async searchTopics(dto: SearchTopicDto, userId?: string) {
    const { query, page, limit, substack_id } = dto;
    const normalizedQuery = (query ?? '').toString().trim();
    const pageNumber = Number(page ?? 1) || 1;
    const limitNumber = Number(limit ?? 10) || 10;

    let recommendedIds: string[] = [];
    if (!normalizedQuery && !substack_id && userId && pageNumber === 1) {
      try {
        recommendedIds = await RecommendationService.getPersonalizedTopicIds(
          userId,
          limitNumber,
        );
      } catch (err) {
        console.error('RecSys feed error:', err?.message || err);
        recommendedIds = [];
      }
    }

    const searchResult = await this.searchService.searchTopics(
      normalizedQuery,
      pageNumber,
      limitNumber,
      substack_id,
    );

    let topics: any[] = [];
    let total = 0;

    if (!normalizedQuery) {
      // Use MongoDB for general feed to ensure all topics are visible
      const fallback = await this.topicsRepo.getTopicsWithAggregates(
        normalizedQuery,
        pageNumber,
        limitNumber,
        substack_id,
      );
      topics = fallback.topics;
      total = fallback.total;
    } else {
      const searchResult = await this.searchService.searchTopics(
        normalizedQuery,
        pageNumber,
        limitNumber,
        substack_id,
      );

      if (searchResult.total === 0) {
        // Fallback to MongoDB if ES returns nothing for a query
        const fallback = await this.topicsRepo.getTopicsWithAggregates(
          normalizedQuery,
          pageNumber,
          limitNumber,
          substack_id,
        );
        topics = fallback.topics;
        total = fallback.total;
      } else {
        const dbTopics = await this.topicsRepo.findByIds(
          searchResult.ids.filter((id): id is string => typeof id === 'string'),
          substack_id,
        );

        const topicMap = new Map(
          dbTopics.map((topic) => [topic._id.toString(), topic]),
        );

        topics = searchResult.ids
          .filter((id): id is string => typeof id === 'string')
          .map((id) => topicMap.get(id))
          .filter(Boolean);
        total = searchResult.total;
      }
    }

    if (!normalizedQuery && recommendedIds.length > 0 && pageNumber === 1) {
      const recommendedTopics =
        await this.topicsRepo.findByIdsAny(recommendedIds);
      const recommendedMap = new Map(
        recommendedTopics.map((topic: any) => [topic._id.toString(), topic]),
      );
      const orderedRecommended = recommendedIds
        .map((id) => recommendedMap.get(id))
        .filter(Boolean);

      const combined: any[] = [];
      const seen = new Set<string>();

      // Limit recommendations to at most 3 items to ensure diversity
      const maxRecommendations = 3;

      for (const t of orderedRecommended) {
        if (combined.length >= maxRecommendations) break;
        seen.add(t._id.toString());
        combined.push(t);
      }

      for (const t of topics) {
        if (!seen.has(t._id.toString())) {
          combined.push(t);
          if (combined.length >= limitNumber) break;
        }
      }
      topics = combined;
      total = Math.max(total, topics.length); // Rough estimate for total
    }

    return await this.buildTopicSearchResponse(
      topics,
      pageNumber,
      limitNumber,
      total,
      userId,
    );
  }

  private async buildTopicSearchResponse(
    orderedTopics: any[],
    page: number,
    limit: number,
    total: number,
    userId?: string,
  ) {
    if (orderedTopics.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    }

    const topicIds = orderedTopics.map((topic: any) => topic._id);

    const [
      voteScores,
      commentsCounts,
      subscriptionsCounts,
      acceptedComments,
      isSubscribed,
    ] = await Promise.all([
      this.votesRepo.getVotesForTargets(topicIds, 'topic'),
      Promise.all(topicIds.map((id) => this.commentsRepo.countByTopic(id))),
      Promise.all(
        topicIds.map((id) => this.topicSubscriptionsRepo.countByTopic(id)),
      ),
      Promise.all(
        topicIds.map((id) => this.commentsRepo.getAcceptedComment(id)),
      ),
      userId
        ? Promise.all(
            topicIds.map((id) =>
              this.topicSubscriptionsRepo.isSubscribed(id, userId),
            ),
          )
        : Promise.resolve([]),
    ]);

    const voteScoreMap = Object.fromEntries(
      voteScores.map((v: any) => [v._id.toString(), v.score]),
    );
    const commentsMap = new Map(
      topicIds.map((id, index) => [id.toString(), commentsCounts[index] ?? 0]),
    );
    const subscriptionsMap = new Map(
      topicIds.map((id, index) => [
        id.toString(),
        subscriptionsCounts[index] ?? 0,
      ]),
    );
    const acceptedMap = new Map(
      topicIds.map((id, index) => [
        id.toString(),
        acceptedComments[index] ?? null,
      ]),
    );
    const subscribedMap = new Map(
      topicIds.map((id, index) => [
        id.toString(),
        isSubscribed[index] ?? false,
      ]),
    );

    return {
      data: orderedTopics.map((topic: any) => ({
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
        comments_count: commentsMap.get(topic._id.toString()) || 0,
        subscriptions_count: subscriptionsMap.get(topic._id.toString()) || 0,
        has_accepted_answer: !!acceptedMap.get(topic._id.toString()),
        is_subscribed: subscribedMap.get(topic._id.toString()) || false,
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

    const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;

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

  async deleteTopic(id: string, userId: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }
    if (topic.user_id.toString() !== userId) {
      throw new ForbiddenException('You are not the owner of this topic');
    }

    await this.topicsRepo.softDelete(id);

    await this.searchService.deleteTopic(id);

    return { message: 'Topic deleted successfully' };
  }

  async getTopicById(id: string, userId?: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    const [
      voteScore,
      commentsCount,
      subscriptionsCount,
      acceptedComment,
      isSubscribed,
    ] = await Promise.all([
      this.votesRepo
        .getVotesForTargets([new Types.ObjectId(id)], 'topic')
        .then((res) => res[0]?.score || 0),
      this.commentsRepo.countByTopic(id),
      this.topicSubscriptionsRepo.countByTopic(id),
      this.commentsRepo.getAcceptedComment(id),
      userId
        ? this.topicSubscriptionsRepo.isSubscribed(id, userId)
        : Promise.resolve(false),
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

  async markSolved(id: string, userId: string) {
    const topic = await this.topicsRepo.findById(id);
    if (!topic || topic.deleted_at) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.user_id.toString() !== userId) {
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
