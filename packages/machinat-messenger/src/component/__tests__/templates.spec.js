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
import renderHelper from './renderHelper';

const renderInside = jest.fn();
const render = renderHelper(renderInside);

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
    rendered: '__RENDERED_BUTTON_OBJ_1__',
  },
  {
    element: buttons.props.children[1],
    rendered: '__RENDERED_BUTTON_OBJ_2__',
  },
  {
    element: buttons.props.children[2],
    rendered: '__RENDERED_BUTTON_OBJ_3__',
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
    rendered: '__RENDERED_GENERIC_ITEM_OBJ_1__',
  },
  {
    element: genericItems.props.children[1],
    rendered: '__RENDERED_GENERIC_ITEM_OBJ_2__',
  },
  {
    element: genericItems.props.children[2],
    rendered: '__RENDERED_GENERIC_ITEM_OBJ_3__',
  },
];

afterEach(() => {
  renderInside.mockReset();
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
    it('match snapshot', () => {
      expect(
        [
          <GenericItem title="foo" />,
          <GenericItem title="foo" subtitle="bar" />,
          <GenericItem title="foo" imageUrl="http://foo.bar/image" />,
          <GenericItem
            title="foo"
            defaultAction={{
              type: 'web_url',
              url: 'http://foo.bar/',
              webview_height_ratio: 'compact',
              messenger_extensions: true,
              fallback_url: 'http://foo.baz/',
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
          />,
        ].map(render)
      ).toMatchSnapshot();
    });

    it('can use <URLButton /> as defaultAction', () => {
      const urlButton = (
        <URLButton
          url="http://foo.bar/"
          heightRatio="compact"
          extensions
          fallbackUrl="http://foo.baz/login"
          hideShareButton
        />
      );
      renderInside.mockReturnValue([
        {
          element: urlButton,
          rendered: {
            type: 'web_url',
            title: 'foobar',
            url: 'http://foo.bar/',
            webview_height_ratio: 'compact',
            messenger_extensions: true,
            fallback_url: 'http://foo.baz/login',
            webview_share_button: 'hide',
          },
        },
      ]);
      expect(
        render(<GenericItem title="foo" defaultAction={urlButton} />)
      ).toEqual(
        render(
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
          />
        )
      );
      expect(renderInside).toHaveBeenCalledWith(urlButton, '.defaultAction');
    });

    it('render children for "buttons" field', () => {
      renderInside.mockReturnValue(buttonsRendered);

      const rendered = render(
        <GenericItem title="Look!">{buttons}</GenericItem>
      );

      expect(rendered).toMatchSnapshot();
      expect(rendered.buttons).toEqual([
        '__RENDERED_BUTTON_OBJ_1__',
        '__RENDERED_BUTTON_OBJ_2__',
        '__RENDERED_BUTTON_OBJ_3__',
      ]);
      expect(renderInside).toHaveBeenCalledWith(buttons, '.children');
    });
  });

  describe('GenericTemplate', () => {
    beforeEach(() => {
      renderInside.mockReturnValue(genericItemsRendered);
    });

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
          node === genericItems
            ? genericItemsRendered
            : node && buttonsRendered.slice(0, 1)
      );
    });

    it('match snapshot', () => {
      expect(
        [
          <ListTemplate>{genericItems}</ListTemplate>,
          <ListTemplate imageAspectRatio="square" sharable>
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

      expect(rendered).toMatchSnapshot();
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
                { rendered: '\n__RENDERED_TEXT_1__', element: textNodes[0] },
                { rendered: '\n__RENDERED_TEXT_2__', element: textNodes[1] },
                { rendered: '\n__RENDERED_TEXT_3__', element: textNodes[2] },
              ]
            : buttonsRendered
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
    beforeEach(() => {
      renderInside.mockReturnValue(buttonsRendered);
    });

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
    beforeEach(() => {
      renderInside.mockReturnValue(buttonsRendered);
    });

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
      renderInside.mockReturnValue([
        {
          rendered: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_1__',
          element: items[0],
        },
        {
          rendered: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_2__',
          element: items[1],
        },
        {
          rendered: '__RENDERED_RECEIPT_TEMPLATE_ITEM_OBJ_3__',
          element: items[2],
        },
      ]);
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
