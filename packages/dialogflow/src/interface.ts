import { makeInterface } from '@machinat/core/service';
import type { DialogflowConfigs, SessionClient } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<DialogflowConfigs>({
  name: 'DialogflowConfigsI',
});

export type ConfigsI = DialogflowConfigs;

/**
 * @category Interface
 */
export const SessionClientI = makeInterface<SessionClient>({
  name: 'DialogflowSessionClientI',
});

export type SessionClientI = SessionClient;
