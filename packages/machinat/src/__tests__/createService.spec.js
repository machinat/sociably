import moxy from 'moxy';
import createService from '../createService';
import {
  MACHINAT_SERVICE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_CONSUMER_TYPE,
} from '../symbol';

it('create service object', () => {
  const serve = moxy(() => async () => null);

  const Service = createService(serve);

  expect(Service.$$typeof).toBe(MACHINAT_SERVICE_TYPE);
  expect(Service.Provider.$$typeof).toBe(MACHINAT_PROVIDER_TYPE);
  expect(Service.Consumer.$$typeof).toBe(MACHINAT_CONSUMER_TYPE);

  expect(Service.Provider._service).toBe(Service);
  expect(Service.Consumer._service).toBe(Service);

  expect(Service._serve).toBe(serve);
});

it('throw if serve fn is not function', () => {
  expect(() => createService({})).toThrowErrorMatchingInlineSnapshot(
    `"serve must be a function"`
  );
});
