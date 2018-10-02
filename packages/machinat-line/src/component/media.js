import { annotateNativeRoot } from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';
import { renderQuickReplies } from './utils';

export const Video = ({ url, previewImage, quickReplies }, render) => ({
  type: 'image',
  originalContentUrl: url,
  previewImageUrl: previewImage,
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Video, LINE_NAITVE_TYPE);

export const Audio = ({ url, duration, quickReplies }, render) => ({
  type: 'image',
  originalContentUrl: url,
  duration,
  quickReplies: renderQuickReplies(quickReplies, render),
});

annotateNativeRoot(Audio, LINE_NAITVE_TYPE);
