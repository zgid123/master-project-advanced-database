export class RecsysService {
  readonly #baseUrl: string;
  readonly #internalServiceSecret: string;

  constructor() {
    this.#baseUrl = process.env.RECSYS_SERVICE_URL ?? 'http://localhost:3020';
    this.#internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? '';
  }

  public async createSubscriptionEvent(
    userId: string,
    targetType: 'substack' | 'topic',
    targetId: string,
  ): Promise<void> {
    const response = await fetch(
      new URL('/v1/internal/events/subscription', this.#baseUrl),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-service-secret': this.#internalServiceSecret,
        },
        body: JSON.stringify({
          type: 'subscription.created',
          userId,
          targetType,
          targetId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create recsys subscription event: ${response.status}`,
      );
    }
  }

  public async deleteSubscriptionEvent(
    userId: string,
    targetType: 'substack' | 'topic',
    targetId: string,
  ): Promise<void> {
    const response = await fetch(
      new URL('/v1/internal/events/subscription', this.#baseUrl),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-service-secret': this.#internalServiceSecret,
        },
        body: JSON.stringify({
          type: 'subscription.deleted',
          userId,
          targetType,
          targetId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to delete recsys subscription event: ${response.status}`,
      );
    }
  }
}
