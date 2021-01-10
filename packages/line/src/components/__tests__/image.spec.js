import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils/isX';
import Renderer from '@machinat/core/renderer';

import {
  Image,
  Sticker,
  ImageMap,
  ImageMapVideoArea,
  ImageMapArea,
} from '../image';
import { UriAction, MessageAction } from '../action';

const renderer = new Renderer('line', () => null);

it.each(
  [Image, Sticker, ImageMap, ImageMapVideoArea, ImageMapArea].map((C) => [
    C.name,
    C,
  ])
)('%s is a valid component', (_, Img) => {
  expect(isNativeType(<Img />)).toBe(true);
  expect(Img.$$platform).toBe('line');
});

it.each(
  [
    <Image url="https://..." previewUrl="https://..." />,
    <Sticker packageId={1} stickerId={2} />,
    <ImageMap baseUrl="https://..." altText="..." height={999}>
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
        action={<UriAction label="foo" uri="https://..." />}
      />
    </ImageMap>,
    <ImageMap
      baseUrl="https://..."
      altText="..."
      height={999}
      video={
        <ImageMapVideoArea
          url="https://..."
          previewUrl="https://..."
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
      baseUrl="https://..."
      altText="..."
      height={999}
      video={
        <ImageMapVideoArea
          url="https://..."
          previewUrl="https://..."
          x={123}
          y={456}
          width={654}
          height={321}
          action={<UriAction label="foo" uri="https://..." />}
        />
      }
    >
      <ImageMapArea
        x={978}
        y={654}
        width={456}
        height={789}
        action={<UriAction label="foo" uri="https://..." />}
      />
    </ImageMap>,
  ].map((e) => [e.type.name, e])
)('%s match snapshot', async (_, element) => {
  const promise = renderer.render(element);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: element,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});
