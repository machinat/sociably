import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from '../../constant';
import LineChat from '../../Chat';
import { Leave } from '../leave';

const renderer = new Renderer('line', () => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof Leave).toBe('function');

  expect(isNativeType(<Leave />)).toBe(true);
  expect(Leave.$$platform).toBe('line');
});

it('render ok with entry getter', async () => {
  await expect(renderer.render(<Leave />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Leave />,
      value: {
        [CHANNEL_REQUEST_GETTER]: expect.any(Function),
        [BULK_REQUEST_GETTER]: expect.any(Function),
      },
      path: '$',
    },
  ]);
});

test('channel api call getter', async () => {
  const [{ value }] = await renderer.render(<Leave />);
  expect(
    value[CHANNEL_REQUEST_GETTER](
      new LineChat('_BOT_CHANNEL_ID_', 'group', '_GROUP_ID_')
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/group/_GROUP_ID_/leave',
    body: null,
  });

  expect(
    value[CHANNEL_REQUEST_GETTER](
      new LineChat('_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_')
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/room/_ROOM_ID_/leave',
    body: null,
  });
});

test('channel api call getter throw if type of channel is user', async () => {
  const [{ value }] = await renderer.render(<Leave />);

  expect(() =>
    value[CHANNEL_REQUEST_GETTER](
      new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_')
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<Leave /> should cannot be used within an user channel"`
  );
});

test('bulk api call getter throw', async () => {
  const [{ value }] = await renderer.render(<Leave />);

  expect(() =>
    value[BULK_REQUEST_GETTER](
      new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_')
    )
  ).toThrowErrorMatchingInlineSnapshot(`"cannot <Leave/> using multicast api"`);
});
