import Machinat from 'machinat';

import { LinkRichMenu } from '../richMenu';

import { LINE_NAITVE_TYPE, NO_BODY } from '../../symbol';
import LineThread from '../../thread';

import render from './render';

it('is valid native unit component', () => {
  expect(typeof LinkRichMenu).toBe('function');

  expect(LinkRichMenu.$$native).toBe(LINE_NAITVE_TYPE);
  expect(LinkRichMenu.$$unit).toBe(true);
});

it('render to NO_BODY symbol', () => {
  expect(render(<LinkRichMenu id="_RICH_MENU_ID_" />)[0].value).toEqual({
    [NO_BODY]: true,
    id: '_RICH_MENU_ID_',
  });
});

describe('$$entry function', () => {
  it('point to the api entry for linking rich menu', () => {
    expect(
      LinkRichMenu.$$entry(
        new LineThread({
          type: 'user',
          userId: '_USER_ID_',
        }),
        { [NO_BODY]: true, id: '_RICH_MENU_ID_' }
      )
    ).toBe('user/_USER_ID_/richmenu/_RICH_MENU_ID_');
  });

  it('throw if type of thread is not user', () => {
    expect(() =>
      LinkRichMenu.$$entry(
        new LineThread({
          type: 'room',
          roomId: '_ROOM_ID_',
          userId: '_USER_ID_',
        }),
        { [NO_BODY]: true, id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> should be only used in a user thread"`
    );

    expect(() =>
      LinkRichMenu.$$entry(
        new LineThread({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        }),
        { [NO_BODY]: true, id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> should be only used in a user thread"`
    );
  });
});
