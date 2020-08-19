import { container } from '@machinat/core/service';
import type { MessengerDispatchMiddleware } from '../types';
import ManagerP, { MessengerAssetsManager } from './manager';

const collectSharableAttachments = (
  manager: MessengerAssetsManager
): MessengerDispatchMiddleware => async (frame, next) => {
  const response = await next(frame);
  const { jobs, results } = response;

  const updatingAssets: Promise<void>[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const { attachmentAssetTag } = jobs[i];
    const { body } = results[i];

    if (attachmentAssetTag && body.attachment_id) {
      updatingAssets.push(
        manager.setAttachmentId(attachmentAssetTag, body.attachment_id)
      );
    }
  }

  await Promise.all(updatingAssets);
  return response;
};

export default container<MessengerDispatchMiddleware>({
  deps: [ManagerP],
})(collectSharableAttachments);
