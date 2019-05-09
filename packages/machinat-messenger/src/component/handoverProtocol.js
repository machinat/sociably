import { asUnitComponentWithEntry } from './utils';

import {
  ENTRY_PASS_THREAD_CONTROL,
  ENTRY_REQUEST_THREAD_CONTROL,
  ENTRY_TAKE_THREAD_CONTROL,
} from '../constant';

const PassThreadControl = ({ props: { appId, metadata } }) => [
  { target_app_id: appId, metadata },
];

const __PassThreadControl = asUnitComponentWithEntry(ENTRY_PASS_THREAD_CONTROL)(
  PassThreadControl
);

const RequestThreadControl = ({ props: { metadata } }) => [{ metadata }];

const __RequestThreadControl = asUnitComponentWithEntry(
  ENTRY_REQUEST_THREAD_CONTROL
)(RequestThreadControl);

const TakeThreadContorl = ({ props: { metadata } }) => [{ metadata }];

const __TakeThreadContorl = asUnitComponentWithEntry(ENTRY_TAKE_THREAD_CONTROL)(
  TakeThreadContorl
);

export {
  __PassThreadControl as PassThreadControl,
  __RequestThreadControl as RequestThreadControl,
  __TakeThreadContorl as TakeThreadContorl,
};
