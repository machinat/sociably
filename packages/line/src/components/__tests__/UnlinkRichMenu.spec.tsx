import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import LineChat from '../../Chat';
import { ChatActionSegmentValue } from '../../types';
import { UnlinkRichMenu } from '../UnlinkRichMenu';
import { renderUnitElement } from './utils';

describe('<UnlinkRichMenu/>', () => {
  it('is valid native unit component with entry getter', () => {
    expect(typeof UnlinkRichMenu).toBe('function');
    expect(isNativeType(<UnlinkRichMenu />)).toBe(true);
    expect(UnlinkRichMenu.$$platform).toBe('line');
  });

  it('render ok', async () => {
    await expect(renderUnitElement(<UnlinkRichMenu />)).resolves.toEqual([
      {
        type: 'unit',
        node: <UnlinkRichMenu />,
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
    const segments = await renderUnitElement(<UnlinkRichMenu />);
    const { getChatRequest } = segments?.[0].value as ChatActionSegmentValue;

    expect(
      getChatRequest?.(new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'))
    ).toEqual({
      method: 'DELETE',
      path: 'v2/bot/user/_USER_ID_/richmenu',
      body: null,
    });
  });

  test('getChatRequest throw if type of channel is not user', async () => {
    const segments = await renderUnitElement(<UnlinkRichMenu />);
    const { getChatRequest } = segments?.[0].value as ChatActionSegmentValue;

    expect(() =>
      getChatRequest?.(new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'))
    ).toThrowErrorMatchingInlineSnapshot(
      `"<UnlinkRichMenu /> can only be sent to an user chat"`
    );

    expect(() =>
      getChatRequest?.(new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'))
    ).toThrowErrorMatchingInlineSnapshot(
      `"<UnlinkRichMenu /> can only be sent to an user chat"`
    );
  });

  test('bulk api getter', async () => {
    const segments = await renderUnitElement(<UnlinkRichMenu />);
    const { getBulkRequest } = segments?.[0].value as ChatActionSegmentValue;

    expect(getBulkRequest?.(['foo', 'bar', 'baz'])).toEqual({
      method: 'POST',
      path: 'v2/bot/richmenu/bulk/unlink',
      body: {
        userIds: ['foo', 'bar', 'baz'],
      },
    });
  });
});
