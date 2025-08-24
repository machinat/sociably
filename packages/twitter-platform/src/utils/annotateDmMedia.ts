import type { MediaSource, MediaType } from '../types.js';

const annotateDmMedia = (
  mediaType: MediaType,
  source: MediaSource,
): MediaSource =>
  source.type === 'id'
    ? source
    : {
        ...source,
        params: {
          ...source.params,
          media_category:
            source.params.media_category ||
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
