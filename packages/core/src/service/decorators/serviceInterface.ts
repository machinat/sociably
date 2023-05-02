import invariant from 'invariant';
import { SOCIABLY_SERVICE_INTERFACE } from '../../symbol';
import type {
  ServiceInterface,
  PolymorphicServiceInterface,
  MultiServiceInterface,
  SingularServiceInterface,
} from '../types';

type MakeInterfaceOptions = {
  multi?: boolean;
  polymorphic?: boolean;
  name: string;
};

/**
 * serviceInterface make a non class service interface
 * @category Service Registry
 */
function serviceInterface<T>(options: {
  name: string;
  polymorphic: true;
}): PolymorphicServiceInterface<T>;

function serviceInterface<T>(options: {
  name: string;
  multi: true;
}): MultiServiceInterface<T>;

function serviceInterface<T>(options: {
  name: string;
  multi?: false;
  polymorphic?: false;
}): SingularServiceInterface<T>;

function serviceInterface<T>({
  multi = false,
  polymorphic = false,
  name,
}: MakeInterfaceOptions): ServiceInterface<T> {
  invariant(
    !(multi && polymorphic),
    'cannot be mulit and polymorphic at the same time'
  );

  return {
    $$name: name,
    $$multi: multi as never,
    $$polymorphic: polymorphic,
    $$typeof: SOCIABLY_SERVICE_INTERFACE,
  };
}

export default serviceInterface;
