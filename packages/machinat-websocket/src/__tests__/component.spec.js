import Machinat from 'machinat';

import { Event } from '../component';
import { WEBSOCKET_NATIVE_TYPE } from '../constant';

const render = element => element.type(element, null, '$');

it('is valid Component', () => {
  expect(Event.$$native).toBe(WEBSOCKET_NATIVE_TYPE);
  expect(Event.$$namespace).toBe('WebSocket');
  expect(typeof Event).toBe('function');
});

it('render to valid value', async () => {
  await expect(render(<Event />)).resolves.toEqual([
    { type: 'unit', node: <Event />, value: { type: 'default' }, path: '$' },
  ]);

  await expect(render(<Event type="foo" />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Event type="foo" />,
      value: { type: 'foo' },
      path: '$',
    },
  ]);

  await expect(render(<Event type="foo" subtype="bar" />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Event type="foo" subtype="bar" />,
      value: { type: 'foo', subtype: 'bar' },
      path: '$',
    },
  ]);

  await expect(
    render(<Event type="foo" subtype="bar" payload="baz" />)
  ).resolves.toEqual([
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
      only={['1', '2']}
      except={['2', '3']}
    />
  );
  await expect(render(eventWithBlackAndWhiteList)).resolves.toEqual([
    {
      type: 'unit',
      node: eventWithBlackAndWhiteList,
      value: {
        type: 'foo',
        subtype: 'bar',
        payload: 'baz',
        only: ['1', '2'],
        except: ['2', '3'],
      },
      path: '$',
    },
  ]);
});
