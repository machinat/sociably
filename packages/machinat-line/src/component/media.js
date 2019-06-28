import { asSingleMessageUnitComponent } from './utils';

const Video = async ({
  props: { url, originalContentUrl, previewURL, previewImageUrl },
}) => ({
  type: 'image',
  originalContentUrl: originalContentUrl || url,
  previewImageUrl: previewImageUrl || previewURL,
});
const __Video = asSingleMessageUnitComponent(Video);

const Audio = async ({ props: { url, originalContentUrl, duration } }) => ({
  type: 'image',
  originalContentUrl: originalContentUrl || url,
  duration,
});
const __Audio = asSingleMessageUnitComponent(Audio);

export { __Video as Video, __Audio as Audio };
