import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';
import Renderer from '@machinat/core/renderer';
import {
  ButtonTemplate,
  ConfirmTemplate,
  CarouselItem,
  CarouselTemplate,
  ImageCarouselItem,
  ImageCarouselTemplate,
} from '../template';
import { URIAction } from '../action';

const renderer = new Renderer('line', () => null);

test.each([CarouselItem, ImageCarouselItem].map(C => [C.name, C]))(
  '%s is valid native component',
  (_, Item) => {
    expect(typeof Item).toBe('function');

    expect(isNativeElement(<Item />)).toBe(true);
    expect(Item.$$platform).toBe('line');
  }
);

test.each(
  [
    ButtonTemplate,
    ConfirmTemplate,
    CarouselTemplate,
    ImageCarouselTemplate,
  ].map(C => [C.name, C])
)('%s is valid native unit component', (_, Template) => {
  expect(typeof Template).toBe('function');

  expect(isNativeElement(<Template />)).toBe(true);
  expect(Template.$$platform).toBe('line');
});

test.each(
  [
    <ButtonTemplate
      altText="xxx"
      imageURL="https://..."
      imageAspectRatio="square"
      imageSize="contain"
      imageBackgroundColor="#aaaaaa"
      title="HELLO"
      text="world"
      defaultAction={<URIAction uri="https://..." label="???" />}
      actions={[
        <URIAction uri="https://..." label="foo" />,
        <URIAction uri="https://..." label="bar" />,
      ]}
    />,

    <ConfirmTemplate
      altText="xxx"
      text="Take a pill"
      actions={[
        <URIAction uri="https://matrix.io/login" label="Blue pill" />,
        <URIAction uri="https://matrix.io/leave" label="Red pill" />,
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
          <URIAction uri="https://..." label="with fries" />,
          <URIAction uri="https://..." label="with salad" />,
        ]}
      />
      <CarouselItem
        imageURL="https://..."
        imageBackgroundColor="#bbbbbb"
        title="Spaghetti"
        text="tamato sause"
        actions={[
          <URIAction uri="https://..." label="with soup" />,
          <URIAction uri="https://..." label="with salad" />,
        ]}
      />
    </CarouselTemplate>,

    <ImageCarouselTemplate altText="xxx">
      <ImageCarouselItem
        url="https://..."
        action={<URIAction uri="https://..." label="foo" />}
      />
      <ImageCarouselItem
        url="https://..."
        action={<URIAction uri="https://..." label="bar" />}
      />
    </ImageCarouselTemplate>,
  ].map(ele => [ele.type.name, ele])
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
