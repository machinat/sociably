import Sociably from '@sociably/core';

import { Event } from '../component';

const render = (element) => element.type(element, '$', () => null);

it('is valid Component', () => {
  expect(Event.$$platform).toBe('websocket');
  expect(typeof Event).toBe('function');
});

it('render to valid value', () => {
  expect(render(<Event type="foo" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" />,
      value: { type: 'foo' },
      path: '$',
    },
  ]);

  expect(render(<Event type="foo" category="bar" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" category="bar" />,
      value: { type: 'foo', category: 'bar' },
      path: '$',
    },
  ]);

  expect(render(<Event type="foo" category="bar" payload="baz" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" category="bar" payload="baz" />,
      value: { type: 'foo', category: 'bar', payload: 'baz' },
      path: '$',
    },
  ]);
});
