interface IListNotificationsParams {
  search?: string;
}

export class NotificationService {
  readonly #baseUrl: string;

  constructor() {
    this.#baseUrl =
      process.env.NOTIFICATIONS_SERVICE_URL ?? 'http://localhost:3002';
  }

  public async listNotifications({
    search = '',
  }: IListNotificationsParams): Promise<Response> {
    const upstreamUrl = new URL('/v1/notifications', this.#baseUrl);
    upstreamUrl.search = search;

    return fetch(upstreamUrl, {
      method: 'GET',
    });
  }
}
