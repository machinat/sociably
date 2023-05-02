import { UniqueOmniIdentifier } from '@sociably/core';
import {
  FIELD_STATE_PLATFORM,
  FIELD_STATE_SCOPE_ID,
  FIELD_STATE_ID,
  FIELD_STATE_KEY,
} from '../constants';

const getInstanceStateIdentifierFields =
  ({ platform, scopeId, id }: UniqueOmniIdentifier) =>
  (key: null | string): [string, string][] => {
    const pairs: [string, string][] = [
      [FIELD_STATE_PLATFORM, platform],
      [FIELD_STATE_SCOPE_ID, scopeId?.toString() || ''],
      [FIELD_STATE_ID, id.toString()],
    ];

    if (key) {
      pairs.push([FIELD_STATE_KEY, key]);
    }
    return pairs;
  };

export default getInstanceStateIdentifierFields;
