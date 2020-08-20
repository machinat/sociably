import AssetsManagerP, { MessengerAssetsManager } from './manager';

export { default } from './manager';
export { default as collectSharableAttachments } from './collectSharableAttachments';

export const AssetsManager = AssetsManagerP;
export type AssetsManager = MessengerAssetsManager;
