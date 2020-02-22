// @flow
import invariant from 'invariant';
import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from '../symbol';
import ServiceScope from './scope';
import ServiceMaker from './maker';
import ProvisionMap from './provisionMap';
import type { Interfaceable, InjectRequirement } from './types';

export const isServiceContainer = (target: any): boolean =>
  typeof target === 'function' &&
  target.$$typeof === MACHINAT_SERVICES_CONTAINER;

export const isServiceProvider = (target: any): boolean =>
  target.$$typeof === MACHINAT_SERVICES_PROVIDER;

export const isInterfaceable = (target: Object): boolean =>
  target.$$typeof === MACHINAT_SERVICES_INTERFACEABLE ||
  target.$$typeof === MACHINAT_SERVICES_PROVIDER ||
  target.$$typeof === MACHINAT_SERVICES_ABSTRACTION;

export const polishInjectRequirement = (
  dep: Interfaceable | InjectRequirement
): InjectRequirement => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(
    dep.require,
    `${dep.name || String(dep)} is not a valid interfaceable`
  );
  return dep;
};

export const createEmptyScope = (platform?: string) =>
  new ServiceScope(
    platform,
    new ServiceMaker(new ProvisionMap()),
    new Map(),
    new Map()
  );
