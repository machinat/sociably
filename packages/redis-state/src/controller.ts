import { RedisClient } from 'redis';
import thenifiedly from 'thenifiedly';
import type { MachinatUser, MachinatChannel } from '@machinat/core';
import { makeClassProvider } from '@machinat/core/service';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateController';
import { ClientI } from './interface';

type CallClientFn = (method: string, ...params: string[]) => Promise<any>;

export class RedisStateAccessor implements StateAccessor {
  private _stateKey: string;
  private _callClient: CallClientFn;
  private _marshaler: BaseMarshaler;

  constructor(callClient: CallClientFn, marshaler: BaseMarshaler, key: string) {
    this._callClient = callClient;
    this._marshaler = marshaler;
    this._stateKey = key;
  }

  async get<T>(key: string): Promise<T> {
    const result = await this._callClient('hget', this._stateKey, key);

    return result ? this._parseValue(result) : undefined;
  }

  async set<T>(key: string, state: T): Promise<boolean> {
    const newFieldCount = await this._callClient(
      'hset',
      this._stateKey,
      key,
      this._stringifyValue(state)
    );

    return !newFieldCount;
  }

  update<T>(key: string, updator: (value: undefined | T) => T): Promise<T>;
  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<undefined | T> {
    const currentData = await this._callClient('hget', this._stateKey, key);

    const currentValue = this._parseValue(currentData);
    const newValue = updator(currentData ? currentValue : undefined);

    if (newValue === undefined) {
      await this._callClient('hdel', this._stateKey, key);
    } else if (newValue !== currentValue) {
      await this._callClient(
        'hset',
        this._stateKey,
        key,
        this._stringifyValue(newValue)
      );
    }

    return newValue;
  }

  async delete(key: string): Promise<boolean> {
    const fieldCount = await this._callClient('hdel', this._stateKey, key);
    return !!fieldCount;
  }

  async keys(): Promise<string[]> {
    const result = await this._callClient('hkeys', this._stateKey);
    return result;
  }

  async getAll<T>(): Promise<Map<string, T>> {
    const result = await this._callClient('hgetall', this._stateKey);
    if (!result) {
      return new Map();
    }

    return new Map(
      Object.entries<string>(result).map(([key, value]) => [
        key,
        this._parseValue(value),
      ])
    );
  }

  async clear(): Promise<undefined> {
    await this._callClient('del', this._stateKey);
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
  private _marshaler: BaseMarshaler;

  constructor(client: RedisClient, marshaler?: null | BaseMarshaler) {
    this._client = client;
    this._marshaler = marshaler || {
      marshal: identity,
      unmarshal: identity,
    };
  }

  channelState(channel: string | MachinatChannel): RedisStateAccessor {
    const channelUid = typeof channel === 'string' ? channel : channel.uid;

    return new RedisStateAccessor(
      this._callClientFn,
      this._marshaler,
      `$channel:${channelUid}`
    );
  }

  userState(user: string | MachinatUser): RedisStateAccessor {
    const userUid = typeof user === 'string' ? user : user.uid;

    return new RedisStateAccessor(
      this._callClientFn,
      this._marshaler,
      `$user:${userUid}`
    );
  }

  globalState(name: string): RedisStateAccessor {
    return new RedisStateAccessor(
      this._callClientFn,
      this._marshaler,
      `$global:${name}`
    );
  }

  private _callClientFn = this.callClient.bind(this);

  async callClient(
    method: string,
    ...params: (string | number)[]
  ): Promise<any> {
    const result = await thenifiedly.callMethod(
      method,
      this._client,
      ...params
    );
    return result;
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ClientI, { require: BaseMarshaler, optional: true }] as const,
})(RedisStateController);

export type ControllerP = RedisStateController;
