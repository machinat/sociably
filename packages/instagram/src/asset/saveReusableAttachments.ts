import { serviceContainer } from '@sociably/core';
import { saveReusableAttachments } from '@sociably/messenger';
import { InstagramDispatchMiddleware } from '../types.js';
import AssetsManagerP from './AssetsManager.js';

export default serviceContainer({
  deps: [AssetsManagerP],
})<InstagramDispatchMiddleware>(
  saveReusableAttachments as (
    manager: AssetsManagerP
  ) => InstagramDispatchMiddleware
);
