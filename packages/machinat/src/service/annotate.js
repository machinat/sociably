// @flow
/* eslint-disable no-param-reassign */
import {
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_ABSTRACTION,
  MACHINAT_SERVICES_INTERFACEABLE,
} from '../symbol';
import type {
  ServeStrategy,
  ServiceContainer,
  ServiceProvider,
  AbstractProvider,
  Interfaceable,
  NamedInterfaceable,
  InjectRequirement,
} from './types';
import { polishInjectRequirement } from './utils';

type InjectOptions = {|
  deps: (Interfaceable | InjectRequirement)[],
|};

/**
 * inject marks a function as a container and annotate the dependencies
 */
export const inject = <T>({ deps }: InjectOptions) => (
  fn: (...args: any[]) => T
): ServiceContainer<T> => {
  const requirements = deps.map(polishInjectRequirement);

  fn.$$typeof = MACHINAT_SERVICES_CONTAINER;
  fn.$$deps = requirements;
  return fn;
};

type ProvideOptions<T> = {
  deps: (Interfaceable | InjectRequirement)[],
  factory: (...args: any[]) => T,
  strategy: ServeStrategy,
};

/**
 * provider mark a class as a provider serving for the instance type and also an
 * interfaceable can be implemented
 */
export const provider = <T>({ deps, factory, strategy }: ProvideOptions<T>) => (
  klass: any
): ServiceProvider<T> => {
  const requirements = deps.map(polishInjectRequirement);

  klass.$$typeof = MACHINAT_SERVICES_PROVIDER;
  klass.$$deps = requirements;
  klass.$$factory = factory;
  klass.$$strategy = strategy;
  return klass;
};

/**
 * abstract mark an abstract class as a interfaceable to be implemented
 */
export const abstract = () => <T>(klass: any): AbstractProvider<T> => {
  klass.$$typeof = MACHINAT_SERVICES_ABSTRACTION;
  return klass;
};

/**
 * namedInterface create an interfaceable to be implemented
 */
export const namedInterface = (name: string): NamedInterfaceable => ({
  $$typeof: MACHINAT_SERVICES_INTERFACEABLE,
  name,
});
