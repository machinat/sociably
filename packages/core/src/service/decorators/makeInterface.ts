import invariant from 'invariant';
import { MACHINAT_SERVICE_INTERFACE } from '../../symbol';
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
 * makeInterface make a non class service interface
 * @category Service Registry
 */
function makeInterface<T>(options: {
  name: string;
  polymorphic: true;
}): PolymorphicServiceInterface<T>;

function makeInterface<T>(options: {
  name: string;
  multi: true;
}): MultiServiceInterface<T>;

function makeInterface<T>(options: {
  name: string;
  multi?: false;
  polymorphic?: false;
}): SingularServiceInterface<T>;

function makeInterface<T>({
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
    $$typeof: MACHINAT_SERVICE_INTERFACE,
  };
}

export default makeInterface;
