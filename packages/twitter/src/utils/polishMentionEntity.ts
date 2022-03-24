import TwitterUser from '../User';
import type { RawEntities, MentionEntity } from '../types';

const polishMentionEntity = (
  raw: RawEntities['user_mentions'][number]
): MentionEntity => ({
  user: new TwitterUser(raw.id_str),
  id: raw.id_str,
  name: raw.name,
  screenName: raw.screen_name,
  indices: raw.indices,
});

export default polishMentionEntity;
