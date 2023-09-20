import type { MediaSource, MediaType } from '../types.js';

const annotateTweetMedia = (
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
              ? 'tweet_image'
              : mediaType === 'video'
              ? 'tweet_video'
              : mediaType === 'animated_gif'
              ? 'tweet_gif'
              : undefined),
        },
      };

export default annotateTweetMedia;
