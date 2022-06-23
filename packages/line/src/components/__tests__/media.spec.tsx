import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';

import { Audio, Video } from '../media';

const renderer = new Renderer('line', async () => null);

it.each([Audio, Video].map((C) => [C.name, C]))(
  '%s is valid native unit component',
  (_, Media: any) => {
    expect(typeof Media).toBe('function');

    expect(isNativeType(<Media />)).toBe(true);
    expect(Media.$$platform).toBe('line');
  }
);

it.each(
  [
    <Audio originalContentUrl="https://..." duration={6666} />,
    <Video originalContentUrl="https://..." previewImageUrl="https://..." />,
  ].map((e) => [e.type.name, e])
)('%s render match snapshot', async (_, mediaElement) => {
  const promise = renderer.render(mediaElement, null as never);
  await expect(promise).resolves.toEqual([
    {
      type: 'unit',
      node: mediaElement,
      value: expect.any(Object),
      path: '$',
    },
  ]);

  const [{ value }] = (await promise)!;
  expect(value).toMatchSnapshot();
});
