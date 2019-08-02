// @flow
import thenifiedly from 'thenifiedly';
import type { MachinatChannel } from 'machinat-base/types';
import type { Session, SessionStore } from '../types';

type RedisClient = any;

class RedisSession implements Session {
  _client: RedisClient;
  _channel: MachinatChannel;

  constructor(client: RedisClient, channel: MachinatChannel) {
    this._client = client;
    this._channel = channel;
  }

  async get(key: string) {
    const result = await thenifiedly.callMethod(
      'hget',
      this._client,
      this._channel.uid,
      key
    );

    return result ? JSON.parse(result) : undefined;
  }

  async set(key: string, state: any) {
    await thenifiedly.callMethod(
      'hset',
      this._client,
      this._channel.uid,
      key,
      JSON.stringify(state)
    );
  }

  async update(key: string, update: any => any) {
    let updated = null;

    while (updated === null) {
      /* eslint-disable no-await-in-loop */
      await thenifiedly.callMethod('watch', this._client, this._channel.uid);

      const state = await this.get(key);
      updated = await thenifiedly.callMethod(
        'exec',
        this._client
          .multi()
          .hset(this._channel.uid, key, JSON.stringify(update(state)))
      );
      /* eslint-enable no-await-in-loop */
    }
  }

  async delete(key: string) {
    const result = await thenifiedly.callMethod(
      'hdel',
      this._client,
      this._channel.uid,
      key
    );

    return !!result;
  }

  async clear() {
    await thenifiedly.callMethod('del', this._client, this._channel.uid);
  }
}

class RedisSessionStore implements SessionStore {
  client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  getSession(channel: MachinatChannel) {
    return new RedisSession(this.client, channel);
  }
}

export default RedisSessionStore;
