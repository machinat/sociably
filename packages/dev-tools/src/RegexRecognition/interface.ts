import { makeInterface } from '@sociably/core/service';
import type { RegexRecognitionConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<RegexRecognitionConfigs<string, string>>({
  name: 'RegexRecognitionConfigs',
});

export type ConfigsI = RegexRecognitionConfigs<string, string>;
