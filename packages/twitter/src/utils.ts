import { annotateNativeComponent } from '@machinat/core/renderer';
import TwitterUser from './User';
import { TWITTER } from './constant';
import type {
  RawEntities,
  UrlEntity,
  MentionEntity,
  RawMedia,
  Media,
} from './types';

export const annotateTwitterComponent = annotateNativeComponent(TWITTER);

export const polishMentionEntity = (
  raw: RawEntities['user_mentions'][number]
): MentionEntity => ({
  user: new TwitterUser(raw.id_str),
  id: raw.id_str,
  name: raw.name,
  screenName: raw.screen_name,
  indices: raw.indices,
});

export const polishUrlEntity = (
  raw: RawEntities['urls'][number]
): UrlEntity => ({
  url: raw.url,
  displayUrl: raw.display_url,
  expandedUrl: raw.expanded_url,
  indices: raw.indices,
});

export const polishMedia = (raw: RawMedia): Media => {
  const videoInfo = raw.video_info;
  return {
    id: raw.id_str,
    type: raw.type,
    inlineUrl: raw.url,
    displayUrl: raw.display_url,
    expandedUrl: raw.expanded_url,
    indices: raw.indices,
    downloadUrl: raw.media_url_https,
    sizes: raw.sizes,
    sourceStatusId: raw.source_status_id_str,
    videoInfo: videoInfo
      ? {
          aspectRatio: videoInfo.aspect_ratio,
          durationMs: videoInfo.duration_millis,
          variants: videoInfo.variants.map((rawVariant) => ({
            url: rawVariant.url,
            bitrate: rawVariant.bitrate,
            contentType: rawVariant.content_type,
          })),
        }
      : null,
    additionalMediaInfo: raw.additional_media_info || null,
  } as Media;
};

let lastTime = 0;
let count = 0;
export const getTimeId = (): string => {
  const now = Date.now();
  if (lastTime === now) {
    count += 1;
  } else {
    lastTime = now;
    count = 0;
  }
  return `${now}-${count}`;
};
