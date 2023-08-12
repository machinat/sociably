import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import LineChat from '../../Chat.js';
import { Leave } from '../Leave.js';
import { ChatActionSegmentValue } from '../../types.js';
import { renderUnitElement } from './utils.js';

it('is valid native unit component with entry getter', () => {
  expect(typeof Leave).toBe('function');

  expect(isNativeType(<Leave />)).toBe(true);
  expect(Leave.$$platform).toBe('line');
});

it('render ok with entry getter', async () => {
  await expect(renderUnitElement(<Leave />)).resolves.toEqual([
    {
      type: 'unit',
      node: <Leave />,
      value: {
        type: 'chat_action',
        getBulkRequest: null,
        getChatRequest: expect.any(Function),
      },
      path: '$',
    },
  ]);
});

test('api request getter', async () => {
  const segemnts = await renderUnitElement(<Leave />);
  const { getChatRequest } = segemnts?.[0].value as ChatActionSegmentValue;

  expect(
    getChatRequest?.(new LineChat('_BOT_CHANNEL_ID_', 'group', '_GROUP_ID_'))
  ).toEqual({
    method: 'POST',
    url: 'v2/bot/group/_GROUP_ID_/leave',
    params: null,
  });

  expect(
    getChatRequest?.(new LineChat('_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_'))
  ).toEqual({
    method: 'POST',
    url: 'v2/bot/room/_ROOM_ID_/leave',
    params: null,
  });
});

test('getChatRequest throw if type of thread is user', async () => {
  const segemnts = await renderUnitElement(<Leave />);
  const { getChatRequest } = segemnts?.[0].value as ChatActionSegmentValue;

  expect(
    () =>
      getChatRequest?.(new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_'))
  ).toThrowErrorMatchingInlineSnapshot(
    `"<Leave /> cannot be used within an user thread"`
  );
});
