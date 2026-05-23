import { isNativeType } from '@sociably/core/utils';
import { Event } from '../component.js';

const render = (element) => element.type.$$render(element, '$', () => null);

it('is valid Component', () => {
  expect(isNativeType(<Event type="foo" />)).toBe(true);
  expect(Event.$$platform).toBe('websocket');
  expect(Event.$$name).toBe('Event');
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
