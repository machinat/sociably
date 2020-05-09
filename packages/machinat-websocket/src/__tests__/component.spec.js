import Machinat from '@machinat/core';

import { Event } from '../component';

const render = (element) => element.type(element, '$', () => null);

it('is valid Component', () => {
  expect(Event.$$platform).toBe('websocket');
  expect(typeof Event).toBe('function');
});

it('render to valid value', () => {
  expect(render(<Event />)).toEqual([
    { type: 'unit', node: <Event />, value: { type: 'default' }, path: '$' },
  ]);

  expect(render(<Event type="foo" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" />,
      value: { type: 'foo' },
      path: '$',
    },
  ]);

  expect(render(<Event type="foo" subtype="bar" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" subtype="bar" />,
      value: { type: 'foo', subtype: 'bar' },
      path: '$',
    },
  ]);

  expect(render(<Event type="foo" subtype="bar" payload="baz" />)).toEqual([
    {
      type: 'unit',
      node: <Event type="foo" subtype="bar" payload="baz" />,
      value: { type: 'foo', subtype: 'bar', payload: 'baz' },
      path: '$',
    },
  ]);
});
