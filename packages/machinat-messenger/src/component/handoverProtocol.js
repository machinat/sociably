import { annotateNativeRoot } from 'machinat-renderer';
import { MESSENGER_NAITVE_TYPE } from '../symbol';
import {
  ENTRY_PASS_THREAD_CONTROL,
  ENTRY_REQUEST_THREAD_CONTROL,
  ENTRY_TAKE_THREAD_CONTROL,
} from '../apiEntry';

export const PassThreadControl = ({ appId, metadata }) => ({
  target_app_id: appId,
  metadata,
});
annotateNativeRoot(
  PassThreadControl,
  MESSENGER_NAITVE_TYPE,
  ENTRY_PASS_THREAD_CONTROL
);

export const RequestThreadControl = ({ metadata }) => ({
  metadata,
});
annotateNativeRoot(
  RequestThreadControl,
  MESSENGER_NAITVE_TYPE,
  ENTRY_REQUEST_THREAD_CONTROL
);

export const TakeThreadContorl = ({ metadata }) => ({
  metadata,
});
annotateNativeRoot(
  TakeThreadContorl,
  MESSENGER_NAITVE_TYPE,
  ENTRY_TAKE_THREAD_CONTROL
);
