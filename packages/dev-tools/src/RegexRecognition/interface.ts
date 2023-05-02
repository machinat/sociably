import { serviceInterface } from '@sociably/core/service';
import type { RegexRecognitionConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<
  RegexRecognitionConfigs<string, string>
>({
  name: 'RegexRecognitionConfigs',
});

export type ConfigsI = RegexRecognitionConfigs<string, string>;
