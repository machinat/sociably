import Machinat from '../../../../machinat';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import {
  GenericItem,
  GenericTemplate,
  ListTemplate,
  ButtonTemplate,
  MediaTemplate,
  OpenGraphTemplate,
  ReceiptTemplate,
  ReceiptTemplateItem,
} from '../template';
import { URLButton, PostbackButton, CallButton } from '../button';
import { QuickReply } from '../quickReply';
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
    <GenericItem title="foo3" imageUrl="http://foo.bar/image" />
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

const quickReplies = [
  <QuickReply title="A" />,
  <QuickReply title="B" />,
  <QuickReply title="C" />,
];
const quickRepliesRendered = [
  {
    value: '__RENDERED_QUICKREPLY_OBJ_1__',
    element: quickReplies[0],
  },
  {
    value: '__RENDERED_QUICKREPLY_OBJ_2__',
    element: quickReplies[1],
  },
  {
    value: '__RENDERED_QUICKREPLY_OBJ_3__',
    element: quickReplies[2],
  },
];

const renderWithFixtures = node =>
  node &&
  (node === buttons
    ? buttonsRendered
    : node === genericItems
      ? genericItemsRendered
      : node === quickReplies
        ? quickRepliesRendered
        : [{ value: node }]);

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
  ])('is valid root Component', Template => {
    expect(typeof Template).toBe('function');
    expect(Template.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Template.$$entry).toBe('me/messages');
    expect(Template.$$root).toBe(true);
  });

  test.each([GenericItem, ReceiptTemplateItem])('is valid Conponent', Item => {
    expect(typeof Item).toBe('function');
    expect(Item.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Item.$$entry).toBe(undefined);
    expect(Item.$$root).toBe(undefined);
  });

  describe('GenericItem', () => {
    beforeEach(() => {
      renderInside.mockImplementation(
        node =>
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
          <GenericItem title="foo" imageUrl="http://foo.bar/image" />,
          <GenericItem title="foo">{buttons}</GenericItem>,
          <GenericItem
            title="foo"
            defaultAction={
              <URLButton
                title="TITLE!"
                url="http://foo.bar/"
                heightRatio="compact"
                extensions
                fallbackUrl="http://foo.baz/login"
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
            imageUrl="http://foo.bar/image"
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
          fallbackUrl="http://foo.baz/login"
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

    it('render children for "buttons" field', () => {
      const rendered = render(
        <GenericItem title="Look!">{buttons}</GenericItem>
      );

      expect(rendered.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);
      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });
  });

  describe('GenericTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <GenericTemplate>{genericItems}</GenericTemplate>,
          <GenericTemplate quickReplies={quickReplies}>
            {genericItems}
          </GenericTemplate>,
          <GenericTemplate
            quickReplies={quickReplies}
            imageAspectRatio="square"
            sharable
          >
            {genericItems}
          </GenericTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "elements" field', () => {
      expect(
        render(<GenericTemplate>{genericItems}</GenericTemplate>).message
          .attachment.payload.elements
      ).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(genericItems, '.children');
    });
  });

  describe('ListTemplate', () => {
    const button = buttons.props.children[0];
    beforeEach(() => {
      renderInside.mockImplementation(
        node =>
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
          <ListTemplate quickReplies={quickReplies}>
            {genericItems}
          </ListTemplate>,
          <ListTemplate
            button={button}
            quickReplies={quickReplies}
            imageAspectRatio="square"
            sharable
          >
            {genericItems}
          </ListTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "elements" field', () => {
      expect(
        render(<ListTemplate>{genericItems}</ListTemplate>).message.attachment
          .payload.elements
      ).toEqual([
        '__RENDERED_GENERIC_ITEM_OBJ_1__',
        '__RENDERED_GENERIC_ITEM_OBJ_2__',
        '__RENDERED_GENERIC_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(genericItems, '.children');
    });

    it('render button prop as "buttons" field', () => {
      const rendered = render(
        <ListTemplate button={button}>{genericItems}</ListTemplate>
      );

      expect(rendered.message.attachment.payload.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
      ]);
      expect(renderInside).toHaveBeenCalledWith(button, '.button');
    });
  });

  describe('ButtonTemplate', () => {
    const textNodes = [<i>foo</i>, <b>bar</b>, <del>baz</del>];
    beforeEach(() => {
      renderInside.mockImplementation(
        node =>
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
          <ButtonTemplate text="abc" quickReplies={quickReplies} sharable>
            {buttons}
          </ButtonTemplate>,
          <ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      expect(
        render(<ButtonTemplate text="abc">{buttons}</ButtonTemplate>).message
          .attachment.payload.buttons
      ).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });

    it('render text prop as "text" field', () => {
      const expectedTextOutput = `
__RENDERED_TEXT_1__
__RENDERED_TEXT_2__
__RENDERED_TEXT_3__`;
      expect(
        render(<ButtonTemplate text="abc">{buttons}</ButtonTemplate>).message
          .attachment.payload.text
      ).toEqual(expectedTextOutput);
      expect(
        render(<ButtonTemplate text={textNodes}>{buttons}</ButtonTemplate>)
          .message.attachment.payload.text
      ).toEqual(expectedTextOutput);

      expect(renderInside).toHaveBeenCalledWith('abc', '.text');
      expect(renderInside).toHaveBeenCalledWith(textNodes, '.text');
    });
  });

  describe('MediaTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <MediaTemplate type="image" url="http://...">
            {buttons}
          </MediaTemplate>,
          <MediaTemplate
            quickReplies={quickReplies}
            type="video"
            attachmentId="__ID__"
            sharable
          >
            {buttons}
          </MediaTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      expect(
        render(
          <MediaTemplate type="image" url="http://...">
            {buttons}
          </MediaTemplate>
        ).message.attachment.payload.elements[0].buttons
      ).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });
  });

  describe('OpenGraphTemplate', () => {
    it('match snapshot', () => {
      expect(
        [
          <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>,
          <OpenGraphTemplate
            quickReplies={quickReplies}
            url="http://..."
            sharable
          >
            {buttons}
          </OpenGraphTemplate>,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('render children as "buttons" field', () => {
      expect(
        render(
          <OpenGraphTemplate url="http://...">{buttons}</OpenGraphTemplate>
        ).message.attachment.payload.elements[0].buttons
      ).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });
  });

  describe('ReceiptTemplateItem', () => {
    it('match snapshot', () => {
      expect(
        <ReceiptTemplateItem
          title="A robot!"
          subtitle="It's real!"
          quantity={999}
          price={99.99}
          currency="USD"
          imageUrl="http://i.robot/avatar"
        />
      ).toMatchSnapshot();
    });
  });

  describe('ReceiptTemplate', () => {
    const items = [
      <ReceiptTemplateItem title="Buzz Lightyear" />,
      <ReceiptTemplateItem title="Woody" />,
      <ReceiptTemplateItem title="Slinky Dog" />,
    ];
    beforeEach(() => {
      renderInside.mockImplementation(
        node =>
          node && node === items
            ? [
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
              ]
            : renderWithFixtures(node)
      );
    });

    it('match snapshot', () => {
      expect(
        render(
          <ReceiptTemplate
            quickReplies={quickReplies}
            sharable
            recipientName="John Doe"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderUrl="http://what.a.shop"
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
      expect(
        render(<ReceiptTemplate>{items}</ReceiptTemplate>).message.attachment
          .payload.elements
      ).toEqual([
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
        '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
      ]);

      expect(renderInside).toHaveBeenCalledWith(items, '.children');
    });
  });
});
