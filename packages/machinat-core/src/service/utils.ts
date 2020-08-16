import invariant from 'invariant';
import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';
import ServiceScope from './scope';
import ServiceMaker from './maker';
import ProvisionMap from './provisionMap';
import type {
  ClassType,
  Interfaceable,
  ServiceRequirement,
  ServiceContainer,
  ServiceProvider,
} from './types';

export const isServiceContainer = (
  target: any
): target is ServiceContainer<unknown> =>
  typeof target === 'function' &&
  target.$$typeof === MACHINAT_SERVICES_CONTAINER;

export const isServiceProvider = (
  target: any
): target is ServiceProvider<unknown> =>
  (typeof target === 'function' ||
    (typeof target === 'object' && target !== null)) &&
  target.$$typeof === MACHINAT_SERVICES_PROVIDER;

export const maybeInjectContainer = <T>(
  scope: ServiceScope,
  maybeContainer: T | ServiceContainer<T>
): T =>
  isServiceContainer(maybeContainer)
    ? scope.injectContainer(maybeContainer)
    : maybeContainer;

export const isInterfaceable = (
  target: any
): target is Interfaceable<unknown> =>
  (typeof target === 'function' ||
    (typeof target === 'object' && target !== null)) &&
  (target.$$typeof === MACHINAT_SERVICES_INTERFACE ||
    target.$$typeof === MACHINAT_SERVICES_PROVIDER);

export const polishServiceRequirement = <T>(
  dep: Interfaceable<T> | ServiceRequirement<T> | ClassType<T>
): ServiceRequirement<T> => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(
    'require' in dep &&
      (dep.require.$$typeof === MACHINAT_SERVICES_INTERFACE ||
        dep.require.$$typeof === MACHINAT_SERVICES_PROVIDER),
    `${(dep as any).name || String(dep)} is not a valid interface`
  );

  return dep;
};

export const createEmptyScope = (platform?: string): ServiceScope =>
  new ServiceScope(platform, new ServiceMaker(new ProvisionMap()), new Map());
