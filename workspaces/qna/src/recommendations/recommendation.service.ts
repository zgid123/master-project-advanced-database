import axios from 'axios';

type TFeedItem = {
    topicId: string;
    score: number;
    substackId: string | null;
};

type TFeedResponse = {
    items: TFeedItem[];
    nextCursor?: string | null;
};

type TVoteType = 'up' | 'down';

type TVoteEvent =
    | {
        type: 'vote.created';
        userId: string;
        targetType: 'topic' | 'comment';
        targetId: string;
        voteType: TVoteType;
        substackId?: string | null;
    }
    | {
        type: 'vote.deleted';
        userId: string;
        targetType: 'topic' | 'comment';
        targetId: string;
        substackId?: string | null;
    };

type TSubscriptionEvent =
    | {
        type: 'subscription.created';
        userId: string;
        targetType: 'topic' | 'substack';
        targetId: string;
    }
    | {
        type: 'subscription.deleted';
        userId: string;
        targetType: 'topic' | 'substack';
        targetId: string;
    };

type TTopicEvent = {
    type: 'topic.upsert' | 'topic.deleted';
    topicId: string;
    substackId?: string | null;
    authorId?: string;
    createdAt?: number;
};

type TCommentEvent = {
    type: 'comment.upsert' | 'comment.deleted';
    commentId: string;
    topicId: string;
    authorId?: string;
    createdAt?: number;
};

export class RecommendationService {
    private static getBaseUrl() {
        return process.env.RECSYS_SERVICE_BASE_URL;
    }

    private static getInternalSecret() {
        return (
            process.env.RECSYS_INTERNAL_SERVICE_SECRET ??
            process.env.INTERNAL_SERVICE_SECRET
        );
    }

    static async getPersonalizedTopicIds(userId: string, limit: number) {
        const baseUrl = RecommendationService.getBaseUrl();
        if (!baseUrl) return [] as string[];

        try {
            const response = await axios.get<TFeedResponse>(
                `${baseUrl}/v1/feed`,
                {
                    headers: {
                        'x-user-id': userId,
                    },
                    params: { limit },
                    timeout: 2000,
                },
            );

            return (response.data?.items ?? [])
                .map((item) => item.topicId)
                .filter(Boolean);
        } catch (err) {
            console.error('RecSys feed error:', err?.message || err);
            return [] as string[];
        }
    }

    static async sendVoteEvent(event: TVoteEvent) {
        const baseUrl = RecommendationService.getBaseUrl();
        const secret = RecommendationService.getInternalSecret();
        if (!baseUrl || !secret) return;

        try {
            await axios.post(`${baseUrl}/v1/internal/events/vote`, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-service-secret': secret,
                },
                timeout: 2000,
            });
        } catch (err) {
            console.error('RecSys vote event error:', err?.message || err);
        }
    }

    static async sendSubscriptionEvent(event: TSubscriptionEvent) {
        const baseUrl = RecommendationService.getBaseUrl();
        const secret = RecommendationService.getInternalSecret();
        if (!baseUrl || !secret) return;

        try {
            await axios.post(`${baseUrl}/v1/internal/events/subscription`, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-service-secret': secret,
                },
                timeout: 2000,
            });
        } catch (err) {
            console.error('RecSys subscription event error:', err?.message || err);
        }
    }

    static async sendTopicEvent(event: TTopicEvent) {
        const baseUrl = RecommendationService.getBaseUrl();
        const secret = RecommendationService.getInternalSecret();
        if (!baseUrl || !secret) return;

        try {
            await axios.post(`${baseUrl}/v1/internal/events/topic`, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-service-secret': secret,
                },
                timeout: 2000,
            });
        } catch (err) {
            console.error('RecSys topic event error:', err?.message || err);
        }
    }

    static async sendCommentEvent(event: TCommentEvent) {
        const baseUrl = RecommendationService.getBaseUrl();
        const secret = RecommendationService.getInternalSecret();
        if (!baseUrl || !secret) return;

        try {
            await axios.post(`${baseUrl}/v1/internal/events/comment`, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-service-secret': secret,
                },
                timeout: 2000,
            });
        } catch (err) {
            console.error('RecSys comment event error:', err?.message || err);
        }
    }
}
