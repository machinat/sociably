import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Location, LocationProps } from '../Location.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component', () => {
  expect(isNativeType(<Location {...({} as LocationProps)} />)).toBe(true);
  expect(Location.$$platform).toBe('line');
  expect(Location.$$name).toBe('Location');
});

it('render match snapshot', async () => {
  const location = (
    <Location
      title="WHERE AM I?"
      address="NARNIA"
      latitude={51.756779}
      longitude={-1.189902}
    />
  );
  await expect(renderUnitElement(location)).resolves.toEqual([
    {
      type: 'unit',
      node: location,
      value: {
        type: 'message',
        params: {
          address: 'NARNIA',
          latitude: 51.756779,
          longitude: -1.189902,
          title: 'WHERE AM I?',
          type: 'location',
        },
      },
      path: '$',
    },
  ]);
});
