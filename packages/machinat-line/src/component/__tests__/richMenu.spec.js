import Machinat from 'machinat';

import { LinkRichMenu } from '../richMenu';

import { LINE_NATIVE_TYPE } from '../../constant';
import LineChannel from '../../channel';

import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof LinkRichMenu).toBe('function');
  expect(LinkRichMenu.$$native).toBe(LINE_NATIVE_TYPE);
  expect(typeof LinkRichMenu.$$getEntry).toBe('function');
});

it('render ok', async () => {
  await expect(render(<LinkRichMenu id="_RICH_MENU_ID_" />)).resolves.toEqual([
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
        new LineChannel({
          type: 'user',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toBe('v2/bot/user/_USER_ID_/richmenu/_RICH_MENU_ID_');
  });

  it('throw if type of channel is not user', () => {
    expect(() =>
      LinkRichMenu.$$getEntry(
        new LineChannel({
          type: 'room',
          roomId: '_ROOM_ID_',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> can only be delivered in a user chatting channel"`
    );

    expect(() =>
      LinkRichMenu.$$getEntry(
        new LineChannel({
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        }),
        { id: '_RICH_MENU_ID_' }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<RichMenu /> can only be delivered in a user chatting channel"`
    );
  });
});
