import axios from 'axios';

export class NotificationService {
  static async sendNotification(payload: any) {
    const BASE_URL = process.env.NOTIFICATION_SERVICE_BASE_URL;
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

    if (!BASE_URL || !INTERNAL_SECRET) return;
    try {
      await axios.post(
        `${BASE_URL}/internal/v1/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-service-secret': INTERNAL_SECRET,
          },
          timeout: 2000,
        }
      );
    } catch (err) {
      console.error('Notification error:', err?.message || err);
    }
  }
}
