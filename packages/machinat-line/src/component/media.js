import { asUnitComponent } from '../utils';

const Video = async ({
  url,
  originalContentUrl,
  previewURL,
  previewImageUrl,
}) => ({
  type: 'image',
  originalContentUrl: originalContentUrl || url,
  previewImageUrl: previewImageUrl || previewURL,
});
const __Video = asUnitComponent(Video);

const Audio = async ({ url, originalContentUrl, duration }) => ({
  type: 'image',
  originalContentUrl: originalContentUrl || url,
  duration,
});
const __Audio = asUnitComponent(Audio);

export { __Video as Video, __Audio as Audio };
