import invariant from 'invariant';
import {
  MACHINAT_SERVICE_CONTAINER,
  MACHINAT_SERVICE_PROVIDER,
  MACHINAT_SERVICE_INTERFACE,
} from '../symbol';
import ServiceScope from './scope';
import ServiceMaker from './maker';
import ProvisionMap from './provisionMap';
import type {
  Interfaceable,
  ServiceRequirement,
  ServiceContainer,
  ServiceProvider,
  MaybeContainer,
} from './types';

export const isServiceContainer = <T>(
  target: MaybeContainer<T>
): target is ServiceContainer<T, unknown[]> =>
  typeof target === 'function' &&
  '$$typeof' in target &&
  target.$$typeof === MACHINAT_SERVICE_CONTAINER;

export const isServiceProvider = (
  target: any
): target is ServiceProvider<unknown, unknown[]> =>
  (typeof target === 'function' ||
    (typeof target === 'object' && target !== null)) &&
  target.$$typeof === MACHINAT_SERVICE_PROVIDER;

export const maybeInjectContainer = <T>(
  scope: ServiceScope,
  maybeContainer: MaybeContainer<T>
): T =>
  isServiceContainer(maybeContainer)
    ? scope.injectContainer(maybeContainer)
    : maybeContainer;

export const isInterfaceable = (target: any): target is Interfaceable<any> =>
  (typeof target === 'function' ||
    (typeof target === 'object' && target !== null)) &&
  (target.$$typeof === MACHINAT_SERVICE_INTERFACE ||
    target.$$typeof === MACHINAT_SERVICE_PROVIDER);

export const createEmptyScope = (): ServiceScope =>
  new ServiceScope(new ServiceMaker(new ProvisionMap()), new Map());

export const polishServiceRequirement = <T>(
  dep: Interfaceable<T> | ServiceRequirement<Interfaceable<T>>
): ServiceRequirement<Interfaceable<T>> => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(
    isInterfaceable(dep?.require),
    `${(dep as any).name || String(dep)} is not a valid interface`
  );

  return dep;
};
