import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ImagePost } from '../ImagePost.js';
import { VideoPost } from '../VideoPost.js';
import { Reel } from '../Reel.js';
import { CarouselPost } from '../CarouselPost.js';
import { TypingOn } from '../index.js';
import { renderUnitElement } from './utils.js';

it('is valid root Component', () => {
  expect(isNativeType(<CarouselPost> </CarouselPost>)).toBe(true);
  expect(CarouselPost.$$platform).toBe('instagram');
  expect(CarouselPost.$$name).toBe('CarouselPost');
});

it('match snapshot', async () => {
  await expect(
    renderUnitElement(
      <CarouselPost>
        <ImagePost url="http://abc.com/..." />
        <ImagePost url="http://xyz.com/..." />
      </CarouselPost>,
    ),
  ).resolves.toMatchSnapshot();

  await expect(
    renderUnitElement(
      <CarouselPost
        caption="This is a #carousel post with #videos"
        locationId="1234567890"
      >
        <VideoPost url="http://abc.com/..." />
        <VideoPost url="http://xyz.com/..." />
      </CarouselPost>,
    ),
  ).resolves.toMatchSnapshot();
});

it('throw if there is no items in children', async () => {
  await expect(
    renderUnitElement(<CarouselPost>{null}</CarouselPost>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<CarouselPost /> must contain at least one <ImagePost/> or <VideoPost/>"`,
  );
  await expect(
    renderUnitElement(<CarouselPost>{[]}</CarouselPost>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<CarouselPost /> must contain at least one <ImagePost/> or <VideoPost/>"`,
  );
});

it('throw if "children" prop contains invalid items', async () => {
  await expect(
    renderUnitElement(<CarouselPost>foo</CarouselPost>),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `""foo" is not a valid children of <CarouselPost />, must be <ImagePost/> or <VideoPost/>"`,
  );
  await expect(
    renderUnitElement(
      <CarouselPost>
        <Sociably.Pause />
      </CarouselPost>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Pause /> is not a valid children of <CarouselPost />, must be <ImagePost/> or <VideoPost/>"`,
  );
  await expect(
    renderUnitElement(
      <CarouselPost>
        <Reel url="http://..." />
      </CarouselPost>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<Reel /> is not a valid children of <CarouselPost />, must be <ImagePost/> or <VideoPost/>"`,
  );
  await expect(
    renderUnitElement(
      <CarouselPost>
        <TypingOn />
      </CarouselPost>,
    ),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"<TypingOn /> is not a valid children of <CarouselPost />, must be <ImagePost/> or <VideoPost/>"`,
  );
});
