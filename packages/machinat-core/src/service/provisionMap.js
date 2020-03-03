// @flow
import type { Interfaceable } from './types';

type ProvisionBranches<T> = Map<
  Interfaceable,
  {| default: null | T, platforms: {| [string]: T |} |}
>;

export default class ProvisionMap<T> {
  _mapping: ProvisionBranches<T>;

  constructor(mapping?: ProvisionBranches<T>) {
    this._mapping = mapping || new Map();
  }

  get(target: Interfaceable, platform: void | string): null | T {
    const registered = this._mapping.get(target);
    if (!registered) {
      return null;
    }

    if (!platform) {
      return registered.default;
    }

    return registered.platforms[platform] || registered.default;
  }

  set(target: Interfaceable, platform: void | string, value: T): boolean {
    const registered = this._mapping.get(target);
    if (!registered) {
      this._mapping.set(
        target,
        platform
          ? { default: null, platforms: { [platform]: value } }
          : { default: value, platforms: ({}: any) }
      );
      return false;
    }

    let isUpdating;

    if (platform) {
      isUpdating = !!registered.platforms[platform];
      registered.platforms[platform] = value;
    } else {
      isUpdating = !!registered.default;
      registered.default = value;
    }

    return isUpdating;
  }

  merge(concatee: ProvisionMap<T>): ProvisionMap<T> {
    for (const [target, provided] of concatee._mapping) {
      if (provided.default) {
        this.set(target, undefined, provided.default);
      }

      for (const [platform, value] of Object.entries(provided.platforms)) {
        this.set(target, platform, (value: any));
      }
    }

    return this;
  }

  *iterBranch(
    platform: void | string
  ): Generator<[Interfaceable, void | string, T], void, void> {
    for (const [target, provided] of this._mapping) {
      if (platform && provided.platforms[platform]) {
        yield [target, platform, provided.platforms[platform]];
      } else if (provided.default) {
        yield [target, undefined, provided.default];
      }
    }
  }

  *iterAll(): Generator<[Interfaceable, void | string, T], void, void> {
    for (const [target, provided] of this._mapping) {
      if (provided.default) {
        yield [target, undefined, provided.default];
      }

      for (const [platform, value] of Object.entries(provided.platforms)) {
        yield [target, platform, (value: any)];
      }
    }
  }
}
