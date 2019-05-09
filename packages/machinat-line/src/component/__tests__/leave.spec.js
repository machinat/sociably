import Machinat from 'machinat';

import { LINE_NATIVE_TYPE } from '../../constant';
import LineThread from '../../thread';
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
        new LineThread({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        })
      )
    ).toBe('group/_GROUP_ID_/leave');

    expect(
      Leave.$$getEntry(
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
      Leave.$$getEntry(
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

it('render an empty object', () => {
  const segments = render(<Leave />);
  expect(segments.length).toBe(1);

  const segment = segments[0];
  expect(segment.type).toBe('unit');
  expect(segment.node).toEqual(<Leave />);
  expect(segment.path).toBe('$');
  expect(segment.value).toEqual({});
});
