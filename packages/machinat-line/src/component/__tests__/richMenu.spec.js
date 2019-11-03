import Machinat from 'machinat';

import { LinkRichMenu } from '../richMenu';

import { LINE_NATIVE_TYPE, ENTRY_GETTER } from '../../constant';
import LineChannel from '../../channel';

import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it('is valid native unit component with entry getter', () => {
  expect(typeof LinkRichMenu).toBe('function');
  expect(LinkRichMenu.$$native).toBe(LINE_NATIVE_TYPE);
  expect(LinkRichMenu.$$namespace).toBe('Line');
});

it('render ok', async () => {
  await expect(render(<LinkRichMenu id="_RICH_MENU_ID_" />)).resolves.toEqual([
    {
      type: 'unit',
      node: <LinkRichMenu id="_RICH_MENU_ID_" />,
      value: {
        id: '_RICH_MENU_ID_',
        [ENTRY_GETTER]: expect.any(Function),
      },
      path: '$',
    },
  ]);
});

test('entry getter point to the api entry for linking rich menu', async () => {
  const [{ value }] = await render(<LinkRichMenu id="_RICH_MENU_ID_" />);

  expect(
    value[ENTRY_GETTER].call(
      { id: '_RICH_MENU_ID_' },
      new LineChannel('_CHANNEL_ID_', {
        type: 'user',
        userId: '_USER_ID_',
      })
    )
  ).toEqual({
    method: 'POST',
    path: 'v2/bot/user/_USER_ID_/richmenu/_RICH_MENU_ID_',
  });
});

test('entry getter throw if type of channel is not user', async () => {
  const [{ value }] = await render(<LinkRichMenu id="_RICH_MENU_ID_" />);

  expect(() =>
    value[ENTRY_GETTER].call(
      { id: '_RICH_MENU_ID_' },
      new LineChannel('_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<RichMenu /> can only be delivered in a user chatting channel"`
  );

  expect(() =>
    value[ENTRY_GETTER].call(
      { id: '_RICH_MENU_ID_' },
      new LineChannel('_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"<RichMenu /> can only be delivered in a user chatting channel"`
  );
});
