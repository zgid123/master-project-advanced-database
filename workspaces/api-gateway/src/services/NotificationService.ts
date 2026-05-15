interface IListNotificationsParams {
  search?: string;
}

interface IMarkNotificationAsReadParams {
  id: string;
  userId: string;
}

export class NotificationService {
  readonly #baseUrl: string;

  constructor() {
    this.#baseUrl =
      process.env.NOTIFICATIONS_SERVICE_URL ??
      process.env.NOTIFICATION_SERVICE_URL ??
      'http://localhost:3002';
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

  public async markNotificationAsRead({
    id,
    userId,
  }: IMarkNotificationAsReadParams): Promise<Response> {
    const upstreamUrl = new URL(
      `/v1/notifications/${encodeURIComponent(id)}/read`,
      this.#baseUrl,
    );
    upstreamUrl.searchParams.set('userId', userId);

    return fetch(upstreamUrl, {
      method: 'PATCH',
    });
  }
}
