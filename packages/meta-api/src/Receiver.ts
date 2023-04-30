import { parse as parseUrl } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';
import type {
  SociablyEvent,
  PopEventWrapper,
  EventContext,
} from '@sociably/core';
import type { WebhookMetadata } from '@sociably/http/webhook';
import { WebhookReceiver, WebhookHandler } from '@sociably/http/webhook';

type MetaApiEventContext = EventContext<
  SociablyEvent<unknown>,
  WebhookMetadata,
  any
>;

type MetaWebhookReceiverOptions<Context extends MetaApiEventContext> = {
  bot: Context['bot'];
  platform: Context['platform'];
  makeEventsFromUpdate: (raw) => Context['event'][];
  objectType: string;
  appSecret: string;
  verifyToken: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
  popEventWrapper: PopEventWrapper<Context, null>;
};

const handleWebhook = <Context extends MetaApiEventContext>({
  bot,
  platform,
  makeEventsFromUpdate,
  objectType,
  appSecret,
  verifyToken,
  shouldVerifyRequest,
  shouldHandleChallenge,
  popEventWrapper,
}: MetaWebhookReceiverOptions<Context>): WebhookHandler => {
  const popEvent = popEventWrapper(() => Promise.resolve(null));

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
        query['hub.verify_token'] !== verifyToken
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

    // verify object type
    if (body.object !== objectType) {
      return { code: 404 };
    }

    const issuingEvents: Promise<null>[] = [];

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

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * MetaWebhookReceiver receive and pop events from Meta platforms.
 * @category Provider
 */
class MetaWebhookReceiver<
  Context extends MetaApiEventContext
> extends WebhookReceiver {
  constructor({
    appSecret,
    verifyToken,
    shouldHandleChallenge = true,
    shouldVerifyRequest = true,
    ...restOptions
  }: MetaWebhookReceiverOptions<Context>) {
    invariant(
      !shouldVerifyRequest || appSecret,
      'appSecret should not be empty if shouldVerifyRequest set to true'
    );

    invariant(
      !shouldHandleChallenge || verifyToken,
      'verifyToken should not be empty if shouldHandleChallenge set to true'
    );

    super(
      handleWebhook<Context>({
        shouldHandleChallenge,
        verifyToken,
        shouldVerifyRequest,
        appSecret,
        ...restOptions,
      })
    );
  }
}

export default MetaWebhookReceiver;
