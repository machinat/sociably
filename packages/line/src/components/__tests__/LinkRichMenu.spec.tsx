import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import LineChat from '../../Chat.js';
import { ChatActionSegmentValue } from '../../types.js';
import { LinkRichMenu } from '../LinkRichMenu.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component with entry getter', () => {
  expect(typeof LinkRichMenu).toBe('function');
  expect(isNativeType(<LinkRichMenu id="" />)).toBe(true);
  expect(LinkRichMenu.$$platform).toBe('line');
});

it('render ok', async () => {
  await expect(
    renderUnitElement(<LinkRichMenu id="_RICH_MENU_ID_" />)
  ).resolves.toEqual([
    {
      type: 'unit',
      node: <LinkRichMenu id="_RICH_MENU_ID_" />,
      value: {
        type: 'chat_action',
        getChatRequest: expect.any(Function),
        getBulkRequest: expect.any(Function),
      },
      path: '$',
    },
  ]);
});

test('getChatRequest', async () => {
  const segments = await renderUnitElement(
    <LinkRichMenu id="_RICH_MENU_ID_" />
  );
  const { getChatRequest } = segments?.[0].value as ChatActionSegmentValue;

  expect(
    getChatRequest?.(new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'))
  ).toEqual({
    method: 'POST',
    url: 'v2/bot/user/_USER_ID_/richmenu/_RICH_MENU_ID_',
    params: null,
  });
});

test('getChatRequest throw if type of thread is not user', async () => {
  const segments = await renderUnitElement(
    <LinkRichMenu id="_RICH_MENU_ID_" />
  );
  const { getChatRequest } = segments?.[0].value as ChatActionSegmentValue;

  expect(() =>
    getChatRequest?.(new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'))
  ).toThrowErrorMatchingInlineSnapshot(
    `"<LinkRichMenu /> can only be sent to an user chat"`
  );

  expect(() =>
    getChatRequest?.(new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'))
  ).toThrowErrorMatchingInlineSnapshot(
    `"<LinkRichMenu /> can only be sent to an user chat"`
  );
});

test('bulk api getter', async () => {
  const segments = await renderUnitElement(
    <LinkRichMenu id="_RICH_MENU_ID_" />
  );
  const { getBulkRequest } = segments?.[0].value as ChatActionSegmentValue;

  expect(getBulkRequest?.(['foo', 'bar', 'baz'])).toEqual({
    method: 'POST',
    url: 'v2/bot/richmenu/bulk/link',
    params: {
      richMenuId: '_RICH_MENU_ID_',
      userIds: ['foo', 'bar', 'baz'],
    },
  });
});
