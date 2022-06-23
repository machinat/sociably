import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';

import {
  Image,
  Sticker,
  ImageMap,
  ImageMapVideoArea,
  ImageMapArea,
} from '../image';
import { UriAction, MessageAction } from '../action';

const renderer = new Renderer('line', async () => null);

it.each(
  [Image, Sticker, ImageMap, ImageMapVideoArea, ImageMapArea].map((C) => [
    C.name,
    C,
  ])
)('%s is a valid component', (_, Img: any) => {
  expect(isNativeType(<Img />)).toBe(true);
  expect(Img.$$platform).toBe('line');
});

it.each(
  [
    <Image originalContentUrl="https://..." previewImageUrl="https://..." />,
    <Sticker packageId="1" stickerId="2" />,
    <ImageMap baseUrl="https://..." altText="..." height={999}>
      <ImageMapArea
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
          originalContentUrl="https://..."
          previewImageUrl="https://..."
          x={123}
          y={456}
          width={654}
          height={321}
        />
      }
    >
      <ImageMapArea
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
          originalContentUrl="https://..."
          previewImageUrl="https://..."
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
  const promise = renderer.render(element, null as never);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: element,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = (await promise)!;
  expect(value).toMatchSnapshot();
});
