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
    let isUpdated = null;
    const { uid } = this._channel;

    while (isUpdated === null) {
      /* eslint-disable no-await-in-loop */
      await thenifiedly.callMethod('watch', this._client, uid);

      const state = await this.get(key);
      const newState = update(state);

      let multi = this._client.multi();
      if (newState === undefined) {
        multi.hdel(uid, key);
      } else {
        multi = multi.hset(uid, key, JSON.stringify(newState));
      }

      isUpdated = await thenifiedly.callMethod('exec', multi);
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
