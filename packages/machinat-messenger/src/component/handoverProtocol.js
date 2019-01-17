import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';
import { MESSENGER_NAITVE_TYPE } from '../symbol';
import {
  ENTRY_PASS_THREAD_CONTROL,
  ENTRY_REQUEST_THREAD_CONTROL,
  ENTRY_TAKE_THREAD_CONTROL,
} from '../apiEntry';

export const PassThreadControl = ({ appId, metadata }) => [
  { target_app_id: appId, metadata },
];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_PASS_THREAD_CONTROL),
  asUnit(true)
)(PassThreadControl);

export const RequestThreadControl = ({ metadata }) => [{ metadata }];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_REQUEST_THREAD_CONTROL),
  asUnit(true)
)(RequestThreadControl);

export const TakeThreadContorl = ({ metadata }) => [{ metadata }];

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_TAKE_THREAD_CONTROL),
  asUnit(true)
)(TakeThreadContorl);
