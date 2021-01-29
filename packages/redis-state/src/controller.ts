import { RedisClient } from 'redis';
import thenifiedly from 'thenifiedly';
import { makeClassProvider } from '@machinat/core/service';
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import Base from '@machinat/core/base';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateControllerI';
import { ClientI } from './interface';

export class RedisStateAccessor implements StateAccessor {
  private _stateKey: string;
  private _client: RedisClient;
  private _marshaler: Base.Marshaler;

  constructor(client: RedisClient, marshaler: Base.Marshaler, key: string) {
    this._client = client;
    this._marshaler = marshaler;
    this._stateKey = key;
  }

  async get<T>(key: string): Promise<T> {
    const result = await thenifiedly.callMethod(
      'hget',
      this._client,
      this._stateKey,
      key
    );

    return result ? this._parseValue(result) : undefined;
  }

  async set<T>(key: string, state: T): Promise<boolean> {
    const newFieldCount = await thenifiedly.callMethod(
      'hset',
      this._client,
      this._stateKey,
      key,
      this._stringifyValue(state)
    );

    return !newFieldCount;
  }

  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<boolean> {
    const currentData = await thenifiedly.callMethod(
      'hget',
      this._client,
      this._stateKey,
      key
    );

    const newValue = updator(
      currentData ? this._parseValue(currentData) : undefined
    );

    if (newValue) {
      const newFieldCount = await thenifiedly.callMethod(
        'hset',
        this._client,
        this._stateKey,
        key,
        this._stringifyValue(newValue)
      );
      return !newFieldCount;
    }

    const deletedFieldCount = await thenifiedly.callMethod(
      'hdel',
      this._client,
      this._stateKey,
      key
    );
    return !!deletedFieldCount;
  }

  async delete(key: string): Promise<boolean> {
    const fieldCount = await thenifiedly.callMethod(
      'hdel',
      this._client,
      this._stateKey,
      key
    );
    return !!fieldCount;
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
        this._parseValue(value),
      ])
    );
  }

  async clear(): Promise<undefined> {
    await thenifiedly.callMethod('del', this._client, this._stateKey);
    return undefined;
  }

  private _stringifyValue(value: unknown) {
    return JSON.stringify(this._marshaler.marshal(value));
  }

  private _parseValue(content: string) {
    return this._marshaler.unmarshal(JSON.parse(content));
  }
}

const identity = (x) => x;

/**
 * @category Provider
 */
export class RedisStateController implements BaseStateController {
  private _client: RedisClient;
  private _marshaler: Base.Marshaler;

  constructor(client: RedisClient, marshaler?: null | Base.Marshaler) {
    this._client = client;
    this._marshaler = marshaler || {
      marshal: identity,
      unmarshal: identity,
    };
  }

  channelState(channel: MachinatChannel): RedisStateAccessor {
    return new RedisStateAccessor(
      this._client,
      this._marshaler,
      `channel:${channel.uid}`
    );
  }

  userState(user: MachinatUser): RedisStateAccessor {
    return new RedisStateAccessor(
      this._client,
      this._marshaler,
      `user:${user.uid}`
    );
  }

  globalState(name: string): RedisStateAccessor {
    return new RedisStateAccessor(
      this._client,
      this._marshaler,
      `global:${name}`
    );
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ClientI, { require: Base.Marshaler, optional: true }] as const,
})(RedisStateController);

export type ControllerP = RedisStateController;
