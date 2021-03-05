import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';
import {
  ButtonTemplate,
  ConfirmTemplate,
  CarouselItem,
  CarouselTemplate,
  ImageCarouselItem,
  ImageCarouselTemplate,
} from '../template';
import { UriAction } from '../action';

const renderer = new Renderer('line', async () => null);

test.each([CarouselItem, ImageCarouselItem].map((C) => [C.name, C]))(
  '%s is valid native component',
  (_, Item: any) => {
    expect(typeof Item).toBe('function');

    expect(isNativeType(<Item />)).toBe(true);
    expect(Item.$$platform).toBe('line');
  }
);

test.each(
  [
    ButtonTemplate,
    ConfirmTemplate,
    CarouselTemplate,
    ImageCarouselTemplate,
  ].map((C) => [C.name, C])
)('%s is valid native unit component', (_, Template: any) => {
  expect(typeof Template).toBe('function');

  expect(isNativeType(<Template />)).toBe(true);
  expect(Template.$$platform).toBe('line');
});

describe.each(
  [
    <ButtonTemplate
      altText="xxx"
      thumbnailImageUrl="https://..."
      imageAspectRatio="square"
      imageSize="contain"
      imageBackgroundColor="#aaaaaa"
      title="HELLO"
      defaultAction={<UriAction uri="https://..." label="???" />}
      actions={[
        <UriAction uri="https://..." label="foo" />,
        <UriAction uri="https://..." label="bar" />,
      ]}
    >
      world
    </ButtonTemplate>,

    <ConfirmTemplate
      altText="xxx"
      actions={[
        <UriAction uri="https://matrix.io/login" label="Blue pill" />,
        <UriAction uri="https://matrix.io/leave" label="Red pill" />,
      ]}
    >
      Take a pill
    </ConfirmTemplate>,

    <CarouselTemplate
      altText="xxx"
      imageAspectRatio="square"
      imageSize="contain"
    >
      <CarouselItem
        actions={[
          <UriAction uri="https://..." label="with fries" />,
          <UriAction uri="https://..." label="with salad" />,
        ]}
      >
        Burger
      </CarouselItem>
      <CarouselItem
        thumbnailImageUrl="https://..."
        imageBackgroundColor="#bbbbbb"
        title="Pasta"
        actions={[
          <UriAction uri="https://..." label="with soup" />,
          <UriAction uri="https://..." label="with salad" />,
        ]}
      >
        Naporitan
      </CarouselItem>
    </CarouselTemplate>,

    <ImageCarouselTemplate altText="xxx">
      <ImageCarouselItem
        imageUrl="https://..."
        action={<UriAction uri="https://..." label="foo" />}
      />
      <ImageCarouselItem
        imageUrl="https://..."
        action={<UriAction uri="https://..." label="bar" />}
      />
    </ImageCarouselTemplate>,
  ].map((ele) => [ele.type.name, ele])
)('%s', (_, templateElement) => {
  it('render match snapshot', async () => {
    const promise = renderer.render(templateElement, null as never);
    await expect(promise).resolves.toEqual([
      {
        type: 'unit',
        node: templateElement,
        value: expect.any(Object),
        path: '$',
      },
    ]);

    const [{ value }] = (await promise)!;
    expect(value).toMatchSnapshot();
  });

  test('altText as function', async () => {
    const altTextGetter = moxy(() => 'ALT_TEXT_FOO');
    const element = Machinat.createElement(templateElement.type, {
      ...templateElement.props,
      altText: altTextGetter,
    });

    const [{ value }] = (await renderer.render(element, null as never)) as any;

    expect(value.altText).toBe('ALT_TEXT_FOO');
    expect(altTextGetter.mock).toHaveBeenCalledTimes(1);
    expect(altTextGetter.mock).toHaveBeenCalledWith(value.template);
  });
});
