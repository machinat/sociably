import { parse as parseUrl } from 'url';
import crypto from 'crypto';
import invariant from 'invariant';
import _BigIntJSON from 'json-bigint';
import type { PopEventWrapper, SociablyNode } from '@sociably/core';
import { WebhookReceiver, WebhookHandler } from '@sociably/http/webhook';
import { makeClassProvider } from '@sociably/core/service';
import eventFactory from './event/factory';
import BotP from './Bot';
import { ConfigsI, PlatformUtilitiesI } from './interface';
import { TWITTER } from './constant';
import type { TwitterEventContext } from './types';

const BigIntJSON = _BigIntJSON({ useNativeBigInt: true });

type TwitterReceiverOptions = {
  bot: BotP;
  appSecret: string;
  shouldVerifyRequest?: boolean;
  popEventWrapper: PopEventWrapper<TwitterEventContext, null>;
};

const verifyPayload = (secret: string, payload: string, signature: unknown) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');

  return signature === `sha256=${hmac.digest('base64')}`;
};

const handleWebhook = ({
  bot,
  popEventWrapper,
  appSecret,
  shouldVerifyRequest = true,
}: TwitterReceiverOptions): WebhookHandler => {
  const popEvent = popEventWrapper(() => Promise.resolve(null));

  return async (metadata) => {
    const { method, url, headers, body: rawBody } = metadata.request;

    // handle webhook challenge
    if (method === 'GET') {
      const { crc_token: crcToken, nonce } = parseUrl(url, true).query;
      if (typeof crcToken !== 'string') {
        return { code: 400 };
      }

      if (
        shouldVerifyRequest &&
        !verifyPayload(
          appSecret,
          `crc_token=${crcToken}&nonce=${nonce}`,
          headers['x-twitter-webhooks-signature']
        )
      ) {
        return { code: 401 };
      }

      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(crcToken);
      return {
        code: 200,
        body: { response_token: `sha256=${hmac.digest('base64')}` },
      };
    }

    // method not allowed
    if (method !== 'POST') {
      return { code: 405 };
    }

    if (!rawBody) {
      return { code: 400 };
    }

    if (
      shouldVerifyRequest &&
      !verifyPayload(
        appSecret,
        rawBody,
        headers['x-twitter-webhooks-signature']
      )
    ) {
      return { code: 401 };
    }

    let body: any;
    try {
      body = BigIntJSON.parse(rawBody);
    } catch (e) {
      return { code: 400 };
    }

    const issuingEvents: Promise<null>[] = [];
    const events = eventFactory(body);

    for (const event of events) {
      issuingEvents.push(
        popEvent({
          platform: TWITTER,
          bot,
          event,
          metadata,
          reply: async (message: SociablyNode) =>
            bot.render(event.channel, message),
        })
      );
    }

    await Promise.all(issuingEvents);
    return { code: 200 };
  };
};

/**
 * TwitterReceiver receive and pop events from Twitter platform.
 * @category Provider
 */
export class TwitterReceiver extends WebhookReceiver {
  constructor(options: TwitterReceiverOptions) {
    invariant(options?.appSecret, 'options.appSecret should not be empty');

    super(handleWebhook(options));
  }
}

const ReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, BotP, PlatformUtilitiesI],
  factory: ({ appSecret, shouldVerifyRequest }, bot, { popEventWrapper }) =>
    new TwitterReceiver({
      bot,
      popEventWrapper,
      appSecret,
      shouldVerifyRequest,
    }),
})(TwitterReceiver);

type ReceiverP = TwitterReceiver;
export default ReceiverP;
