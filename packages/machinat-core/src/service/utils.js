// @flow
import invariant from 'invariant';
import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';
import ServiceScope from './scope';
import ServiceMaker from './maker';
import ProvisionMap from './provisionMap';
import type { Interfaceable, InjectRequirement } from './types';

export const isServiceContainer = (target: any): boolean %checks =>
  typeof target === 'function' &&
  target.$$typeof === MACHINAT_SERVICES_CONTAINER;

export const isServiceProvider = (target: any): boolean %checks =>
  /* :: target.$$typeof && */
  (typeof target === 'function' || typeof target === 'object') &&
  target.$$typeof === MACHINAT_SERVICES_PROVIDER;

export const isInterfaceable = (target: Object): boolean %checks =>
  (typeof target === 'function' || typeof target === 'object') &&
  (target.$$typeof === MACHINAT_SERVICES_INTERFACE ||
    target.$$typeof === MACHINAT_SERVICES_PROVIDER);

export const polishInjectRequirement = (
  dep: Interfaceable | InjectRequirement
): InjectRequirement => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(dep.require, `${dep.name || String(dep)} is not a valid interface`);
  return dep;
};

export const createEmptyScope = (platform?: string) =>
  new ServiceScope(platform, new ServiceMaker(new ProvisionMap()), new Map());
