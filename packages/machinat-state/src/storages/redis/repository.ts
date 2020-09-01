import { RedisClient } from 'redis';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import type { StateRepository } from '../../interface';
import { CLIENT_I } from './interface';

/**
 * @category Provider
 */
export class RedisStateRepository implements StateRepository {
  _client: RedisClient;

  constructor(client: RedisClient) {
    this._client = client;
  }

  async get<T>(name: string, key: string): Promise<T> {
    const result = await thenifiedly.callMethod(
      'hget',
      this._client,
      name,
      key
    );

    return result ? JSON.parse(result) : undefined;
  }

  async set<T>(name: string, key: string, state: T): Promise<boolean> {
    const result = await thenifiedly.callMethod(
      'hset',
      this._client,
      name,
      key,
      JSON.stringify(state)
    );

    return !!result;
  }

  async delete(name: string, key: string): Promise<boolean> {
    const result = await thenifiedly.callMethod(
      'hdel',
      this._client,
      name,
      key
    );

    return !!result;
  }

  async getAll(name: string): Promise<null | Map<string, any>> {
    const result = await thenifiedly.callMethod('hgetall', this._client, name);
    if (!result) {
      return null;
    }

    return new Map<string, any>(
      Object.entries<string>(result).map(([key, value]) => [
        key,
        JSON.parse(value),
      ])
    );
  }

  async clear(name: string): Promise<void> {
    await thenifiedly.callMethod('del', this._client, name);
  }
}

export const RedisRepositoryP = provider<RedisStateRepository>({
  lifetime: 'singleton',
  deps: [CLIENT_I],
})(RedisStateRepository);

export type RedisRepositoryP = RedisStateRepository;
