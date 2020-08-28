/** @internal */ /** */
import type { Interfaceable } from './types';

type ProvisionBranches<T> = Map<
  Interfaceable<T>,
  { default: null | T; platforms: { [key: string]: T } }
>;

const setBranch = <T>(
  branches: ProvisionBranches<T>,
  target: Interfaceable<T>,
  platforms: string[] | null | undefined,
  value: T
): null | T[] => {
  const existed = branches.get(target);

  if (!existed) {
    const platformValues = {};
    if (platforms) {
      for (const platform of platforms) {
        platformValues[platform] = value;
      }
    }

    branches.set(target, {
      default: platforms ? null : value,
      platforms: platformValues,
    });

    return null;
  }

  if (platforms) {
    const replaced: T[] = [];

    for (const platform of platforms) {
      const alreadyBound = existed.platforms[platform];
      if (alreadyBound) {
        replaced.push(alreadyBound);
      }

      existed.platforms[platform] = value;
    }

    return replaced.length > 0 ? replaced : null;
  }

  const alreadyBound = existed.default;
  existed.default = value;

  return alreadyBound ? [alreadyBound] : null;
};

const setMultiBranch = <T>(
  branches: ProvisionBranches<T[]>,
  target: Interfaceable<T[]>,
  platforms: string[] | null | undefined,
  value: T
) => {
  const existed = branches.get(target);

  if (!existed) {
    const platformValues = {};
    if (platforms) {
      for (const platform of platforms) {
        platformValues[platform] = [value];
      }
    }

    branches.set(target, {
      default: platforms ? null : [value],
      platforms: platformValues,
    });
  } else if (platforms) {
    for (const platform of platforms) {
      const values = existed.platforms[platform];

      if (values) {
        values.push(value);
      } else {
        existed.platforms[platform] = [value];
      }
    }
  } else {
    const values = existed.default;
    if (values) {
      values.push(value);
    } else {
      existed.default = [value];
    }
  }
};

const mergeBranch = <T>(
  base: ProvisionBranches<T>,
  mergee: ProvisionBranches<T>
) => {
  for (const [target, providedBranches] of mergee) {
    const { default: defaultValue, platforms } = providedBranches;

    const baseProvided = base.get(target);
    if (baseProvided) {
      if (defaultValue) {
        baseProvided.default = defaultValue;
      }

      for (const [platform, value] of Object.entries(platforms)) {
        baseProvided.platforms[platform] = value;
      }
    } else {
      base.set(target, {
        default: defaultValue,
        platforms: { ...platforms },
      });
    }
  }
};

const mergeMultiBranch = <T>(
  base: ProvisionBranches<T[]>,
  mergee: ProvisionBranches<T[]>
) => {
  for (const [target, providedBranches] of mergee) {
    const { default: defaultValues, platforms } = providedBranches;

    const baseProvided = base.get(target);
    if (baseProvided) {
      if (defaultValues) {
        if (baseProvided.default) {
          baseProvided.default.push(...defaultValues);
        } else {
          baseProvided.default = [...defaultValues];
        }
      }

      for (const [platform, values] of Object.entries(platforms)) {
        const selfProvidedOfPlatform = baseProvided.platforms[platform];

        if (selfProvidedOfPlatform) {
          selfProvidedOfPlatform.push(...values);
        } else {
          baseProvided.platforms[platform] = [...values];
        }
      }
    } else {
      const copy = {};
      for (const [platform, values] of Object.entries(platforms)) {
        copy[platform] = [...values];
      }

      base.set(target, {
        default: defaultValues && [...defaultValues],
        platforms: copy,
      });
    }
  }
};

const mergeOptionalArray = <T>(arr: null | T[], brr: null | T[]): null | T[] =>
  !arr ? brr : !brr ? arr : [...arr, ...brr];

export default class ProvisionMap<T> {
  _mapping: ProvisionBranches<T>;
  _multiMapping: ProvisionBranches<T[]>;

  constructor() {
    this._mapping = new Map();
    this._multiMapping = new Map();
  }

  /**
   * get return the binding bound to the interface by default or on specified
   * platform, return null if no binding bound. If interface.$$multi is true
   * return all bindings as an array.
   */
  get(target: Interfaceable<T>, platform: void | string): null | T | T[] {
    if (target.$$multi) {
      const existed = this._multiMapping.get(target);
      if (!existed) {
        return [];
      }

      if (!platform) {
        return existed.default;
      }

      const defaultValues = existed.default;
      const platformValues = existed.platforms[platform];

      return mergeOptionalArray(defaultValues, platformValues);
    }

    const existed = this._mapping.get(target);
    return !existed
      ? null
      : !platform
      ? existed.default
      : existed.platforms[platform] || existed.default;
  }

  /**
   * set store the binding with the associated interface as the key, returns an
   * array of replaced bindings or null if none. If interface.$$multi is true,
   * the binding would always being added no matter any binding bound already,
   * otherwise the existed binding would be replaced.
   */
  set(
    target: Interfaceable<T>,
    platforms: null | string[],
    value: T
  ): null | T[] {
    let replaced: null | T[] = null;
    if (target.$$multi) {
      setMultiBranch(this._multiMapping, target, platforms, value);
    } else {
      replaced = setBranch(this._mapping, target, platforms, value);
    }

    return replaced;
  }

  merge(mergee: ProvisionMap<T>): ProvisionMap<T> {
    mergeBranch(this._mapping, mergee._mapping);
    mergeMultiBranch(this._multiMapping, mergee._multiMapping);

    return this;
  }

  *iterAll(): Generator<
    | [Interfaceable<T>, void | string, T]
    | [Interfaceable<T[]>, void | string, T[]],
    void,
    void
  > {
    for (const [target, provided] of this._mapping) {
      const { default: defaultValue, platforms } = provided;
      if (defaultValue) {
        yield [target, undefined, defaultValue];
      }

      for (const [platform, value] of Object.entries(platforms)) {
        yield [target, platform, value];
      }
    }

    for (const [target, provided] of this._multiMapping) {
      const { default: defaultValues, platforms } = provided;
      if (defaultValues) {
        yield [target, undefined, defaultValues];
      }

      for (const [platform, value] of Object.entries(platforms)) {
        yield [target, platform, value];
      }
    }
  }

  *iterPlatform(
    platform: void | string
  ): Generator<[Interfaceable<T>, T] | [Interfaceable<T[]>, T[]], void, void> {
    for (const [target, provided] of this._mapping) {
      const { default: defaultValue, platforms } = provided;

      const value = platform
        ? platforms[platform] || defaultValue
        : defaultValue;
      if (value) {
        yield [target, value];
      }
    }

    for (const [target, provided] of this._multiMapping) {
      const { default: defaultValues, platforms } = provided;

      const values = mergeOptionalArray(
        defaultValues,
        platform ? platforms[platform] : null
      );
      if (values) {
        yield [target, values];
      }
    }
  }
}
