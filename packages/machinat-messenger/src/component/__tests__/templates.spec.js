import moxy from 'moxy';
import Machinat, { SEGMENT_BREAK } from 'machinat';

import { MESSENGER_NATIVE_TYPE } from '../../constant';
import {
  GenericItem,
  GenericTemplate,
  ListTemplate,
  ButtonTemplate,
  MediaTemplate,
  OpenGraphTemplate,
  ReceiptTemplate,
  ReceiptItem,
} from '../template';
import { URLButton, PostbackButton, CallButton } from '../button';
import renderHelper from './renderHelper';

const buttons = (
  <>
    <URLButton title="check" url="http://xxx.yy.z" />
    <PostbackButton title="more" payload="_MORE_" />
    <CallButton title="call us" number="+12345678" />
  </>
);

const buttonsRendered = [
  {
    type: 'part',
    node: buttons.props.children[0],
    value: '__RENDERED_BUTTON_OBJ_1__',
  },
  {
    type: 'part',
    node: buttons.props.children[1],
    value: '__RENDERED_BUTTON_OBJ_2__',
  },
  {
    type: 'part',
    node: buttons.props.children[2],
    value: '__RENDERED_BUTTON_OBJ_3__',
  },
];

const genericItems = (
  <>
    <GenericItem title="foo1" subtitle="bar" />
    <GenericItem title="foo2" subtitle="baz" />
    <GenericItem title="foo3" imageURL="http://foo.bar/image" />
  </>
);
const genericItemsRendered = [
  {
    type: 'part',
    node: genericItems.props.children[0],
    value: '__RENDERED_GENERIC_ITEM_OBJ_1__',
  },
  {
    type: 'part',
    node: genericItems.props.children[1],
    value: '__RENDERED_GENERIC_ITEM_OBJ_2__',
  },
  {
    type: 'part',
    node: genericItems.props.children[2],
    value: '__RENDERED_GENERIC_ITEM_OBJ_3__',
  },
];

const renderWithFixtures = async node =>
  node
    ? node === buttons
      ? buttonsRendered
      : node === genericItems
      ? genericItemsRendered
      : [{ type: 'raw', node, value: node }]
    : null;

const renderInner = moxy(renderWithFixtures);
const render = renderHelper(renderInner);

afterEach(() => {
  renderInner.mock.reset();
});

describe('templates Components', () => {
  test.each([
    GenericTemplate,
    ListTemplate,
    ButtonTemplate,
    MediaTemplate,
    OpenGraphTemplate,
    ReceiptTemplate,
  ])('attribute of %p', Template => {
    expect(typeof Template).toBe('function');
    expect(Template.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(Template.$$entry).toBe('me/messages');
    expect(Template.$$namespace).toBe('Messenger');
  });

  test.each([GenericItem, ReceiptItem])('attribute of %p', Item => {
    expect(typeof Item).toBe('function');
    expect(Item.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(Item.$$entry).toBe(undefined);
    expect(Item.$$namespace).toBe('Messenger');
  });

  describe('GenericItem', async () => {
    beforeEach(() => {
      renderInner.mock.fake(async node =>
        node && node.type === URLButton
          ? [
              {
                type: 'part',
                node,
                value: {
                  title: 'TITLE!',
                  type: 'web_url',
                  url: 'http://foo.bar/',
                  webview_height_ratio: 'compact',
                  messenger_extensions: true,
                  fallback_url: 'http://foo.baz/login',
                  webview_share_button: 'hide',
                },
              },
            ]
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', async () => {
      await expect(
        Promise.all(
          [
            <GenericItem title="foo" />,
            <GenericItem title="foo" subtitle="bar" />,
            <GenericItem title="foo" imageURL="http://foo.bar/image" />,
            <GenericItem title="foo">{buttons}</GenericItem>,
            <GenericItem
              title="foo"
              defaultAction={
                <URLButton
                  title="TITLE!"
                  url="http://foo.bar/"
                  heightRatio="compact"
                  extensions
                  fallbackURL="http://foo.baz/login"
                  hideShareButton
                />
              }
            />,
            <GenericItem
              title="foo"
              defaultAction={{
                type: 'web_url',
                url: 'http://foo.bar/',
                webview_height_ratio: 'compact',
                messenger_extensions: true,
                fallback_url: 'http://foo.baz/login',
                webview_share_button: 'hide',
              }}
            />,
            <GenericItem
              title="foo"
              subtitle="bar"
              imageURL="http://foo.bar/image"
              defaultAction={{
                type: 'web_url',
                url: 'http://foo.bar/',
                webview_height_ratio: 'compact',
                messenger_extensions: true,
                fallback_url: 'http://foo.baz/login',
                webview_share_button: 'hide',
              }}
            >
              {buttons}
            </GenericItem>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('throw if non URLButton element received in defaultAction', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(
        node =>
          node && [
            {
              type: 'part',
              node,
              value: { Ihave: 'a riddle for U' },
              path: '$:0#GenericItem.defaultAction:0',
            },
          ]
      );

      await expect(
        render(<GenericItem title="foo" defaultAction={<Unknown />} />)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#GenericItem.defaultAction:0 is invalid, only <[URLButton]/> allowed"`
      );
    });

    it('render children for "buttons" field', async () => {
      const [{ value }] = await render(
        <GenericItem title="Look!">{buttons}</GenericItem>
      );

      expect(value.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);
      expect(renderInner.mock).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async node =>
        node === '__BUTTONS__'
          ? [
              ...buttonsRendered,
              {
                value: 'x',
                node: <Unknown />,
                path: '$:0#GenericItem.children:3',
              },
            ]
          : null
      );

      await expect(
        render(<GenericItem title="foo">{'__BUTTONS__'}</GenericItem>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#GenericItem.children:3 is invalid, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('GenericTemplate', () => {
    it('match snapshot', async () => {
      await expect(
        Promise.all(
          [
            <GenericTemplate>{genericItems}</GenericTemplate>,
            <GenericTemplate imageAspectRatio="square" sharable>
              {genericItems}
            </GenericTemplate>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('render children as "elements" field', async () => {
      const [{ value }] = await render(
        <GenericTemplate>{genericItems}</GenericTemplate>
      );

      expect(value.message.attachment.payload.elements).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(genericItems, '.children');
    });

    it('throw if non GenericItem element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async node =>
        node === '__ITEMS__'
          ? [
              ...genericItemsRendered,
              {
                type: 'part',
                value: 'x',
                node: <Unknown />,
                path: '$:0#GenericTemplate.children:2',
              },
            ]
          : null
      );

      await expect(
        render(<GenericTemplate>{'__ITEMS__'}</GenericTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#GenericTemplate.children:2 is invalid, only <[GenericItem]/> allowed"`
      );
    });
  });

  describe('ListTemplate', () => {
    const button = buttons.props.children[0];
    beforeEach(() => {
      renderInner.mock.fake(async node =>
        node && node.type === URLButton
          ? buttonsRendered.slice(0, 1)
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', async () => {
      await expect(
        Promise.all(
          [
            <ListTemplate>{genericItems}</ListTemplate>,
            <ListTemplate button={button}>{genericItems}</ListTemplate>,
            <ListTemplate button={button} imageAspectRatio="square" sharable>
              {genericItems}
            </ListTemplate>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('render children as "elements" field', async () => {
      const [{ value }] = await render(
        <ListTemplate>{genericItems}</ListTemplate>
      );

      expect(value.message.attachment.payload.elements).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(genericItems, '.children');
    });

    it('render button prop as "buttons" field', async () => {
      const [{ value }] = await render(
        <ListTemplate button={button}>{genericItems}</ListTemplate>
      );

      expect(value.message.attachment.payload.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
      ]);
      expect(renderInner.mock).toHaveBeenCalledWith(button, '.button');
    });

    it('throw if non GenericItem element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async node =>
        node === '__ITEMS__'
          ? [
              ...genericItemsRendered,
              {
                type: 'part',
                value: 'x',
                node: <Unknown />,
                path: '$:0#ListTemplate.children:3',
              },
            ]
          : null
      );

      await expect(
        render(<ListTemplate>{'__ITEMS__'}</ListTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#ListTemplate.children:3 is invalid, only <[GenericItem]/> allowed"`
      );
    });
  });

  describe('ButtonTemplate', () => {
    const textNodes = [<i>foo</i>, <b>bar</b>, <del>baz</del>];
    beforeEach(() => {
      renderInner.mock.fake(async node =>
        node === textNodes || typeof node === 'string'
          ? [
              {
                type: 'text',
                value: '\n__RENDERED_TEXT_1__',
                node: textNodes[0],
              },
              {
                type: 'text',
                value: '\n__RENDERED_TEXT_2__',
                node: textNodes[1],
              },
              {
                type: 'text',
                value: '\n__RENDERED_TEXT_3__',
                node: textNodes[2],
              },
            ]
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', async () => {
      await expect(
        Promise.all(
          [
            <ButtonTemplate text="abc" sharable>
              {buttons}
            </ButtonTemplate>,
            <ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('render children as "buttons" field', async () => {
      const [{ value }] = await render(
        <ButtonTemplate text="abc">{buttons}</ButtonTemplate>
      );

      expect(value.message.attachment.payload.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async node =>
        node === '__BUTTONS__'
          ? [
              ...buttonsRendered,
              {
                type: 'part',
                value: 'x',
                node: <Unknown />,
                path: '$:0#ButtonTemplate.children:3',
              },
            ]
          : [{ type: 'text', value: 'foo', node }]
      );

      await expect(
        render(<ButtonTemplate text="foo">{'__BUTTONS__'}</ButtonTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#ButtonTemplate.children:3 is invalid, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });

    it('render text prop as "text" field', async () => {
      const expectedTextOutput = `
__RENDERED_TEXT_1__
__RENDERED_TEXT_2__
__RENDERED_TEXT_3__`;

      const segments1 = await render(
        <ButtonTemplate text="abc">{buttons}</ButtonTemplate>
      );
      expect(segments1[0].value.message.attachment.payload.text).toEqual(
        expectedTextOutput
      );

      const segments2 = await render(
        <ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>
      );
      expect(segments2[0].value.message.attachment.payload.text).toEqual(
        expectedTextOutput
      );

      expect(renderInner.mock).toHaveBeenCalledWith('abc', '.text');
      expect(renderInner.mock).toHaveBeenCalledWith(textNodes, '.text');
    });

    it('throw if text prop is empty', async () => {
      renderInner.mock.fake(async () => null);

      await expect(
        render(<ButtonTemplate />)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"prop \\"text\\" of <ButtonTemplate /> should not be empty"`
      );
    });

    it('throw if <br /> contained in text prop', async () => {
      renderInner.mock.fake(async () => [
        { type: 'text', value: 'foo', node: 'foo' },
        { type: 'break', value: SEGMENT_BREAK, node: <br /> },
        { type: 'text', value: 'bar', node: 'bar' },
      ]);

      expect(
        render(<ButtonTemplate text={'_somthing_with_<br />_'} />)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<br /> in prop \\"text\\" of <ButtonTemplate /> is invalid"`
      );
    });
  });

  describe('MediaTemplate', () => {
    it('match snapshot', async () => {
      await expect(
        Promise.all(
          [
            <MediaTemplate type="image" url="http://...">
              {buttons}
            </MediaTemplate>,
            <MediaTemplate type="video" attachmentId="__ID__" sharable>
              {buttons}
            </MediaTemplate>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('render children as "buttons" field', async () => {
      const [{ value }] = await render(
        <MediaTemplate type="image" url="http://...">
          {buttons}
        </MediaTemplate>
      );

      expect(value.message.attachment.payload.elements[0].buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async () => [
        ...buttonsRendered,
        {
          type: 'part',
          value: 'x',
          node: <Unknown />,
          path: '$:0#MediaTemplate.children:3',
        },
      ]);

      await expect(
        render(<MediaTemplate>{'__BUTTONS__'}</MediaTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#MediaTemplate.children:3 is invalid, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('OpenGraphTemplate', () => {
    it('match snapshot', async () => {
      expect(
        Promise.all(
          [
            <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>,
            <OpenGraphTemplate url="http://..." sharable>
              {buttons}
            </OpenGraphTemplate>,
          ].map(render)
        )
      ).resolves.toMatchSnapshot();
    });

    it('render children as "buttons" field', async () => {
      const [{ value }] = await render(
        <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>
      );

      expect(value.message.attachment.payload.elements[0].buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async () => [
        ...buttonsRendered,
        {
          type: 'part',
          value: 'x',
          node: <Unknown />,
          path: '$:0#OpenGraphTemplate.children:3',
        },
      ]);

      await expect(
        render(<OpenGraphTemplate>{'__BUTTONS__'}</OpenGraphTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#OpenGraphTemplate.children:3 is invalid, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('ReceiptItem', () => {
    it('match snapshot', async () => {
      await expect(
        render(
          <ReceiptItem
            title="A robot!"
            subtitle="It's real!"
            quantity={999}
            price={99.99}
            currency="USD"
            imageURL="http://i.robot/avatar"
          />
        )
      ).resolves.toMatchSnapshot();
    });
  });

  describe('ReceiptTemplate', () => {
    const items = [
      <ReceiptItem title="Buzz Lightyear" />,
      <ReceiptItem title="Woody" />,
      <ReceiptItem title="Slinky Dog" />,
    ];

    const receiptTemplateItemSegments = [
      {
        type: 'part',
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
        node: items[0],
        path: '$:0#ReceiptTemplate.children:0',
      },
      {
        type: 'part',
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
        node: items[1],
        path: '$:0#ReceiptTemplate.children:1',
      },
      {
        type: 'part',
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
        node: items[2],
        path: '$:0#ReceiptTemplate.children:2',
      },
    ];

    beforeEach(() => {
      renderInner.mock.fake(async node =>
        node && node === items
          ? receiptTemplateItemSegments
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', async () => {
      await expect(
        render(
          <ReceiptTemplate
            sharable
            recipientName="John Doe"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderURL="http://what.a.shop"
            timestamp="1428444852"
            address={{
              street_1: '1 Hacker Way',
              street_2: '',
              city: 'Menlo Park',
              postal_code: '94025',
              state: 'CA',
              country: 'US',
            }}
            summary={{
              subtotal: 75.0,
              shipping_cost: 4.95,
              total_tax: 6.19,
              total_cost: 56.14,
            }}
            adjustments={[
              {
                name: 'New Customer Discount',
                amount: 20,
              },
              {
                name: '$10 Off Coupon',
                amount: 10,
              },
            ]}
          >
            {items}
          </ReceiptTemplate>
        )
      ).resolves.toMatchSnapshot();
    });

    it('accept Date object for timestamp prop', async () => {
      expect(
        (await render(
          <ReceiptTemplate timestamp={new Date(1535622297000)}>
            {items}
          </ReceiptTemplate>
        )).value
      ).toEqual(
        (await render(
          <ReceiptTemplate timestamp="1535622297">{items}</ReceiptTemplate>
        )).value
      );
    });

    it('render children as "elements" field', async () => {
      const [{ value }] = await render(
        <ReceiptTemplate>{items}</ReceiptTemplate>
      );

      expect(value.message.attachment.payload.elements).toEqual([
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
      ]);

      expect(renderInner.mock).toHaveBeenCalledWith(items, '.children');
    });

    it('throw if non GenericItem element in children', async () => {
      const Unknown = () => {};

      renderInner.mock.fake(async node =>
        node === '__ITEMS__'
          ? [
              ...receiptTemplateItemSegments,
              {
                type: 'part',
                value: 'x',
                node: <Unknown />,
                path: '$:0#ReceiptTemplate.children:3',
              },
            ]
          : null
      );

      await expect(
        render(<ReceiptTemplate>{'__ITEMS__'}</ReceiptTemplate>)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> at $:0#ReceiptTemplate.children:3 is invalid, only <[ReceiptItem]/> allowed"`
      );
    });
  });
});
