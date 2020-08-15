import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils/isX';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../../constant';
import LineChannel from '../../channel';
import { LinkRichMenu, UnlinkRichMenu } from '../richMenu';

const renderer = new Renderer('line', () => null);

describe('<LinkRichMenu/>', () => {
  it('is valid native unit component with entry getter', () => {
    expect(typeof LinkRichMenu).toBe('function');
    expect(isNativeType(<LinkRichMenu />)).toBe(true);
    expect(LinkRichMenu.$$platform).toBe('line');
  });

  it('render ok', async () => {
    await expect(
      renderer.render(<LinkRichMenu id="_RICH_MENU_ID_" />)
    ).resolves.toEqual([
      {
        type: 'unit',
        node: <LinkRichMenu id="_RICH_MENU_ID_" />,
        value: {
          id: '_RICH_MENU_ID_',
          [CHANNEL_API_CALL_GETTER]: expect.any(Function),
          [BULK_API_CALL_GETTER]: expect.any(Function),
        },
        path: '$',
      },
    ]);
  });

  test('channel api getter', async () => {
    const [{ value }] = await renderer.render(
      <LinkRichMenu id="_RICH_MENU_ID_" />
    );

    expect(
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel('_CHANNEL_ID_', '_BOT_CHANNEL_ID_', 'utob', '_USER_ID_')
      )
    ).toEqual({
      method: 'POST',
      path: 'v2/bot/user/_USER_ID_/richmenu/_RICH_MENU_ID_',
      body: null,
    });
  });

  test('channel api call getter throw if type of channel is not user', async () => {
    const [{ value }] = await renderer.render(
      <LinkRichMenu id="_RICH_MENU_ID_" />
    );

    expect(() =>
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel('_CHANNEL_ID_', '_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_')
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<LinkRichMenu /> can only be delivered in a utob chatting channel"`
    );

    expect(() =>
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel(
          '_CHANNEL_ID_',
          '_BOT_CHANNEL_ID_',
          'group',
          '_GROUP_ID_'
        )
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<LinkRichMenu /> can only be delivered in a utob chatting channel"`
    );
  });

  test('bulk api getter', async () => {
    const [{ value }] = await renderer.render(
      <LinkRichMenu id="_RICH_MENU_ID_" />
    );

    expect(value[BULK_API_CALL_GETTER](['foo', 'bar', 'baz'])).toEqual({
      method: 'POST',
      path: 'v2/bot/richmenu/bulk/link',
      body: {
        richMenuId: '_RICH_MENU_ID_',
        userIds: ['foo', 'bar', 'baz'],
      },
    });
  });
});

describe('<UnlinkRichMenu/>', () => {
  it('is valid native unit component with entry getter', () => {
    expect(typeof UnlinkRichMenu).toBe('function');
    expect(isNativeType(<UnlinkRichMenu />)).toBe(true);
    expect(UnlinkRichMenu.$$platform).toBe('line');
  });

  it('render ok', async () => {
    await expect(renderer.render(<UnlinkRichMenu />)).resolves.toEqual([
      {
        type: 'unit',
        node: <UnlinkRichMenu />,
        value: {
          [CHANNEL_API_CALL_GETTER]: expect.any(Function),
          [BULK_API_CALL_GETTER]: expect.any(Function),
        },
        path: '$',
      },
    ]);
  });

  test('channel api getter', async () => {
    const [{ value }] = await renderer.render(<UnlinkRichMenu />);

    expect(
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel('_CHANNEL_ID_', '_BOT_CHANNEL_ID_', 'utob', '_USER_ID_')
      )
    ).toEqual({
      method: 'DELETE',
      path: 'v2/bot/user/_USER_ID_/richmenu',
      body: null,
    });
  });

  test('channel api call getter throw if type of channel is not user', async () => {
    const [{ value }] = await renderer.render(<UnlinkRichMenu />);

    expect(() =>
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel('_CHANNEL_ID_', '_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_')
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<UnlinkRichMenu /> can only be delivered in a utob chatting channel"`
    );

    expect(() =>
      value[CHANNEL_API_CALL_GETTER](
        new LineChannel(
          '_CHANNEL_ID_',
          '_BOT_CHANNEL_ID_',
          'group',
          '_GROUP_ID_'
        )
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<UnlinkRichMenu /> can only be delivered in a utob chatting channel"`
    );
  });

  test('bulk api getter', async () => {
    const [{ value }] = await renderer.render(<UnlinkRichMenu />);

    expect(value[BULK_API_CALL_GETTER](['foo', 'bar', 'baz'])).toEqual({
      method: 'POST',
      path: 'v2/bot/richmenu/bulk/unlink',
      body: {
        userIds: ['foo', 'bar', 'baz'],
      },
    });
  });
});
