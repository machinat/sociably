import { serviceContainer } from '@sociably/core';
import { saveReusableAttachments } from '@sociably/meta-messenger-platform-base';
import { FacebookDispatchMiddleware } from '../types.js';
import AssetsManagerP from './AssetsManager.js';

export default serviceContainer({
  deps: [AssetsManagerP],
})<FacebookDispatchMiddleware>(
  saveReusableAttachments as (
    manager: AssetsManagerP,
  ) => FacebookDispatchMiddleware,
);
