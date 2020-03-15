import moxy from 'moxy';
import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeElement } from '@machinat/core/utils/isXxx';

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

const generalComponentDelegator = moxy(() => null);
const renderer = new Renderer('messenger', generalComponentDelegator);

test.each([
  GenericTemplate,
  ListTemplate,
  ButtonTemplate,
  MediaTemplate,
  OpenGraphTemplate,
  ReceiptTemplate,
])('attribute of %p', Template => {
  expect(typeof Template).toBe('function');
  expect(isNativeElement(<Template />)).toBe(true);
  expect(Template.$$platform).toBe('messenger');
});

test.each([GenericItem, ReceiptItem])('attribute of %p', Item => {
  expect(typeof Item).toBe('function');
  expect(isNativeElement(<Item />)).toBe(true);
  expect(Item.$$platform).toBe('messenger');
});

describe('GenericTemplate', () => {
  const items = [
    <GenericItem
      title="foo"
      imageURL="http://foo.bar/image"
      buttons={[<URLButton title="check" url="http://xxx.yy.z" />]}
    />,
    <GenericItem
      title="foo"
      subtitle="bar"
      imageURL="http://foo.bar/image"
      defaultAction={<URLButton title="TITLE!" url="http://foo.bar/" />}
      buttons={[
        <URLButton title="check" url="http://xxx.yy.z" />,
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

describe('ListTemplate', () => {
  it('match snapshot', async () => {
    const items = [
      <GenericItem
        title="foo"
        imageURL="http://foo.bar/image"
        buttons={[<URLButton title="check" url="http://xxx.yy.z" />]}
      />,
      <GenericItem
        title="foo"
        subtitle="bar"
        imageURL="http://foo.bar/image"
        defaultAction={<URLButton title="TITLE!" url="http://foo.bar/" />}
        buttons={[<PostbackButton title="more" payload="_MORE_" />]}
      />,
    ];

    await expect(
      renderer.render(
        <>
          <ListTemplate>{items}</ListTemplate>
          <ListTemplate
            button={<PostbackButton title="more" payload="_MORE_" />}
            imageAspectRatio="square"
            sharable
          >
            {items}
          </ListTemplate>
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
      <URLButton title="check" url="http://xxx.yy.z" />,
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
      <URLButton title="check" url="http://xxx.yy.z" />,
      <PostbackButton title="more" payload="_MORE_" />,
      <CallButton title="call us" number="+12345678" />,
    ];

    await expect(
      renderer.render(
        <>
          <MediaTemplate type="image" url="http://..." buttons={buttons} />
          <MediaTemplate
            type="video"
            attachmentId="__ID__"
            sharable
            buttons={buttons}
          />
        </>
      )
    ).resolves.toMatchSnapshot();
  });
});

describe('OpenGraphTemplate', () => {
  it('match snapshot', async () => {
    const buttons = [
      <URLButton title="check" url="http://xxx.yy.z" />,
      <PostbackButton title="more" payload="_MORE_" />,
      <CallButton title="call us" number="+12345678" />,
    ];
    expect(
      renderer.render(
        <>
          <OpenGraphTemplate url="http://..." buttons={buttons} />
          <OpenGraphTemplate url="http://..." sharablebuttons={buttons} />
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
            orderURL="http://what.a.shop"
            summary={{ total_cost: 56.14 }}
          />

          <ReceiptTemplate
            recipientName="John Doe"
            orderNumber="12345"
            currency="USD"
            paymentMethod="Visa 2345"
            orderURL="http://what.a.shop"
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
            orderURL="http://what.a.shop"
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
              imageURL="http://i.robot/avatar"
            />
          </ReceiptTemplate>
        </>
      )
    ).resolves.toMatchSnapshot();
  });

  it('accept Date object for timestamp prop', async () => {
    expect(
      (await renderer.render(
        <ReceiptTemplate timestamp={new Date(1535622297000)} />
      )).value
    ).toEqual(
      (await renderer.render(<ReceiptTemplate timestamp="1535622297" />)).value
    );
  });
});
