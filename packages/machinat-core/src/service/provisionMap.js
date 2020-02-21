// @flow
import type { Interfaceable } from './types';

type ProvisionBranches<T> = Map<
  Interfaceable,
  {| default: null | T, platformBranches: null | Map<string, T> |}
>;

export default class ProvisionMap<T> {
  _mapping: ProvisionBranches<T>;

  constructor(mapping?: ProvisionBranches<T>) {
    this._mapping = mapping || new Map();
  }

  get(target: Interfaceable, platform: void | string): null | T {
    return platform
      ? this.getPlatform(target, platform)
      : this.getDefault(target);
  }

  getDefault(target: Interfaceable): null | T {
    const reigstered = this._mapping.get(target);
    return reigstered ? reigstered.default : null;
  }

  getPlatform(target: Interfaceable, platform: string): null | T {
    const reigstered = this._mapping.get(target);
    return reigstered && reigstered.platformBranches
      ? reigstered.platformBranches.get(platform) || null
      : null;
  }

  set(target: Interfaceable, platform: void | string, value: T): boolean {
    return platform
      ? this.setPlatform(target, platform, value)
      : this.setDefault(target, value);
  }

  setDefault(target: Interfaceable, value: T): boolean {
    const reigstered = this._mapping.get(target);
    if (reigstered) {
      const isUpdating = !!reigstered.default;
      reigstered.default = value;
      return isUpdating;
    }

    this._mapping.set(target, { default: value, platformBranches: null });
    return false;
  }

  setPlatform(target: Interfaceable, platform: string, value: T): boolean {
    const reigstered = this._mapping.get(target);
    if (!reigstered) {
      const platformBranches = new Map();
      platformBranches.set(platform, value);

      this._mapping.set(target, { default: null, platformBranches });
      return false;
    }

    if (!reigstered.platformBranches) {
      reigstered.platformBranches = new Map().set(platform, value);
      return false;
    }

    const { platformBranches } = reigstered;
    const isUpdating = platformBranches.has(platform);
    platformBranches.set(platform, value);

    return isUpdating;
  }

  merge(concatee: ProvisionMap<T>): ProvisionMap<T> {
    for (const [target, provided] of concatee._mapping) {
      if (provided.default) {
        this.setDefault(target, provided.default);
      }

      if (provided.platformBranches) {
        for (const [platform, value] of provided.platformBranches) {
          this.setPlatform(target, platform, value);
        }
      }
    }

    return this;
  }

  /* :: @@iterator(): Generator<[Interfaceable, void | string, T], void, void> {return ({}: any)} */
  *[Symbol.iterator](): Generator<
    [Interfaceable, void | string, any],
    void,
    void
  > {
    for (const [target, provided] of this._mapping) {
      if (provided.default) {
        yield [target, undefined, provided.default];
      }

      if (provided.platformBranches) {
        for (const [platform, value] of provided.platformBranches) {
          yield [target, platform, value];
        }
      }
    }
  }
}
