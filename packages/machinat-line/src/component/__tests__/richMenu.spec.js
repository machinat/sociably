import Machinat from 'machinat';

import { LinkRichMenu } from '../richMenu';

import { LINE_NAITVE_TYPE } from '../../symbol';
import { ChatThread } from '../../thread';

import render from './render';

it('is valid native unit component', () => {
  expect(typeof LinkRichMenu).toBe('function');

  expect(LinkRichMenu.$$native).toBe(LINE_NAITVE_TYPE);
  expect(LinkRichMenu.$$unit).toBe(true);
});

it('render ok', () => {
  expect(render(<LinkRichMenu id="_RICH_MENU_ID_" />)[0].value).toEqual({
    id: '_RICH_MENU_ID_',
  });
});

describe('$$entry function', () => {
  it('point to the api entry for linking rich menu', () => {
    expect(
      LinkRichMenu.$$entry(
        new ChatThread({
          type: 'user',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toBe('user/_USER_ID_/richmenu/_RICH_MENU_ID_');
  });

  it('throw if type of thread is not user', () => {
    expect(() =>
      LinkRichMenu.$$entry(
        new ChatThread({
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
      LinkRichMenu.$$entry(
        new ChatThread({
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
