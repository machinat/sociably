import type { MediaSource, MediaType } from '../types';

const annotateDmMedia = (
  mediaType: MediaType,
  source: MediaSource
): MediaSource =>
  source.type === 'id'
    ? source
    : {
        ...source,
        parameters: {
          ...source.parameters,
          media_category:
            source.parameters.media_category ||
            (mediaType === 'photo'
              ? 'dm_image'
              : mediaType === 'video'
              ? 'dm_video'
              : mediaType === 'animated_gif'
              ? 'dm_gif'
              : undefined),
        },
      };

export default annotateDmMedia;
