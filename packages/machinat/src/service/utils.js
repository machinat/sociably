// @flow
import invariant from 'invariant';
import {
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from './constant';
import ProvisionMap from './map';
import type {
  ProvisionBinding,
  Interfaceable,
  InjectRequirement,
} from './types';

export const isServiceContainer = (target: any): boolean %checks =>
  typeof target === 'function' &&
  target.$$typeof === MACHINAT_SERVICES_CONTAINER;

export const isInterfaceable = (target: Object): boolean %checks =>
  target.$$typeof === MACHINAT_SERVICES_INTERFACEABLE ||
  target.$$typeof === MACHINAT_SERVICES_PROVIDER ||
  target.$$typeof === MACHINAT_SERVICES_ABSTRACTION;

export const resolveBindings = (
  provisions: ProvisionBinding[]
): {|
  serviceMapping: ProvisionMap<ProvisionBinding>,
  singletonIndex: ProvisionMap<true>,
  scopedIndex: ProvisionMap<true>,
|} => {
  const serviceMapping = new ProvisionMap();
  const singletonIndex = new ProvisionMap();
  const scopedIndex = new ProvisionMap();

  for (const provision of provisions) {
    const { provide: target, platforms } = provision;

    if (platforms) {
      for (const platform of platforms) {
        // annotate binding at the platform branch
        const isUpdated = serviceMapping.setPlatform(
          target,
          platform,
          provision
        );
        invariant(
          !isUpdated,
          `${target.name} is already bound on platform "${platform}" branch`
        );

        // index singleton and scoped services
        if (
          provision.withValue ||
          provision.withService.$$strategy === 'singleton'
        ) {
          singletonIndex.setPlatform(target, platform, true);
        } else if (provision.withService.$$strategy === 'scoped') {
          scopedIndex.setPlatform(target, platform, true);
        }
      }
    } else {
      // annotate binding at the default branch
      const isUpdated = serviceMapping.setDefault(target, provision);
      invariant(
        !isUpdated,
        `${target.name} is already bound on default branch`
      );

      // index singleton and scoped services
      if (
        provision.withValue ||
        provision.withService.$$strategy === 'singleton'
      ) {
        singletonIndex.setDefault(target, true);
      } else if (provision.withService.$$strategy === 'scoped') {
        scopedIndex.setDefault(target, true);
      }
    }
  }

  return {
    serviceMapping,
    singletonIndex,
    scopedIndex,
  };
};

export const polishInjectRequirement = (
  dep: Interfaceable | InjectRequirement
): InjectRequirement => {
  if (isInterfaceable(dep)) {
    return { require: dep, optional: false };
  }

  invariant(dep.require, `invalid interface received`);
  return dep;
};
