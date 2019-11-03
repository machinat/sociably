import Machinat from 'machinat';

import { LINE_NATIVE_TYPE, ENTRY_GETTER } from '../../constant';
import LineChannel from '../../channel';
import { Leave } from '../leave';
import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof Leave).toBe('function');

  expect(Leave.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Leave.$$namespace).toBe('Line');
});

it('render ok with entry getter', async () => {
  await expect(render(<Leave />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Leave />,
      value: { [ENTRY_GETTER]: expect.any(Function) },
      path: '$',
    },
  ]);
});

test('entry getter point to the api entry for leaving', async () => {
  const [{ value }] = await render(<Leave />);
  expect(
    value[ENTRY_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/group/_GROUP_ID_/leave',
  });

  expect(
    value[ENTRY_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/room/_ROOM_ID_/leave',
  });
});

test('entry getter throw if type of channel is user', async () => {
  const [{ value }] = await render(<Leave />);

  expect(() =>
    value[ENTRY_GETTER](
      new LineChannel('_CHANNEL_ID_', {
        type: 'user',
        userId: '_USER_ID_',
      })
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<Leave /> should be only used in a group or room channel"`
  );
});
