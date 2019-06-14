import { compose } from 'machinat-utility';
import {
  asNative,
  asNamespace,
  wrapSingleUnitSegment,
} from 'machinat-renderer';

import { WEBSOCKET_NAMESPACE, WEBSOCKET_NATIVE_TYPE } from './constant';

const asWebSocketComponent = compose(
  asNative(WEBSOCKET_NATIVE_TYPE),
  asNamespace(WEBSOCKET_NAMESPACE),
  wrapSingleUnitSegment
);

const Event = ({
  props: { type, subtype, payload, whitelist, blacklist },
}) => ({
  type: type || 'default',
  subtype,
  payload,
  whitelist,
  blacklist,
});
const __Event = asWebSocketComponent(Event);

export { __Event as Event }; // eslint-disable-line import/prefer-default-export
