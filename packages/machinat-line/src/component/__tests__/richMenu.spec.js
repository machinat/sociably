import Machinat from 'machinat';

import { LinkRichMenu } from '../richMenu';

import { LINE_NATIVE_TYPE } from '../../constant';
import LineThread from '../../thread';

import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof LinkRichMenu).toBe('function');
  expect(LinkRichMenu.$$native).toBe(LINE_NATIVE_TYPE);
  expect(typeof LinkRichMenu.$$getEntry).toBe('function');
});

it('render ok', () => {
  expect(render(<LinkRichMenu id="_RICH_MENU_ID_" />)).toEqual([
    {
      type: 'unit',
      node: <LinkRichMenu id="_RICH_MENU_ID_" />,
      value: {
        id: '_RICH_MENU_ID_',
      },
      path: '$',
    },
  ]);
});

describe('$$getEntry function', () => {
  it('point to the api entry for linking rich menu', () => {
    expect(
      LinkRichMenu.$$getEntry(
        new LineThread({
          type: 'user',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toBe('user/_USER_ID_/richmenu/_RICH_MENU_ID_');
  });

  it('throw if type of thread is not user', () => {
    expect(() =>
      LinkRichMenu.$$getEntry(
        new LineThread({
          type: 'room',
          roomId: '_ROOM_ID_',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> can only be delivered in a user chatting thread"`
    );

    expect(() =>
      LinkRichMenu.$$getEntry(
        new LineThread({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> can only be delivered in a user chatting thread"`
    );
  });
});
