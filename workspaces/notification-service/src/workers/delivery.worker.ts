import { UnrecoverableError, Worker, type Job } from 'bullmq';
import { config } from '../config.js';
import { DeliveryRepo } from '../domain/deliveries/delivery.repo.js';
import { deliveryStatus, type DeliveryJobPayload, type DeliveryProviderResult } from '../domain/deliveries/delivery.types.js';
import { logger } from '../observability/logger.js';
import { notificationDeliveryAttempts } from '../observability/metrics.js';
import { bullConnection, queueNames } from './queues.js';

async function sendEmail(job: DeliveryJobPayload): Promise<DeliveryProviderResult> {
  if (!config.sendgridApiKey) {
    return {
      status: deliveryStatus.skipped,
      provider: 'sendgrid',
      error_code: 'PROVIDER_NOT_CONFIGURED',
      error_message: 'SENDGRID_API_KEY is not configured',
    };
  }

  const to = typeof job.metadata.email === 'string' ? job.metadata.email : null;
  if (!to) {
    return {
      status: deliveryStatus.skipped,
      provider: 'sendgrid',
      error_code: 'RECIPIENT_EMAIL_MISSING',
      error_message: 'metadata.email is required for email delivery',
    };
  }

  const requestPayload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: config.sendgridFromEmail },
    subject: job.title,
    content: [{ type: 'text/plain', value: job.body }],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.sendgridApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (response.ok) {
    return {
      status: deliveryStatus.sent,
      provider: 'sendgrid',
      provider_msg_id: response.headers.get('x-message-id'),
      request_payload: requestPayload,
      response_payload: { status: response.status },
    };
  }

  const responseText = await response.text();
  const error = response.status >= 500
    ? new Error(`SendGrid transient failure: ${response.status}`)
    : new UnrecoverableError(`SendGrid permanent failure: ${response.status}`);
  Object.assign(error, {
    providerResult: {
      status: deliveryStatus.failed,
      provider: 'sendgrid',
      error_code: `HTTP_${response.status}`,
      error_message: responseText.slice(0, 1000),
      request_payload: requestPayload,
      response_payload: { status: response.status, body: responseText.slice(0, 2000) },
    },
  });
  throw error;
}

async function sendPush(job: DeliveryJobPayload): Promise<DeliveryProviderResult> {
  const provider = job.channel_code === 'web_push' ? 'web-push' : 'fcm-apns';
  const configured = job.channel_code === 'web_push'
    ? Boolean(config.webPushVapidPublicKey && config.webPushVapidPrivateKey)
    : Boolean(config.fcmServiceAccountJson || (config.apnsKeyId && config.apnsTeamId));

  if (!configured) {
    return {
      status: deliveryStatus.skipped,
      provider,
      error_code: 'PROVIDER_NOT_CONFIGURED',
      error_message: `${provider} credentials are not configured`,
    };
  }

  return {
    status: deliveryStatus.skipped,
    provider,
    error_code: 'PROVIDER_STUB',
    error_message: 'Push transport is wired for queueing and delivery logs; provider SDK call is intentionally stubbed',
  };
}

async function sendSms(_job: DeliveryJobPayload): Promise<DeliveryProviderResult> {
  return {
    status: deliveryStatus.skipped,
    provider: 'sms',
    error_code: 'PROVIDER_NOT_CONFIGURED',
    error_message: 'SMS provider is not configured for the prototype',
  };
}

async function deliver(job: Job<DeliveryJobPayload>): Promise<void> {
  const payload = job.data;
  const channelId = await DeliveryRepo.channelIdByCode(payload.channel_code);
  const attempt = await DeliveryRepo.startAttempt({
    notification_id: payload.notification_id,
    notification_created_at: payload.notification_created_at,
    user_id: payload.user_id,
    channel_id: channelId,
    attempt: job.attemptsMade + 1,
    request_payload: payload,
  });

  try {
    const result = payload.channel_code === 'email'
      ? await sendEmail(payload)
      : payload.channel_code === 'sms'
        ? await sendSms(payload)
        : await sendPush(payload);
    await DeliveryRepo.finishAttempt(attempt, result);
    notificationDeliveryAttempts.inc({ channel: payload.channel_code, status: String(result.status) });
  } catch (error) {
    const providerResult = (error as { providerResult?: DeliveryProviderResult }).providerResult ?? {
      status: deliveryStatus.failed,
      provider: payload.channel_code,
      error_code: 'DELIVERY_ERROR',
      error_message: error instanceof Error ? error.message : String(error),
    };
    await DeliveryRepo.finishAttempt(attempt, providerResult);
    notificationDeliveryAttempts.inc({ channel: payload.channel_code, status: String(deliveryStatus.failed) });
    throw error;
  }
}

const connection = bullConnection();
const workers = [
  new Worker(queueNames.email, deliver, { connection, concurrency: 20 }),
  new Worker(queueNames.webPush, deliver, { connection, concurrency: 30 }),
  new Worker(queueNames.mobilePush, deliver, { connection, concurrency: 30 }),
  new Worker(queueNames.sms, deliver, { connection, concurrency: 10 }),
];

for (const worker of workers) {
  worker.on('failed', (job, error) => {
    logger.error({ error, jobId: job?.id, queue: worker.name }, 'delivery job failed');
  });
}

logger.info('notification delivery workers started');
