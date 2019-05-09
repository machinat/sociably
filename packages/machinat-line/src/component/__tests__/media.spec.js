import Machinat from 'machinat';

import { LINE_NATIVE_TYPE } from '../../constant';
import { Audio, Video } from '../media';
import renderHelper from './renderHelper';

const render = renderHelper(() => null);

it.each([Audio, Video].map(C => [C.name, C]))(
  '%s is valid native unit component',
  (_, Media) => {
    expect(typeof Media).toBe('function');

    expect(Media.$$native).toBe(LINE_NATIVE_TYPE);
    expect(Media.$$getEntry).toBe(undefined);
  }
);

it.each(
  [
    <Audio url="https://..." duration={6666} />,
    <Video url="https://..." previewURL="https://..." />,
  ].map(e => [e.type.name, e])
)('%s render match snapshot', (_, mediaElement) => {
  const segments = render(mediaElement);
  expect(segments.length).toBe(1);

  const [segment] = segments;
  expect(segment.type).toBe('unit');
  expect(segment.node).toBe(mediaElement);
  expect(segment.path).toBe('$');
  expect(segment.value).toMatchSnapshot();
});
