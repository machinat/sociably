// @flow
/* eslint-disable import/prefer-default-export  */
import type { AuthRefineResult } from 'machinat-auth/types';
import { LineUser } from '../user';
import type { LIFFAuthData } from '../types';

export const refineLIFFContextData = (
  data: LIFFAuthData
): null | AuthRefineResult => {
  const { profile } = data;
  if (!profile) {
    return null;
  }

  return {
    channel: null,
    user: new LineUser(profile.userId),
  };
};
