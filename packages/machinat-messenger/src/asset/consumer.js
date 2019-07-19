// @flow
import type { ResourceConsumption } from 'machinat-asset-store/types';
import {
  ATTACHMENT,
  CUSTOM_LABEL,
  MESSAGE_CREATIVE,
  PERSONA,
} from './resourceType';

const consumerFactory = (fnName: string, resource: string) => {
  const box = {
    [fnName]: (
      label: string,
      options?: { invariant?: boolean }
    ): ResourceConsumption => ({
      label,
      resource,
      invariant: !!(options && options.invariant),
    }),
  };

  return box[fnName];
};

export const getAttachment = consumerFactory('getAttachment', ATTACHMENT);
export const getPersona = consumerFactory('getPersona', PERSONA);
export const getCustomLabel = consumerFactory('getCustomLabel', CUSTOM_LABEL);
export const getMessageCreative = consumerFactory(
  'getMessageCreative',
  MESSAGE_CREATIVE
);
