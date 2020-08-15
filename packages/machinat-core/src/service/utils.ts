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
  Interfaceable,
  InjectRequirement,
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
): target is ServiceProvider<unknown, unknown> =>
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

export const isInterfaceable = (target: any): target is Interfaceable =>
  (typeof target === 'function' ||
    (typeof target === 'object' && target !== null)) &&
  (target.$$typeof === MACHINAT_SERVICES_INTERFACE ||
    target.$$typeof === MACHINAT_SERVICES_PROVIDER);

export const polishInjectRequirement = (
  dep: Interfaceable | InjectRequirement
): InjectRequirement => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(
    dep.require,
    `${(dep as any).name || String(dep)} is not a valid interface`
  );
  return dep;
};

export const createEmptyScope = (platform?: string): ServiceScope =>
  new ServiceScope(platform, new ServiceMaker(new ProvisionMap()), new Map());
