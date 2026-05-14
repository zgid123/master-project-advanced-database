export class NotificationService {
    #baseUrl;
    #internalServiceSecret;
    constructor() {
        this.#baseUrl =
            process.env.NOTIFICATIONS_SERVICE_URL ?? 'http://localhost:3002';
        this.#internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? '';
    }
    async createSignUpWelcomeNotification({ email, userId, }) {
        const response = await fetch(new URL('/internal/v1/notifications', this.#baseUrl), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-service-secret': this.#internalServiceSecret,
            },
            body: JSON.stringify({
                type: 'auth.sign-up.welcome',
                userId,
                data: {
                    email,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create sign-up welcome notification: ${response.status}`);
        }
    }
    async createSubstackSubscribedNotification({ userId, actorName, substackId, actorUserId, substackName, substackSlug, }) {
        const response = await fetch(new URL('/internal/v1/notifications', this.#baseUrl), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-service-secret': this.#internalServiceSecret,
            },
            body: JSON.stringify({
                userId,
                type: 'substack.subscribed',
                data: {
                    actorName,
                    substackId,
                    actorUserId,
                    substackName,
                    substackSlug,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create substack subscribed notification: ${response.status}`);
        }
    }
    async createSocialUserSubscribedNotification({ userId, actorName, actorUserId, }) {
        const response = await fetch(new URL('/internal/v1/notifications', this.#baseUrl), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-internal-service-secret': this.#internalServiceSecret,
            },
            body: JSON.stringify({
                userId,
                type: 'social.user.subscribed',
                data: {
                    actorName,
                    actorUserId,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create social user subscribed notification: ${response.status}`);
        }
    }
}
