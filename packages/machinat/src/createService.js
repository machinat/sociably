// @flow
import {
  MACHINAT_SERVICE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_CONSUMER_TYPE,
} from './symbol';
import type { MachinatService, ServiceProvideFn } from './types';

const createService = <Served, ProvideInput, ConsumeInput>(
  serve: ServiceProvideFn<Served, ProvideInput, ConsumeInput>
): MachinatService<Served, ProvideInput, ConsumeInput> => {
  if (typeof serve !== 'function') {
    throw TypeError('serve must be a function');
  }

  const service = {
    $$typeof: MACHINAT_SERVICE_TYPE,
    Provider: (null: any),
    Consumer: (null: any),
    _serve: serve,
  };

  service.Provider = {
    $$typeof: MACHINAT_PROVIDER_TYPE,
    _service: service,
  };

  service.Consumer = {
    $$typeof: MACHINAT_CONSUMER_TYPE,
    _service: service,
  };

  return service;
};

export default createService;
