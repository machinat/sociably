import { makeInterface } from '@machinat/core/service';
import type { RegexIntentRecognitionConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<RegexIntentRecognitionConfigs<string>>({
  name: 'RegexIntentRecognitionConfigs',
});

export type ConfigsI = RegexIntentRecognitionConfigs<string>;
