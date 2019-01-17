import Machinat from 'machinat';

import {
  ButtonTemplate,
  ConfirmTemplate,
  CarouselItem,
  CarouselTemplate,
  ImageCarouselItem,
  ImageCarouselTemplate,
} from '../template';
import { URIAction } from '../action';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

test.each([CarouselItem, ImageCarouselItem].map(C => [C.name, C]))(
  '%s is valid native component',
  (_, Item) => {
    expect(typeof Item).toBe('function');

    expect(Item.$$native).toBe(LINE_NAITVE_TYPE);
    expect(Item.$$entry).toBe(undefined);
    expect(Item.$$unit).toBe(false);
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

  expect(Template.$$native).toBe(LINE_NAITVE_TYPE);
  expect(Template.$$entry).toBe(undefined);
  expect(Template.$$unit).toBe(true);
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
)('%s rendered match snapshot', (_, templateElement) => {
  expect(render(templateElement).map(act => act.value)).toMatchSnapshot();
});
