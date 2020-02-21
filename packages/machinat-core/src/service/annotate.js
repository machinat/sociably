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
  deps?: (Interfaceable | InjectRequirement)[],
|};

type ContainerAnnotateFn<T> = ((...any[]) => T) => ServiceContainer<T>;
/**
 * inject marks a function as a container and annotate the dependencies
 */
export const inject = <T>({
  deps = [],
}: InjectOptions = {}): ContainerAnnotateFn<T> => fn => {
  const requirements = deps.map(polishInjectRequirement);

  fn.$$typeof = MACHINAT_SERVICES_CONTAINER;
  fn.$$deps = requirements;
  return fn;
};

type ProvideOptions<T> = {
  deps?: (Interfaceable | InjectRequirement)[],
  factory: (...args: any[]) => T,
  strategy: ServeStrategy,
};

type ProviderAnnotateFn<Klass> = Klass => ServiceProvider<Klass>;
/**
 * provider mark a class as a provider serving for the instance type and also an
 * interfaceable can be implemented
 */
export const provider = <T, Klass>({
  deps = [],
  factory,
  strategy,
}: ProvideOptions<T>): ProviderAnnotateFn<Klass> => (klass: any) => {
  const requirements = deps.map(polishInjectRequirement);

  klass.$$typeof = MACHINAT_SERVICES_PROVIDER;
  klass.$$deps = requirements;
  klass.$$factory = factory;
  klass.$$strategy = strategy;
  return klass;
};

type AbstractAnnotateFn<T> = (Class<T>) => AbstractProvider<Class<T>>;
/**
 * abstract mark an abstract class as a interfaceable to be implemented
 */
export const abstract = <T>(): AbstractAnnotateFn<T> => (klass: any) => {
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
