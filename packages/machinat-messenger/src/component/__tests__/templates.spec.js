import Machinat from 'machinat';

import { MACHINAT_ACTION_BREAK } from 'machinat-symbol';

import { MESSENGER_NAITVE_TYPE } from '../../symbol';
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
    element: buttons.props.children[0],
    value: '__RENDERED_BUTTON_OBJ_1__',
  },
  {
    element: buttons.props.children[1],
    value: '__RENDERED_BUTTON_OBJ_2__',
  },
  {
    element: buttons.props.children[2],
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
    element: genericItems.props.children[0],
    value: '__RENDERED_GENERIC_ITEM_OBJ_1__',
  },
  {
    element: genericItems.props.children[1],
    value: '__RENDERED_GENERIC_ITEM_OBJ_2__',
  },
  {
    element: genericItems.props.children[2],
    value: '__RENDERED_GENERIC_ITEM_OBJ_3__',
  },
];

const renderWithFixtures = node =>
  node
    ? node === buttons
      ? buttonsRendered
      : node === genericItems
      ? genericItemsRendered
      : [{ value: node }]
    : null;

const renderInside = jest.fn();
const render = renderHelper(renderInside);

afterEach(() => {
  renderInside.mockReset();
  renderInside.mockImplementation(renderWithFixtures);
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
    expect(Template.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Template.$$entry).toBe('me/messages');
    expect(Template.$$unit).toBe(true);
  });

  test.each([GenericItem, ReceiptItem])('attribute of %p', Item => {
    expect(typeof Item).toBe('function');
    expect(Item.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Item.$$entry).toBe(undefined);
    expect(Item.$$unit).toBe(false);
  });

  describe('GenericItem', () => {
    beforeEach(() => {
      renderInside.mockImplementation(node =>
        node && node.type === URLButton
          ? [
              {
                element: node,
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

    it('match snapshot', () => {
      expect(
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
      ).toMatchSnapshot();
    });

    it('can use <URLButton /> as defaultAction', () => {
      const urlButton = (
        <URLButton
          title="TITLE!"
          url="http://foo.bar/"
          heightRatio="compact"
          extensions
          fallbackURL="http://foo.baz/login"
          hideShareButton
        />
      );

      const plainObjAction = {
        type: 'web_url',
        url: 'http://foo.bar/',
        webview_height_ratio: 'compact',
        messenger_extensions: true,
        fallback_url: 'http://foo.baz/login',
        webview_share_button: 'hide',
      };

      expect(
        render(<GenericItem title="foo" defaultAction={urlButton} />)
      ).toEqual(
        render(<GenericItem title="foo" defaultAction={plainObjAction} />)
      );

      expect(renderInside).toHaveBeenCalledWith(urlButton, '.defaultAction');
      expect(renderInside).toHaveBeenCalledWith(
        plainObjAction,
        '.defaultAction'
      );
    });

    it('throw if non URLButton element received in defaultAction', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(
        node =>
          node && [
            {
              element: node,
              value: { Ihave: 'a riddle for U' },
            },
          ]
      );

      expect(() =>
        render(<GenericItem title="foo" defaultAction={<Unknown />} />)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .defaultAction, only <[URLButton]/> allowed"`
      );
    });

    it('render children for "buttons" field', () => {
      const [rendered] = render(
        <GenericItem title="Look!">{buttons}</GenericItem>
      );

      expect(rendered.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);
      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__BUTTONS__'
          ? [...buttonsRendered, { value: 'x', element: <Unknown /> }]
          : null
      );

      expect(() =>
        render(<GenericItem title="foo">{'__BUTTONS__'}</GenericItem>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('GenericTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <GenericTemplate>{genericItems}</GenericTemplate>,
          <GenericTemplate imageAspectRatio="square" sharable>
            {genericItems}
          </GenericTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "elements" field', () => {
      const [rendered] = render(
        <GenericTemplate>{genericItems}</GenericTemplate>
      );

      expect(rendered.message.attachment.payload.elements).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(genericItems, '.children');
    });

    it('throw if non GenericItem element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__ITEMS__'
          ? [...genericItemsRendered, { value: 'x', element: <Unknown /> }]
          : null
      );

      expect(() =>
        render(<GenericTemplate>{'__ITEMS__'}</GenericTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[GenericItem]/> allowed"`
      );
    });
  });

  describe('ListTemplate', () => {
    const button = buttons.props.children[0];
    beforeEach(() => {
      renderInside.mockImplementation(node =>
        node && node.type === URLButton
          ? buttonsRendered.slice(0, 1)
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', () => {
      expect(
        [
          <ListTemplate>{genericItems}</ListTemplate>,
          <ListTemplate button={button}>{genericItems}</ListTemplate>,
          <ListTemplate button={button} imageAspectRatio="square" sharable>
            {genericItems}
          </ListTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "elements" field', () => {
      const [rendered] = render(<ListTemplate>{genericItems}</ListTemplate>);

      expect(rendered.message.attachment.payload.elements).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(genericItems, '.children');
    });

    it('render button prop as "buttons" field', () => {
      const [rendered] = render(
        <ListTemplate button={button}>{genericItems}</ListTemplate>
      );

      expect(rendered.message.attachment.payload.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
      ]);
      expect(renderInside).toHaveBeenCalledWith(button, '.button');
    });

    it('throw if non GenericItem element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__ITEMS__'
          ? [...genericItemsRendered, { value: 'x', element: <Unknown /> }]
          : null
      );

      expect(() =>
        render(<ListTemplate>{'__ITEMS__'}</ListTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[GenericItem]/> allowed"`
      );
    });
  });

  describe('ButtonTemplate', () => {
    const textNodes = [<i>foo</i>, <b>bar</b>, <del>baz</del>];
    beforeEach(() => {
      renderInside.mockImplementation(node =>
        node === textNodes || typeof node === 'string'
          ? [
              { value: '\n__RENDERED_TEXT_1__', element: textNodes[0] },
              { value: '\n__RENDERED_TEXT_2__', element: textNodes[1] },
              { value: '\n__RENDERED_TEXT_3__', element: textNodes[2] },
            ]
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', () => {
      expect(
        [
          <ButtonTemplate text="abc" sharable>
            {buttons}
          </ButtonTemplate>,
          <ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      const [rendered] = render(
        <ButtonTemplate text="abc">{buttons}</ButtonTemplate>
      );

      expect(rendered.message.attachment.payload.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__BUTTONS__'
          ? [...buttonsRendered, { value: 'x', element: <Unknown /> }]
          : [{ value: 'foo', element: node }]
      );

      expect(() =>
        render(<ButtonTemplate text="foo">{'__BUTTONS__'}</ButtonTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });

    it('render text prop as "text" field', () => {
      const expectedTextOutput = `
__RENDERED_TEXT_1__
__RENDERED_TEXT_2__
__RENDERED_TEXT_3__`;

      const [rendered1] = render(
        <ButtonTemplate text="abc">{buttons}</ButtonTemplate>
      );

      expect(rendered1.message.attachment.payload.text).toEqual(
        expectedTextOutput
      );

      const [rendered2] = render(
        <ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>
      );

      expect(rendered2.message.attachment.payload.text).toEqual(
        expectedTextOutput
      );

      expect(renderInside).toHaveBeenCalledWith('abc', '.text');
      expect(renderInside).toHaveBeenCalledWith(textNodes, '.text');
    });

    it('throw if text prop is empty', () => {
      renderInside.mockImplementation(() => null);

      expect(() =>
        render(<ButtonTemplate />)
      ).toThrowErrorMatchingInlineSnapshot(
        `"prop \\"text\\" of <ButtonTemplate /> should not be empty"`
      );
    });

    it('throw if <br /> contained in text prop', () => {
      renderInside.mockImplementation(() => [
        { value: 'foo', element: 'foo' },
        { value: MACHINAT_ACTION_BREAK, element: <br /> },
        { value: 'bar', element: 'bar' },
      ]);

      expect(() =>
        render(<ButtonTemplate text={'_somthing_with_<br />_'} />)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<br /> in prop \\"text\\" of <ButtonTemplate /> is invalid"`
      );
    });
  });

  describe('MediaTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <MediaTemplate type="image" url="http://...">
            {buttons}
          </MediaTemplate>,
          <MediaTemplate type="video" attachmentId="__ID__" sharable>
            {buttons}
          </MediaTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      const [rendered] = render(
        <MediaTemplate type="image" url="http://...">
          {buttons}
        </MediaTemplate>
      );

      expect(rendered.message.attachment.payload.elements[0].buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__BUTTONS__'
          ? [...buttonsRendered, { value: 'x', element: <Unknown /> }]
          : [{ value: 'foo', element: node }]
      );

      expect(() =>
        render(<MediaTemplate>{'__BUTTONS__'}</MediaTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('OpenGraphTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>,
          <OpenGraphTemplate url="http://..." sharable>
            {buttons}
          </OpenGraphTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      const [rendered] = render(
        <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>
      );

      expect(rendered.message.attachment.payload.elements[0].buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });

    it('throw if non Button element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__BUTTONS__'
          ? [...buttonsRendered, { value: 'x', element: <Unknown /> }]
          : [{ value: 'foo', element: node }]
      );

      expect(() =>
        render(<OpenGraphTemplate>{'__BUTTONS__'}</OpenGraphTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[URLButton, PostbackButton, ShareButton, BuyButton, CallButton, LoginButton, LogoutButton, GamePlayButton]/> allowed"`
      );
    });
  });

  describe('ReceiptItem', () => {
    it('match snapshot', () => {
      expect(
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
      ).toMatchSnapshot();
    });
  });

  describe('ReceiptTemplate', () => {
    const items = [
      <ReceiptItem title="Buzz Lightyear" />,
      <ReceiptItem title="Woody" />,
      <ReceiptItem title="Slinky Dog" />,
    ];

    const receiptTemplateItemRendered = [
      {
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
        element: items[0],
      },
      {
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
        element: items[1],
      },
      {
        value: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
        element: items[2],
      },
    ];

    beforeEach(() => {
      renderInside.mockImplementation(node =>
        node && node === items
          ? receiptTemplateItemRendered
          : renderWithFixtures(node)
      );
    });

    it('match snapshot', () => {
      expect(
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
      ).toMatchSnapshot();
    });

    it('accept Date object for timestamp prop', () => {
      expect(
        render(
          <ReceiptTemplate timestamp={new Date(1535622297000)}>
            {items}
          </ReceiptTemplate>
        )
      ).toEqual(
        render(
          <ReceiptTemplate timestamp="1535622297">{items}</ReceiptTemplate>
        )
      );
    });

    it('render children as "elements" field', () => {
      const [rendered] = render(<ReceiptTemplate>{items}</ReceiptTemplate>);

      expect(rendered.message.attachment.payload.elements).toEqual([
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(items, '.children');
    });

    it('throw if non GenericItem element in children', () => {
      const Unknown = () => {};

      renderInside.mockImplementation(node =>
        node === '__ITEMS__'
          ? [
              ...receiptTemplateItemRendered,
              { value: 'x', element: <Unknown /> },
            ]
          : null
      );

      expect(() =>
        render(<ReceiptTemplate>{'__ITEMS__'}</ReceiptTemplate>)
      ).toThrowErrorMatchingInlineSnapshot(
        `"<Unknown /> is invalid in .children, only <[ReceiptItem]/> allowed"`
      );
    });
  });
});
