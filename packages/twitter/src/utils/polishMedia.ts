import type { RawMedia, Media } from '../types.js';

const polishMedia = (raw: RawMedia): Media => {
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

export default polishMedia;
