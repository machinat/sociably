import Machinat from 'machinat';

import { LINE_NATIVE_TYPE } from '../../constant';
import LineChannel from '../../channel';
import { Leave } from '../leave';
import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof Leave).toBe('function');

  expect(Leave.$$native).toBe(LINE_NATIVE_TYPE);
  expect(typeof Leave.$$getEntry).toBe('function');
});

describe('$$getEntry function', () => {
  it('point to the api entry for leaving', () => {
    expect(
      Leave.$$getEntry(
        new LineChannel({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        })
      )
    ).toBe('v2/bot/group/_GROUP_ID_/leave');

    expect(
      Leave.$$getEntry(
        new LineChannel({
          type: 'room',
          roomId: '_ROOM_ID_',
          userId: '_USER_ID_',
        })
      )
    ).toBe('v2/bot/room/_ROOM_ID_/leave');
  });

  it('throw if type of channel is user', () => {
    expect(() =>
      Leave.$$getEntry(
        new LineChannel({
          type: 'user',
          userId: '_USER_ID_',
        })
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Leave /> should be only used in a group or room channel"`
    );
  });
});

it('render an empty object', async () => {
  await expect(render(<Leave />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Leave />,
      value: {},
      path: '$',
    },
  ]);
});
