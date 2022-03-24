import type { MediaSource } from '../types';

const annotateTweetMedia = (media: MediaSource): MediaSource =>
  media.sourceType === 'id'
    ? media
    : {
        ...media,
        parameters: {
          ...media.parameters,
          media_category:
            media.parameters.media_category ||
            (media.type === 'photo'
              ? 'tweet_image'
              : media.type === 'video'
              ? 'tweet_video'
              : media.type === 'animated_gif'
              ? 'tweet_gif'
              : undefined),
        },
      };

export default annotateTweetMedia;
