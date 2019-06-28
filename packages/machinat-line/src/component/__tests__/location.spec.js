import Machinat from 'machinat';

import { Location } from '../location';

import { LINE_NATIVE_TYPE } from '../../constant';

import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component', () => {
  expect(typeof Location).toBe('function');

  expect(Location.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Location.$$getEntry).toBe(undefined);
});

it('render match snapshot', async () => {
  const loc = (
    <Location
      title="WHERE AM I?"
      address="NARNIA"
      lat={51.756779}
      long={-1.189902}
    />
  );
  await expect(render(loc)).resolves.toEqual([
    {
      type: 'unit',
      node: loc,
      value: {
        address: 'NARNIA',
        latitude: 51.756779,
        longitude: -1.189902,
        title: 'WHERE AM I?',
        type: 'location',
      },
      path: '$',
    },
  ]);
});
