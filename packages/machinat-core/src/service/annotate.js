// @flow
/* eslint-disable no-param-reassign */
import invariant from 'invariant';
import {
  MACHINAT_SERVICES_PROVIDER,
  MACHINAT_SERVICES_CONTAINER,
  MACHINAT_SERVICES_INTERFACE,
} from '../symbol';
import type {
  ServiceLifetime,
  ServiceContainer,
  ServiceProvider,
  ServiceInterface,
  Interfaceable,
  InjectRequirement,
} from './types';
import { polishInjectRequirement } from './utils';

type InjectOptions = {|
  name?: string,
  deps?: (Interfaceable | InjectRequirement)[],
|};

const validateLifetime = (lifetime: string) => {
  invariant(
    lifetime === 'singleton' ||
      lifetime === 'scoped' ||
      lifetime === 'transient',
    `${lifetime} is not valid service lifetime`
  );
};

type InjectFn<T> = (fn: (...any[]) => T) => ServiceContainer<T>;

/**
 * inject marks a function as a container and annotate the dependencies
 */
export const inject = <T>({
  name,
  deps = [],
}: InjectOptions = {}): InjectFn<T> => (fn: any) => {
  const requirements = deps.map(polishInjectRequirement);

  return Object.defineProperties(fn, {
    $$typeof: { value: MACHINAT_SERVICES_CONTAINER },
    $$name: { value: name || fn.name },
    $$deps: { value: requirements },
  });
};

type ProvideOptions<T> = {
  name?: string,
  deps?: (Interfaceable | InjectRequirement)[],
  factory?: (...args: any[]) => T,
  lifetime: ServiceLifetime,
};

type ProviderFn<T> = (Class<T>) => ServiceProvider<T, Class<T>>;

/**
 * provider annotate a class as a provider serving for the instance type and
 * also an interface can be implemented
 */
export const provider = <T>({
  name,
  deps = [],
  factory,
  lifetime,
}: ProvideOptions<T>): ProviderFn<T> => (Klazz: any) => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishInjectRequirement);

  return Object.defineProperties(Klazz, {
    $$name: { value: name || Klazz.name },
    $$typeof: { value: MACHINAT_SERVICES_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factory || ((...args) => new Klazz(...args)) },
    $$lifetime: { value: lifetime },
  });
};

type FactoryOptions = {
  name?: string,
  deps?: (Interfaceable | InjectRequirement)[],
  lifetime: ServiceLifetime,
};

type FactoryFn<T> = (
  factory: (...any[]) => T
) => ServiceProvider<T, (...any[]) => T>;

/**
 * factory annotate a factory function as a provider
 */
export const factory = <T>({
  name,
  deps = [],
  lifetime,
}: FactoryOptions): FactoryFn<T> => (factoryFn: any) => {
  validateLifetime(lifetime);
  const requirements = deps.map(polishInjectRequirement);

  return Object.defineProperties(factoryFn, {
    $$name: { value: name || factoryFn.name },
    $$typeof: { value: MACHINAT_SERVICES_PROVIDER },
    $$deps: { value: requirements },
    $$factory: { value: factoryFn },
    $$lifetime: { value: lifetime },
  });
};

type AbstractOptions = {
  name?: string,
};

type AbstractFn<T> = (Class<T>) => ServiceInterface<T, Class<T>>;

/**
 * abstract annotate an abstract class as a servcie interface
 */
export const abstractInterface = <T>({
  name,
}: AbstractOptions = {}): AbstractFn<T> => (Klazz: any) => {
  return Object.defineProperties(Klazz, {
    $$typeof: { value: MACHINAT_SERVICES_INTERFACE },
    $$name: { value: name || Klazz.name },
  });
};

/**
 * namedInterface create a service interface with name
 */
export const namedInterface = <T>(name: string): ServiceInterface<T, {}> => ({
  $$name: name,
  $$typeof: MACHINAT_SERVICES_INTERFACE,
});
