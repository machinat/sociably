import type { MediaSource, MediaType } from '../types';

const annotateTweetMedia = (
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
              ? 'tweet_image'
              : mediaType === 'video'
              ? 'tweet_video'
              : mediaType === 'animated_gif'
              ? 'tweet_gif'
              : undefined),
        },
      };

export default annotateTweetMedia;
