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

const renderer = new Renderer('line', () => null);

test.each([CarouselItem, ImageCarouselItem].map((C) => [C.name, C]))(
  '%s is valid native component',
  (_, Item) => {
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
)('%s is valid native unit component', (_, Template) => {
  expect(typeof Template).toBe('function');

  expect(isNativeType(<Template />)).toBe(true);
  expect(Template.$$platform).toBe('line');
});

test.each(
  [
    <ButtonTemplate
      altText="xxx"
      imageUrl="https://..."
      imageAspectRatio="square"
      imageSize="contain"
      imageBackgroundColor="#aaaaaa"
      title="HELLO"
      text="world"
      defaultAction={<UriAction uri="https://..." label="???" />}
      actions={[
        <UriAction uri="https://..." label="foo" />,
        <UriAction uri="https://..." label="bar" />,
      ]}
    />,

    <ConfirmTemplate
      altText="xxx"
      text="Take a pill"
      actions={[
        <UriAction uri="https://matrix.io/login" label="Blue pill" />,
        <UriAction uri="https://matrix.io/leave" label="Red pill" />,
      ]}
    />,

    <CarouselTemplate
      altText="xxx"
      imageAspectRatio="square"
      imageSize="contain"
    >
      <CarouselItem
        text="Burger"
        actions={[
          <UriAction uri="https://..." label="with fries" />,
          <UriAction uri="https://..." label="with salad" />,
        ]}
      />
      <CarouselItem
        imageUrl="https://..."
        imageBackgroundColor="#bbbbbb"
        title="Spaghetti"
        text="tamato sause"
        actions={[
          <UriAction uri="https://..." label="with soup" />,
          <UriAction uri="https://..." label="with salad" />,
        ]}
      />
    </CarouselTemplate>,

    <ImageCarouselTemplate altText="xxx">
      <ImageCarouselItem
        url="https://..."
        action={<UriAction uri="https://..." label="foo" />}
      />
      <ImageCarouselItem
        url="https://..."
        action={<UriAction uri="https://..." label="bar" />}
      />
    </ImageCarouselTemplate>,
  ].map((ele) => [ele.type.name, ele])
)('%s rendered match snapshot', async (_, templateElement) => {
  const promise = renderer.render(templateElement);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: templateElement,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});
