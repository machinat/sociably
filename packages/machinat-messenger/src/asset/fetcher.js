// @flow
import type { AssetConsumerTarget } from 'machinat-asset-store/types';
import {
  ATTACHMENT,
  CUSTOM_LABEL,
  MESSAGE_CREATIVE,
  PERSONA,
} from './resourceType';

const consumerFactory = (fnName: string, resource: string) => {
  const box = {
    [fnName]: (
      name: string,
      options?: { invariant?: boolean }
    ): AssetConsumerTarget => ({
      name,
      resource,
      invariant: !!(options && options.invariant),
    }),
  };

  return box[fnName];
};

export const attachmentId = consumerFactory('attachmentId', ATTACHMENT);
export const personaId = consumerFactory('personaId', PERSONA);
export const customLabelId = consumerFactory('customLabelId', CUSTOM_LABEL);
export const messageCreativeId = consumerFactory(
  'messageCreativeId',
  MESSAGE_CREATIVE
);
