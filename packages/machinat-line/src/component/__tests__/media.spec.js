import Machinat from 'machinat';

import { Audio, Video } from '../media';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

it.each([Audio, Video].map(C => [C.name, C]))(
  '%s is valid native unit component',
  (_, Media) => {
    expect(typeof Media).toBe('function');

    expect(Media.$$native).toBe(LINE_NAITVE_TYPE);
    expect(Media.$$entry).toBe(undefined);
    expect(Media.$$unit).toBe(true);
  }
);

it.each(
  [
    <Audio url="https://..." duration={6666} />,
    <Video url="https://..." previewURL="https://..." />,
  ].map(e => [e.type.name, e])
)('%s render match snapshot', (_, mediaElement) => {
  expect(render(mediaElement).map(act => act.value)).toMatchSnapshot();
});
