import { FIELD_STATE_ID, FIELD_STATE_KEY } from '../constants';

const getGlobalStateIdentifierFields =
  (stateId: string) =>
  (key: null | string): [string, string][] => {
    const pairs: [string, string][] = [[FIELD_STATE_ID, stateId]];

    if (key) {
      pairs.push([FIELD_STATE_KEY, key]);
    }
    return pairs;
  };

export default getGlobalStateIdentifierFields;
