import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils';

import {
  GenericItem,
  GenericTemplate,
  ButtonTemplate,
  MediaTemplate,
  ReceiptTemplate,
  ReceiptItem,
} from '../template';
import { UrlButton, PostbackButton, CallButton } from '../button';

const generalComponentDelegator = moxy(() => null);
const renderer = new Renderer('messenger', generalComponentDelegator);

test.each([GenericTemplate, ButtonTemplate, MediaTemplate, ReceiptTemplate])(
  'attribute of %p',
  (Template) => {
    expect(typeof Template).toBe('function');
    expect(isNativeType(<Template />)).toBe(true);
    expect(Template.$$platform).toBe('messenger');
  }
);

test.each([GenericItem, ReceiptItem])('attribute of %p', (Item) => {
  expect(typeof Item).toBe('function');
  expect(isNativeType(<Item />)).toBe(true);
  expect(Item.$$platform).toBe('messenger');
});

describe('GenericTemplate', () => {
  const items = [
    <GenericItem
      title="foo"
      imageUrl="http://foo.bar/image"
      buttons={[<UrlButton title="check" url="http://xxx.yy.z" />]}
    />,
    <GenericItem
      title="foo"
      subtitle="bar"
      imageUrl="http://foo.bar/image"
      defaultAction={<UrlButton title="TITLE!" url="http://foo.bar/" />}
      buttons={[
        <UrlButton title="check" url="http://xxx.yy.z" />,
        <PostbackButton title="more" payload="_MORE_" />,
        <CallButton title="call us" number="+12345678" />,
      ]}
    />,
  ];

  it('match snapshot', async () => {
    await expect(
      renderer.render(
        <>
          <GenericTemplate>{items}</GenericTemplate>
          <GenericTemplate imageAspectRatio="square" sharable>
            {items}
          </GenericTemplate>
        </>
      )
    ).resolves.toMatchSnapshot();
  });
});

describe('ButtonTemplate', () => {
  it('match snapshot', async () => {
    generalComponentDelegator.mock.fake((node, path) => [
      { type: 'text', value: node.props.children, node, path },
    ]);

    const buttons = [
      <UrlButton title="check" url="http://xxx.yy.z" />,
      <PostbackButton title="more" payload="_MORE_" />,
      <CallButton title="call us" number="+12345678" />,
    ];

    await expect(
      renderer.render(
        <>
          <ButtonTemplate buttons={buttons}>
            hello button template
          </ButtonTemplate>
          <ButtonTemplate buttons={buttons} sharable>
            <i>foo</i>
            <b>bar</b>
            <del>baz</del>
          </ButtonTemplate>
        </>
      )
    ).resolves.toMatchSnapshot();
  });

  it('render empty string as text if children is empty', async () => {
    const template = (
      <ButtonTemplate buttons={<PostbackButton title="foo" payload="foo" />} />
    );
    await expect(renderer.render(template)).resolves.toEqual([
      {
        type: 'unit',
        value: {
          message: {
            attachment: {
              type: 'template',
              payload: {
                text: '',
                template_type: 'button',
                buttons: [{ payload: 'foo', title: 'foo', type: 'postback' }],
              },
            },
          },
        },
        node: template,
        path: '$',
      },
    ]);
  });

  it('throw if <br /> contained in text prop', async () => {
    generalComponentDelegator.mock.fake((node, path) => [
      { type: 'break', node, path },
    ]);

    expect(
      renderer.render(
        <ButtonTemplate>
          foo
          <br />
          bar
        </ButtonTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <br /> received, only textual nodes allowed"`
    );
  });

  it('throw if non-text node contained in text prop', async () => {
    generalComponentDelegator.mock.fake((node, path) => [
      { type: 'part', value: { some: 'stranger' }, node, path },
    ]);

    expect(
      renderer.render(
        <ButtonTemplate>
          foo
          <stranger />
          bar
        </ButtonTemplate>
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"non-textual node <stranger /> received, only textual nodes allowed"`
    );
  });
});

describe('MediaTemplate', () => {
  it('match snapshot', async () => {
    const buttons = [
      <UrlButton title="check" url="http://xxx.yy.z" />,
      <PostbackButton title="more" payload="_MORE_" />,
      <CallButton title="call us" number="+12345678" />,
    ];

    await expect(
      renderer.render(
        <>
          <MediaTemplate mediaType="image" url="http://..." buttons={buttons} />
          <MediaTemplate
            mediaType="video"
            attachmentId="__ID__"
            sharable
            buttons={buttons}
          />
        </>
      )
    ).resolves.toMatchSnapshot();
  });
});

describe('ReceiptTemplate', () => {
  it('match snapshot', async () => {
    await expect(
      renderer.render(
        <>
          <ReceiptTemplate
            recipientName="John Doe"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderUrl="http://what.a.shop"
            summary={{ total_cost: 56.14 }}
          />

          <ReceiptTemplate
            recipientName="John Doe"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderUrl="http://what.a.shop"
            summary={{ total_cost: 56.14 }}
          >
            <ReceiptItem title="Buzz Lightyear" price={9.99} />
            <ReceiptItem title="Woody" price={9.99} />
            <ReceiptItem title="Slinky Dog" price={9.99} />
          </ReceiptTemplate>

          <ReceiptTemplate
            sharable
            recipientName="John Doe"
            merchantName="AI"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderUrl="http://what.a.shop"
            timestamp="1428444852"
            address={{
              street_1: '1 Hacker Way',
              street_2: 'Somewhere...',
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
              { name: 'New Customer Discount', amount: 20 },
              { name: '$10 Off Coupon', amount: 10 },
            ]}
          >
            <ReceiptItem
              title="A robot!"
              subtitle="It's real!"
              quantity={999}
              price={99.99}
              currency="USD"
              imageUrl="http://i.robot/avatar"
            />
          </ReceiptTemplate>
        </>
      )
    ).resolves.toMatchSnapshot();
  });

  it('accept Date object for timestamp prop', async () => {
    expect(
      (
        await renderer.render(
          <ReceiptTemplate timestamp={new Date(1535622297000)} />
        )
      ).value
    ).toEqual(
      (await renderer.render(<ReceiptTemplate timestamp="1535622297" />)).value
    );
  });
});
