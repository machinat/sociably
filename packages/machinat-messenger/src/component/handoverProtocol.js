import { asUnitComponent } from '../utils';
import {
  ENTRY_PATH,
  PATH_PASS_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
} from '../constant';

const PassThreadControl = async ({ appId, metadata }) => ({
  target_app_id: appId,
  metadata,
  [ENTRY_PATH]: PATH_PASS_THREAD_CONTROL,
});
const __PassThreadControl = asUnitComponent(PassThreadControl);

const RequestThreadControl = async ({ metadata }) => ({
  metadata,
  [ENTRY_PATH]: PATH_REQUEST_THREAD_CONTROL,
});
const __RequestThreadControl = asUnitComponent(RequestThreadControl);

const TakeThreadContorl = async ({ metadata }) => ({
  metadata,
  [ENTRY_PATH]: PATH_TAKE_THREAD_CONTROL,
});
const __TakeThreadContorl = asUnitComponent(TakeThreadContorl);

export {
  __PassThreadControl as PassThreadControl,
  __RequestThreadControl as RequestThreadControl,
  __TakeThreadContorl as TakeThreadContorl,
};
