interface ICreateSignUpWelcomeNotificationParams {
  email: string;
  userId: string;
}

export class NotificationService {
  readonly #baseUrl: string;
  readonly #internalServiceSecret: string;

  constructor() {
    this.#baseUrl =
      process.env.NOTIFICATIONS_SERVICE_URL ?? 'http://localhost:3002';
    this.#internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? '';
  }

  public async createSignUpWelcomeNotification({
    email,
    userId,
  }: ICreateSignUpWelcomeNotificationParams): Promise<void> {
    const response = await fetch(
      new URL('/internal/v1/notifications', this.#baseUrl),
      {
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
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create sign-up welcome notification: ${response.status}`,
      );
    }
  }
}
