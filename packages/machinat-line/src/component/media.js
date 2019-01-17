import { annotate, asNative, asUnit } from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

export const Video = ({
  url,
  originalContentUrl,
  previewURL,
  previewImageUrl,
}) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    previewImageUrl: previewImageUrl || previewURL,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Video);

export const Audio = ({ url, originalContentUrl, duration }) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    duration,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(true))(Audio);
