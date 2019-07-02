// @flow
import redis from 'redis';
import thenifiedly from 'thenifiedly';
import type { MachinatChannel } from 'machinat-base/types';
import type { Session, SessionManager } from '../types';

type RedisClient = any;

type RedisSessionManagerOptions = {
  host?: string,
  port?: number,
  path?: string,
  url?: string,
  db?: number,
};

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

  async set(key: string, value: any) {
    await thenifiedly.callMethod(
      'hset',
      this._client,
      this._channel.uid,
      key,
      JSON.stringify(value)
    );
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

class RedisSessionManager implements SessionManager {
  client: RedisClient;

  options: RedisSessionManagerOptions;

  constructor(options: RedisSessionManagerOptions) {
    this.client = redis.createClient(options);
    this.options = options;
  }

  getSession(channel: MachinatChannel) {
    return new RedisSession(this.client, channel);
  }

  attachSession() {
    return (frame: Object) => ({
      ...frame,
      session: new RedisSession(this.client, frame.channel),
    });
  }
}

export default RedisSessionManager;
