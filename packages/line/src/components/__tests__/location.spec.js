import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';

import { Location } from '../location';

const renderer = new Renderer('line', () => null);

it('is valid native unit component', () => {
  expect(typeof Location).toBe('function');

  expect(isNativeType(<Location />)).toBe(true);
  expect(Location.$$platform).toBe('line');
});

it('render match snapshot', async () => {
  const loc = (
    <Location
      title="WHERE AM I?"
      address="NARNIA"
      latitude={51.756779}
      longitude={-1.189902}
    />
  );
  await expect(renderer.render(loc)).resolves.toEqual([
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
