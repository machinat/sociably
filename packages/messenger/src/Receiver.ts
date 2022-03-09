import { parse as parseUrl } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';
import type { PopEventWrapper } from '@machinat/core';
import { WebhookReceiver, WebhookHandler } from '@machinat/http/webhook';
import { makeClassProvider } from '@machinat/core/service';
import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { MESSENGER } from './constant';
import type { MessengerEventContext } from './types';

type MessengerReceiverOptions = {
  bot: BotP;
  popEventWrapper: PopEventWrapper<MessengerEventContext, null>;
  appSecret?: string;
  shouldVerifyRequest?: boolean;
  shouldHandleChallenge?: boolean;
  verifyToken?: string;
};

const handleWebhook = ({
  shouldHandleChallenge,
  verifyToken,
  shouldVerifyRequest,
  appSecret,
  bot,
  popEventWrapper,
}: MessengerReceiverOptions): WebhookHandler => {
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
    if (shouldVerifyRequest && appSecret !== undefined) {
      const hmac = crypto.createHmac('sha1', appSecret);

      hmac.update(rawBody, 'utf8');
      const computedSig = `sha1=${hmac.digest('hex')}`;

      if (headers['x-hub-signature'] !== computedSig) {
        return { code: 401 };
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }

    if (body.object !== 'page') {
      return { code: 404 };
    }

    const issuingEvents: Promise<null>[] = [];

    // parse and pop event context
    for (const { id: pageId, messaging, stanby } of body.entry) {
      const isStandby = stanby !== undefined;
      const rawEvents = isStandby ? stanby : messaging;

      for (const rawEvent of rawEvents) {
        const event = eventFactory(pageId, isStandby, rawEvent);

        issuingEvents.push(
          popEvent({
            platform: MESSENGER,
            bot,
            event,
            metadata,
            reply: async (message) =>
              event.channel
                ? bot.render(event.channel, message)
                : Promise.resolve(null),
          })
        );
      }
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * MessengerReceiver receive and pop events from Messenger platform.
 * @category Provider
 */
export class MessengerReceiver extends WebhookReceiver {
  constructor({
    bot,
    popEventWrapper,
    shouldHandleChallenge = true,
    verifyToken,
    shouldVerifyRequest = true,
    appSecret,
  }: MessengerReceiverOptions) {
    invariant(
      !shouldVerifyRequest || appSecret,
      'appSecret should not be empty if shouldVerifyRequest set to true'
    );

    invariant(
      !shouldHandleChallenge || verifyToken,
      'verifyToken should not be empty if shouldHandleChallenge set to true'
    );

    super(
      handleWebhook({
        bot,
        popEventWrapper,
        shouldHandleChallenge,
        verifyToken,
        shouldVerifyRequest,
        appSecret,
      })
    );
  }
}

const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: (
    { shouldHandleChallenge, verifyToken, shouldVerifyRequest, appSecret },
    bot,
    { popEventWrapper }
  ) =>
    new MessengerReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge,
      verifyToken,
      shouldVerifyRequest,
      appSecret,
    }),
})(MessengerReceiver);

type ReceiverP = MessengerReceiver;
export default ReceiverP;
