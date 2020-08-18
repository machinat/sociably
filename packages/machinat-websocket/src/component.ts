/* eslint-disable import/prefer-default-export */
import { annotateNativeComponent, unitSegment } from '@machinat/core/renderer';
import { WEBSOCKET } from './constant';

export const Event = (node, path) => {
  const { type, subtype, payload } = node.props;
  return [
    unitSegment(node, path, {
      type: type || 'default',
      subtype,
      payload,
    }),
  ];
};
annotateNativeComponent(WEBSOCKET)(Event);
