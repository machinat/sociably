import Machinat from 'machinat';
import { map } from 'machinat-utility';

import { LINE_NATIVE_TYPE } from '../../constant';
import {
  Image,
  Sticker,
  ImageMap,
  ImageMapVideoArea,
  ImageMapArea,
} from '../image';
import { URIAction, MessageAction } from '../action';
import renderHelper from './renderHelper';

const renderInner = (prop, route) =>
  map(prop, (node, path) => node.type(node, renderInner, path)[0], route) ||
  null;
const render = renderHelper(renderInner);

it.each(
  [Image, Sticker, ImageMap, ImageMapVideoArea, ImageMapArea].map(C => [
    C.name,
    C,
  ])
)('%s is a valid component', (_, Img) => {
  expect(Img.$$native).toBe(LINE_NATIVE_TYPE);
  expect(Img.$$getEntry).toBe(undefined);
});

it.each(
  [
    <Image url="https://..." previewURL="https://..." />,
    <Sticker packageId={1} stickerId={2} />,
    <ImageMap baseURL="https://..." alt="..." height={999}>
      <ImageMapArea
        label="foo"
        text="bar"
        x={123}
        y={456}
        width={654}
        height={321}
        action={<MessageAction label="foo" text="bar" />}
      />
      <ImageMapArea
        x={978}
        y={654}
        width={456}
        height={789}
        action={<URIAction label="foo" uri="https://..." />}
      />
    </ImageMap>,
    <ImageMap
      baseURL="https://..."
      alt="..."
      height={999}
      video={
        <ImageMapVideoArea
          url="https://..."
          previewURL="https://..."
          x={123}
          y={456}
          width={654}
          height={321}
        />
      }
    >
      <ImageMapArea
        label="foo"
        text="bar"
        x={123}
        y={456}
        width={654}
        height={321}
        action={<MessageAction label="foo" text="bar" />}
      />
    </ImageMap>,
    <ImageMap
      baseURL="https://..."
      alt="..."
      height={999}
      video={
        <ImageMapVideoArea
          url="https://..."
          previewURL="https://..."
          x={123}
          y={456}
          width={654}
          height={321}
          action={<URIAction label="foo" uri="https://..." />}
        />
      }
    >
      <ImageMapArea
        x={978}
        y={654}
        width={456}
        height={789}
        action={<URIAction label="foo" uri="https://..." />}
      />
    </ImageMap>,
  ].map(e => [e.type.name, e])
)('%s match snapshot', (_, element) => {
  const segments = render(element);
  expect(segments.length).toBe(1);

  const segment = segments[0];
  expect(segment.type).toBe('unit');
  expect(segment.node).toBe(element);
  expect(segment.path).toBe('$');
  expect(segment.value).toMatchSnapshot();
});
