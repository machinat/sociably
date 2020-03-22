// @flow
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import { StateRepositoryI } from '../../interface';
import { RedisClientI } from './interface';

class RedisRepository implements StateRepositoryI {
  _client: RedisClientI;

  constructor(client: RedisClientI) {
    this._client = client;
  }

  async get(name: string, key: string) {
    const result = await thenifiedly.callMethod(
      'hget',
      this._client,
      name,
      key
    );

    return result ? JSON.parse(result) : null;
  }

  async set(name: string, key: string, state: any) {
    const result = await thenifiedly.callMethod(
      'hset',
      this._client,
      name,
      key,
      JSON.stringify(state)
    );

    return !!result;
  }

  async delete(name: string, key: string) {
    const result = await thenifiedly.callMethod(
      'hdel',
      this._client,
      name,
      key
    );

    return !!result;
  }

  async getAll(name: string) {
    const result = await thenifiedly.callMethod('hgetall', this._client, name);
    if (!result) {
      return null;
    }

    return new Map<string, any>(
      Object.entries(result).map(([key, value]) => [
        key,
        JSON.parse((value: any)),
      ])
    );
  }

  async clear(name: string) {
    await thenifiedly.callMethod('del', this._client, name);
  }
}

export default provider<RedisRepository>({
  lifetime: 'singleton',
  deps: [RedisClientI],
})(RedisRepository);
