import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';
import map from '@machinat/core/iterator/map';

import {
  ButtonTemplate,
  ConfirmTemplate,
  CarouselItem,
  CarouselTemplate,
  ImageCarouselItem,
  ImageCarouselTemplate,
} from '../template';
import { URIAction } from '../action';

const renderInner = async prop => {
  const renderings = map(prop, (node, path) =>
    node.type(node, renderInner, path)
  );

  return renderings ? [].concat(...(await Promise.all(renderings))) : null;
};
const render = element => element.type(element, renderInner, '$');

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
      alt="xxx"
      imageURL="https://..."
      imageAspectRatio="square"
      imageSize="contain"
      imageBackgroundColor="#aaaaaa"
      title="HELLO"
      text="world"
      defaultAction={<URIAction uri="https://..." label="???" />}
    >
      <URIAction uri="https://..." label="foo" />
      <URIAction uri="https://..." label="bar" />
    </ButtonTemplate>,
    <ConfirmTemplate alt="xxx" text="Take a pill">
      <URIAction uri="https://matrix.io/login" label="Blue pill" />
      <URIAction uri="https://matrix.io/leave" label="Red pill" />
    </ConfirmTemplate>,
    <CarouselTemplate alt="xxx" imageAspectRatio="square" imageSize="contain">
      <CarouselItem text="Burger">
        <URIAction uri="https://..." label="with fries" />
        <URIAction uri="https://..." label="with salad" />
      </CarouselItem>
      <CarouselItem
        imageURL="https://..."
        imageBackgroundColor="#bbbbbb"
        title="Spaghetti"
        text="tamato sause"
      >
        <URIAction uri="https://..." label="with soup" />
        <URIAction uri="https://..." label="with salad" />
      </CarouselItem>
    </CarouselTemplate>,
    <ImageCarouselTemplate alt="xxx">
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
  const promise = render(templateElement);
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
