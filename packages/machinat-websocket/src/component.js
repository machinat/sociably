// @flow
import { annotateNativeComponent, unitSegment } from '@machinat/core/renderer';
import { WEBSOCKET } from './constant';

const Event = (node, path) => {
  const { type, subtype, payload } = node.props;
  return [
    unitSegment(node, path, {
      type: type || 'default',
      subtype,
      payload,
    }),
  ];
};
const __Event = annotateNativeComponent(WEBSOCKET)(Event);

export { __Event as Event }; // eslint-disable-line import/prefer-default-export
