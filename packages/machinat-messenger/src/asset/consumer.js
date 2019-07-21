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
      tag: string,
      options?: { invariant?: boolean }
    ): AssetConsumerTarget => ({
      tag,
      resource,
      invariant: !!(options && options.invariant),
    }),
  };

  return box[fnName];
};

export const getAttachmentId = consumerFactory('getAttachmentId', ATTACHMENT);
export const getPersonaId = consumerFactory('getPersonaId', PERSONA);
export const getCustomLabelId = consumerFactory(
  'getCustomLabelId',
  CUSTOM_LABEL
);
export const getMessageCreativeId = consumerFactory(
  'getMessageCreativeId',
  MESSAGE_CREATIVE
);
