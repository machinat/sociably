import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { Location } from '../location';

const render = element => element.type(element, () => null, '$');

it('is valid native unit component', () => {
  expect(typeof Location).toBe('function');

  expect(isNativeElement(<Location />)).toBe(true);
  expect(Location.$$platform).toBe('line');
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
