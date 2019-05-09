import { asSingleUnitComponentWithEntry } from './utils';

import {
  ENTRY_PASS_THREAD_CONTROL,
  ENTRY_REQUEST_THREAD_CONTROL,
  ENTRY_TAKE_THREAD_CONTROL,
} from '../constant';

const PassThreadControl = ({ props: { appId, metadata } }) => ({
  target_app_id: appId,
  metadata,
});

const __PassThreadControl = asSingleUnitComponentWithEntry(
  ENTRY_PASS_THREAD_CONTROL
)(PassThreadControl);

const RequestThreadControl = ({ props: { metadata } }) => ({ metadata });

const __RequestThreadControl = asSingleUnitComponentWithEntry(
  ENTRY_REQUEST_THREAD_CONTROL
)(RequestThreadControl);

const TakeThreadContorl = ({ props: { metadata } }) => ({ metadata });

const __TakeThreadContorl = asSingleUnitComponentWithEntry(
  ENTRY_TAKE_THREAD_CONTROL
)(TakeThreadContorl);

export {
  __PassThreadControl as PassThreadControl,
  __RequestThreadControl as RequestThreadControl,
  __TakeThreadContorl as TakeThreadContorl,
};
