// @flow
import type { Interfaceable } from './types';

type ProvisionBranches<T> = Map<
  Interfaceable,
  {| default: null | T, branches: null | Map<string, T> |}
>;

export default class ProvisionMap<T> {
  _mapping: ProvisionBranches<T>;

  constructor(mapping?: ProvisionBranches<T>) {
    this._mapping = mapping || new Map();
  }

  getDefault(target: Interfaceable): null | T {
    const mapped = this._mapping.get(target);
    return mapped ? mapped.default : null;
  }

  getPlatform(target: Interfaceable, platform: string): null | T {
    const mapped = this._mapping.get(target);
    return mapped && mapped.branches
      ? mapped.branches.get(platform) || null
      : null;
  }

  setDefault(target: Interfaceable, value: T): boolean {
    const mapped = this._mapping.get(target);
    if (mapped) {
      const isUpdating = !!mapped.default;
      mapped.default = value;
      return isUpdating;
    }

    this._mapping.set(target, { default: value, branches: null });
    return false;
  }

  setPlatform(target: Interfaceable, platform: string, value: T): boolean {
    const mapped = this._mapping.get(target);
    if (!mapped) {
      const branches = new Map();
      branches.set(platform, value);

      this._mapping.set(target, { default: null, branches });
      return false;
    }

    if (!mapped.branches) {
      mapped.branches = new Map().set(platform, value);
      return false;
    }

    const { branches } = mapped;
    const isUpdating = branches.has(platform);
    branches.set(platform, value);

    return isUpdating;
  }

  merge(concatee: ProvisionMap<T>): ProvisionMap<T> {
    for (const [target, provided] of concatee._mapping) {
      if (provided.default) {
        this.setDefault(target, provided.default);
      }

      if (provided.branches) {
        for (const [platform, value] of provided.branches) {
          this.setPlatform(target, platform, value);
        }
      }
    }

    return this;
  }

  /* :: @@iterator(): Generator<[Interfaceable, void | string, any], void, void> {return ({}: any)} */
  *[Symbol.iterator](): Generator<
    [Interfaceable, void | string, any],
    void,
    void
  > {
    for (const [target, provided] of this._mapping) {
      if (provided.default) {
        yield [target, undefined, provided.default];
      }

      if (provided.branches) {
        for (const [platform, value] of provided.branches) {
          yield [target, platform, value];
        }
      }
    }
  }
}
