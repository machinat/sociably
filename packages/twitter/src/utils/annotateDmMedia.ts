import type { MediaSource } from '../types';

const annotateDmMedia = (media: MediaSource): MediaSource =>
  media.sourceType === 'id'
    ? media
    : {
        ...media,
        parameters: {
          ...media.parameters,
          media_category:
            media.parameters.media_category ||
            (media.type === 'photo'
              ? 'dm_image'
              : media.type === 'video'
              ? 'dm_video'
              : media.type === 'animated_gif'
              ? 'dm_gif'
              : undefined),
        },
      };

export default annotateDmMedia;
