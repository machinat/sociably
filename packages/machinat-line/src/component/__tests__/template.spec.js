import Machinat from 'machinat';
import { map } from 'machinat-utility';

import {
  ButtonTemplate,
  ConfirmTemplate,
  CarouselItem,
  CarouselTemplate,
  ImageCarouselItem,
  ImageCarouselTemplate,
} from '../template';
import { URIAction } from '../action';
import { LINE_NATIVE_TYPE } from '../../constant';
import renderHelper from './renderHelper';

const renderInner = prop =>
  map(prop, (node, path) => node.type(node, renderInner, path)[0]) || null;
const render = renderHelper(renderInner);

test.each([CarouselItem, ImageCarouselItem].map(C => [C.name, C]))(
  '%s is valid native component',
  (_, Item) => {
    expect(typeof Item).toBe('function');

    expect(Item.$$native).toBe(LINE_NATIVE_TYPE);
    expect(Item.$$getEntry).toBe(undefined);
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

  expect(Template.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Template.$$getEntry).toBe(undefined);
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
  const segments = render(templateElement);
  expect(segments.length).toBe(1);

  const [segment] = segments;
  expect(segment.type).toBe('unit');
  expect(segment.node).toBe(templateElement);
  expect(segment.path).toBe('$');
  expect(segment.value).toMatchSnapshot();
});
