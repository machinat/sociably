import Machinat from 'machinat';

import { Location } from '../location';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

it('is valid native unit component', () => {
  expect(typeof Location).toBe('function');

  expect(Location.$$native).toBe(LINE_NAITVE_TYPE);
  expect(Location.$$entry).toBe(undefined);
  expect(Location.$$unit).toBe(true);
});

it('render match snapshot', () => {
  expect(
    render(
      <Location
        title="WHERE AM I?"
        address="NARNIA"
        lat={51.756779}
        long={-1.189902}
      />
    ).map(act => act.value)
  ).toMatchSnapshot();
});
