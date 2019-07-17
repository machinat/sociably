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
    expect(Media.$$namespace).toBe('Line');
  }
);

it.each(
  [
    <Audio url="https://..." duration={6666} />,
    <Video url="https://..." previewURL="https://..." />,
  ].map(e => [e.type.name, e])
)('%s render match snapshot', async (_, mediaElement) => {
  const promise = render(mediaElement);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = await promise;
  expect(value).toMatchSnapshot();
});
