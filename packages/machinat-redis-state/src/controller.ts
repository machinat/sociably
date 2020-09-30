import { RedisClient } from 'redis';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateControllerI';
import { CLIENT_I } from './interface';

export class RedisStateAccessor implements StateAccessor {
  private _stateKey: string;
  private _client: RedisClient;

  constructor(client: RedisClient, key: string) {
    this._client = client;
    this._stateKey = key;
  }

  async get<T>(key: string): Promise<T> {
    const result = await thenifiedly.callMethod(
      'hget',
      this._client,
      this._stateKey,
      key
    );

    return result ? JSON.parse(result) : undefined;
  }

  async set<T>(key: string, state: T): Promise<boolean> {
    const result = await thenifiedly.callMethod(
      'hset',
      this._client,
      this._stateKey,
      key,
      JSON.stringify(state)
    );

    return !!result;
  }

  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<boolean> {
    const existedData = await thenifiedly.callMethod(
      'hget',
      this._client,
      this._stateKey,
      key
    );

    const newValue = updator(existedData ? JSON.parse(existedData) : undefined);

    if (newValue) {
      const result = await thenifiedly.callMethod(
        'hset',
        this._client,
        this._stateKey,
        key,
        JSON.stringify(newValue)
      );

      return !!result;
    }

    const result = await thenifiedly.callMethod(
      'hdel',
      this._client,
      this._stateKey,
      key
    );

    return !!result;
  }

  async delete(key: string): Promise<boolean> {
    const result = await thenifiedly.callMethod(
      'hdel',
      this._client,
      this._stateKey,
      key
    );

    return !!result;
  }

  async getAll(): Promise<Map<string, any>> {
    const result = await thenifiedly.callMethod(
      'hgetall',
      this._client,
      this._stateKey
    );
    if (!result) {
      return new Map();
    }

    return new Map<string, any>(
      Object.entries<string>(result).map(([key, value]) => [
        key,
        JSON.parse(value),
      ])
    );
  }

  async clear(): Promise<undefined> {
    await thenifiedly.callMethod('del', this._client, this._stateKey);
    return undefined;
  }
}

/**
 * @category Provider
 */
export class RedisStateController implements BaseStateController {
  private _client: RedisClient;

  constructor(client: RedisClient) {
    this._client = client;
  }

  channelState(channel: MachinatChannel): RedisStateAccessor {
    return new RedisStateAccessor(this._client, `channel:${channel.uid}`);
  }

  userState(user: MachinatUser): RedisStateAccessor {
    return new RedisStateAccessor(this._client, `user:${user.uid}`);
  }

  globalState(name: string): RedisStateAccessor {
    return new RedisStateAccessor(this._client, `global:${name}`);
  }
}

export const ControllerP = provider<RedisStateController>({
  lifetime: 'singleton',
  deps: [CLIENT_I],
})(RedisStateController);

export type ControllerP = RedisStateController;
