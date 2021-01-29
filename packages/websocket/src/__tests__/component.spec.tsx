import Machinat from '@machinat/core';

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

  expect(render(<Event type="foo" kind="bar" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" kind="bar" />,
      value: { type: 'foo', kind: 'bar' },
      path: '$',
    },
  ]);

  expect(render(<Event type="foo" kind="bar" payload="baz" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" kind="bar" payload="baz" />,
      value: { type: 'foo', kind: 'bar', payload: 'baz' },
      path: '$',
    },
  ]);
});
