import { parse as parseUrl } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';
import { serviceInterface } from '@sociably/core';
import { WebhookReceiver, WebhookHandler } from '@sociably/http/webhook';
import { ListeningPlatformOptions, MetaApiEventContext } from './types.js';

export type MetaWebhookReceiverOptions<Context extends MetaApiEventContext> = {
  listeningPlatforms: ListeningPlatformOptions<Context>[];
  appSecret: string;
  webhookVerifyToken: string;
  shouldHandleChallenge: boolean;
  shouldVerifyRequest: boolean;
};

const handleWebhook = <Context extends MetaApiEventContext>({
  listeningPlatforms,
  appSecret,
  webhookVerifyToken,
  shouldHandleChallenge,
  shouldVerifyRequest,
}: MetaWebhookReceiverOptions<Context>): WebhookHandler => {
  const platformOptionsByObjectType = new Map<
    string,
    ListeningPlatformOptions<Context>[]
  >();
  for (const platform of listeningPlatforms) {
    const { objectType } = platform;
    const registeredPlatform = platformOptionsByObjectType.get(objectType);

    if (registeredPlatform) {
      registeredPlatform.push(platform);
    } else {
      platformOptionsByObjectType.set(objectType, [platform]);
    }
  }

  return async (metadata) => {
    const { method, url, headers, body: rawBody } = metadata.request;

    // handle webhook verification
    if (method === 'GET') {
      if (!shouldHandleChallenge) {
        return { code: 403 };
      }

      const { query } = parseUrl(url, true);
      if (
        query['hub.mode'] !== 'subscribe' ||
        query['hub.verify_token'] !== webhookVerifyToken
      ) {
        return { code: 400 };
      }

      return { code: 200, body: query['hub.challenge'] };
    }

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    // validate request signature
    if (shouldVerifyRequest) {
      const hmac = crypto.createHmac('sha1', appSecret);

      hmac.update(rawBody, 'utf8');
      const computedSig = `sha1=${hmac.digest('hex')}`;

      if (headers['x-hub-signature'] !== computedSig) {
        return { code: 401 };
      }
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }
    if (!Array.isArray(body.entry)) {
      return { code: 400 };
    }

    const platformOptions = platformOptionsByObjectType.get(body.object);
    if (!platformOptions) {
      return { code: 404 };
    }

    const issuingEvents: Promise<null>[] = [];

    for (const {
      platform,
      bot,
      objectType,
      makeEventsFromUpdate,
      popEvent,
    } of platformOptions) {
      if (body.object === objectType) {
        // parse and pop event context
        const events: Context['event'][] = [];
        for (const updateData of body.entry as unknown[]) {
          events.push(...makeEventsFromUpdate(updateData));
        }

        for (const event of events) {
          issuingEvents.push(
            popEvent({
              platform,
              bot,
              event,
              metadata,
              reply: async (message) =>
                event.thread
                  ? bot.render(event.thread, message)
                  : Promise.resolve(null),
            } as Context)
          );
        }
      }
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

const MetaListeningPlatformsI = serviceInterface<
  ListeningPlatformOptions<MetaApiEventContext>
>({
  name: 'MetaListeningPlatforms',
  multi: true,
});

/**
 * MetaWebhookReceiver receive and pop events from Meta platforms.
 * @category Provider
 */
export class MetaWebhookReceiver<
  Context extends MetaApiEventContext,
> extends WebhookReceiver {
  static ListeningPlatforms = MetaListeningPlatformsI;

  constructor({
    appSecret,
    webhookVerifyToken,
    shouldHandleChallenge,
    shouldVerifyRequest,
    listeningPlatforms,
  }: MetaWebhookReceiverOptions<Context>) {
    invariant(
      !shouldVerifyRequest || appSecret,
      'appSecret should not be empty if shouldVerifyRequest set to true'
    );

    invariant(
      !shouldHandleChallenge || webhookVerifyToken,
      'webhookVerifyToken should not be empty if shouldHandleChallenge set to true'
    );

    super(
      handleWebhook<Context>({
        shouldHandleChallenge,
        shouldVerifyRequest,
        webhookVerifyToken,
        appSecret,
        listeningPlatforms,
      })
    );
  }
}

export default MetaWebhookReceiver;
