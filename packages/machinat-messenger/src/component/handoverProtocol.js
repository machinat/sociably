import { unitSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';
import {
  ENTRY_PATH,
  PATH_PASS_THREAD_CONTROL,
  PATH_REQUEST_THREAD_CONTROL,
  PATH_TAKE_THREAD_CONTROL,
} from '../constant';

export const PassThreadControl = (node, path) => {
  const { appId, metadata } = node.props;
  return [
    unitSegment(node, path, {
      target_app_id: appId,
      metadata,
      [ENTRY_PATH]: PATH_PASS_THREAD_CONTROL,
    }),
  ];
};
annotateMessengerComponent(PassThreadControl);

export const RequestThreadControl = (node, path) => [
  unitSegment(node, path, {
    metadata: node.props.metadata,
    [ENTRY_PATH]: PATH_REQUEST_THREAD_CONTROL,
  }),
];
annotateMessengerComponent(RequestThreadControl);

export const TakeThreadContorl = (node, path) => [
  unitSegment(node, path, {
    metadata: node.props.metadata,
    [ENTRY_PATH]: PATH_TAKE_THREAD_CONTROL,
  }),
];
annotateMessengerComponent(TakeThreadContorl);
