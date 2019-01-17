import Machinat from 'machinat';
import render from './render';

import {
  Image,
  Sticker,
  ImageMap,
  ImageMapVideoArea,
  ImageMapArea,
} from '../image';

import { URIAction, MessageAction } from '../action';

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
  expect(render(element).map(action => action.value)).toMatchSnapshot();
});
