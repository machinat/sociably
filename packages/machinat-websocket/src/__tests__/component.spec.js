import Machinat from 'machinat';

import { Event } from '../component';
import { WEBSOCKET_NATIVE_TYPE } from '../constant';

const render = element => element.type(element, null, '$');

it('is valid Component', () => {
  expect(Event.$$native).toBe(WEBSOCKET_NATIVE_TYPE);
  expect(Event.$$namespace).toBe('WebSocket');
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

  const eventWithBlackAndWhiteList = (
    <Event
      type="foo"
      subtype="bar"
      payload="baz"
      whitelist={['1', '2']}
      blacklist={['2', '3']}
    />
  );
  expect(render(eventWithBlackAndWhiteList)).toEqual([
    {
      type: 'unit',
      node: eventWithBlackAndWhiteList,
      value: {
        type: 'foo',
        subtype: 'bar',
        payload: 'baz',
        whitelist: ['1', '2'],
        blacklist: ['2', '3'],
      },
      path: '$',
    },
  ]);
});
