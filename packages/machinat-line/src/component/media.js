import { asMessageUnitComponent } from './utils';

const Video = ({
  props: { url, originalContentUrl, previewURL, previewImageUrl },
}) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    previewImageUrl: previewImageUrl || previewURL,
  },
];
const __Video = asMessageUnitComponent(Video);

const Audio = ({ props: { url, originalContentUrl, duration } }) => [
  {
    type: 'image',
    originalContentUrl: originalContentUrl || url,
    duration,
  },
];
const __Audio = asMessageUnitComponent(Audio);

export { __Video as Video, __Audio as Audio };
