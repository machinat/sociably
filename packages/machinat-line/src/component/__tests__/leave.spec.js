import Machinat from 'machinat';

import { Leave } from '../leave';

import { LINE_NAITVE_TYPE, NO_RENDERED } from '../../symbol';
import LineThread from '../../thread';

import render from './render';

it('is valid native unit component', () => {
  expect(typeof Leave).toBe('function');

  expect(Leave.$$native).toBe(LINE_NAITVE_TYPE);
  expect(Leave.$$unit).toBe(true);
});

describe('$$entry function', () => {
  it('point to the api entry for leaving', () => {
    expect(
      Leave.$$entry(
        new LineThread({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        })
      )
    ).toBe('group/_GROUP_ID_/leave');

    expect(
      Leave.$$entry(
        new LineThread({
          type: 'room',
          roomId: '_ROOM_ID_',
          userId: '_USER_ID_',
        })
      )
    ).toBe('room/_ROOM_ID_/leave');
  });

  it('throw if type of thread is user', () => {
    expect(() =>
      Leave.$$entry(
        new LineThread({
          type: 'user',
          userId: '_USER_ID_',
        })
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Leave /> should be only used in a group or room thread"`
    );
  });
});

it('render to NO_RENDERED', () => {
  expect(render(<Leave />)[0].value).toEqual(NO_RENDERED);
});
