import { annotateNativeRoot } from './utils';
import {
  ENTRY_PASS_THREAD_CONTROL,
  ENTRY_REQUEST_THREAD_CONTROL,
  ENTRY_TAKE_THREAD_CONTROL,
} from './constant';

export const PassThreadControl = ({ appId, metadata }) => ({
  target_app_id: appId,
  metadata,
});
annotateNativeRoot(PassThreadControl, ENTRY_PASS_THREAD_CONTROL);

export const RequestThreadControl = ({ metadata }) => ({
  metadata,
});
annotateNativeRoot(RequestThreadControl, ENTRY_REQUEST_THREAD_CONTROL);

export const TakeThreadContorl = ({ metadata }) => ({
  metadata,
});
annotateNativeRoot(TakeThreadContorl, ENTRY_TAKE_THREAD_CONTROL);
