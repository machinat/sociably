import type { RawEntities, UrlEntity } from '../types.js';

const polishUrlEntity = (raw: RawEntities['urls'][number]): UrlEntity => ({
  url: raw.url,
  displayUrl: raw.display_url,
  expandedUrl: raw.expanded_url,
  indices: raw.indices,
});

export default polishUrlEntity;
