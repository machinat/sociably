/* eslint-disable import/prefer-default-export */
import { annotateNativeRoot } from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const Location = (
  { title, address, lat, long, quickReplies },
  render
) => ({
  type: 'location',
  title,
  address,
  latitude: lat,
  longitude: long,
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Location, LINE_NAITVE_TYPE);
