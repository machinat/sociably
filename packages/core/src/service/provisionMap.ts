import type {
  Interfaceable,
  SingularServiceInterface,
  MultiServiceInterface,
  PolymorphicServiceInterface,
  ServiceProvider,
} from './types.js';

const mergeSingular = <T>(
  base: Map<Interfaceable<unknown>, T>,
  mergee: Map<Interfaceable<unknown>, T>,
) => {
  for (const [target, value] of mergee) {
    base.set(target, value);
  }
};

const mergeMulti = <T>(
  base: Map<Interfaceable<unknown>, T[]>,
  mergee: Map<Interfaceable<unknown>, T[]>,
) => {
  for (const [target, values] of mergee) {
    const baseRegistered = base.get(target);
    if (baseRegistered) {
      base.set(target, [...baseRegistered, ...values]);
    } else {
      base.set(target, values);
    }
  }
};

const mergePolymorphic = <T>(
  base: Map<Interfaceable<unknown>, Map<string, T>>,
  mergee: Map<Interfaceable<unknown>, Map<string, T>>,
) => {
  for (const [target, platforms] of mergee) {
    const baseBranches = base.get(target);
    if (baseBranches) {
      for (const [platform, value] of platforms) {
        baseBranches.set(platform, value);
      }
    } else {
      base.set(target, platforms);
    }
  }
};

export default class ProvisionMap<T> {
  _singularMapping: Map<Interfaceable<unknown>, T>;
  _multiMapping: Map<Interfaceable<unknown>, T[]>;
  _polymorphicMapping: Map<Interfaceable<unknown>, Map<string, T>>;

  constructor(base?: ProvisionMap<T>) {
    this._singularMapping = base ? new Map(base._singularMapping) : new Map();
    this._multiMapping = base ? new Map(base._multiMapping) : new Map();
    this._polymorphicMapping = base
      ? new Map(base._polymorphicMapping)
      : new Map();
  }

  getSingular(
    target:
      | SingularServiceInterface<unknown>
      | ServiceProvider<unknown, unknown[]>,
  ): null | T {
    return this._singularMapping.get(target) || null;
  }

  getMulti(target: MultiServiceInterface<unknown>): T[] {
    return this._multiMapping.get(target) || [];
  }

  getPolymorphic(target: PolymorphicServiceInterface<unknown>): Map<string, T> {
    return this._polymorphicMapping.get(target) || new Map();
  }

  setSingular(
    target:
      | SingularServiceInterface<unknown>
      | ServiceProvider<unknown, unknown[]>,
    value: T,
  ): null | T {
    const registered = this._singularMapping.get(target);
    this._singularMapping.set(target, value);

    return registered || null;
  }

  setMulti(target: MultiServiceInterface<unknown>, value: T): null | T[] {
    const registered = this._multiMapping.get(target);
    if (!registered) {
      this._multiMapping.set(target, [value]);
      return null;
    }

    this._multiMapping.set(target, [...registered, value]);
    return registered;
  }

  setPolymorphic(
    target: PolymorphicServiceInterface<unknown>,
    value: T,
    platform: string,
  ): null | T {
    const registered = this._polymorphicMapping.get(target);
    if (!registered) {
      this._polymorphicMapping.set(target, new Map([[platform, value]]));
      return null;
    }

    const registeredBranch = registered.get(platform);
    registered.set(platform, value);

    return registeredBranch || null;
  }

  merge(mergee: ProvisionMap<T>): ProvisionMap<T> {
    mergeSingular(this._singularMapping, mergee._singularMapping);
    mergeMulti(this._multiMapping, mergee._multiMapping);
    mergePolymorphic(this._polymorphicMapping, mergee._polymorphicMapping);
    return this;
  }

  *[Symbol.iterator](): Generator<
    [Interfaceable<unknown>, T, string?],
    void,
    void
  > {
    for (const [target, value] of this._singularMapping) {
      yield [target, value, undefined];
    }

    for (const [target, values] of this._multiMapping) {
      for (const value of values) {
        yield [target, value, undefined];
      }
    }

    for (const [target, platforms] of this._polymorphicMapping) {
      for (const [platform, value] of platforms) {
        yield [target, value, platform];
      }
    }
  }
}
