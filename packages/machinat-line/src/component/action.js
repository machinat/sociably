import { partSegment } from '@machinat/core/renderer';
import { annotateLineComponent } from '../utils';

export const PostbackAction = (node, path) => {
  const { label, data, text, displayText } = node.props;
  return [
    partSegment(node, path, {
      type: 'postback',
      data,
      label,
      displayText: displayText || text,
    }),
  ];
};
annotateLineComponent(PostbackAction);

export const MessageAction = (node, path) => {
  const { label, text } = node.props;
  return [
    partSegment(node, path, {
      type: 'message',
      label,
      text,
    }),
  ];
};
annotateLineComponent(MessageAction);

export const URIAction = (node, path) => {
  const { label, uri } = node.props;
  return [
    partSegment(node, path, {
      type: 'uri',
      label,
      uri,
    }),
  ];
};
annotateLineComponent(URIAction);

const pad2 = n => (n < 10 ? `0${n}` : n);
const fullDate = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fullHourMinute = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const dateToStringByMode = (mode, d) =>
  !(d instanceof Date)
    ? d
    : mode === 'datetime'
    ? `${fullDate(d)}T${fullHourMinute(d)}`
    : mode === 'date'
    ? fullDate(d)
    : fullHourMinute(d);

export const DateTimePickerAction = (node, path) => {
  const { label, data, mode = 'datetime', initial, min, max } = node.props;

  return [
    partSegment(node, path, {
      type: 'datetimepicker',
      label,
      data,
      mode,
      initial: dateToStringByMode(mode, initial),
      max: dateToStringByMode(mode, max),
      min: dateToStringByMode(mode, min),
    }),
  ];
};
annotateLineComponent(DateTimePickerAction);

export const CameraAction = (node, path) => [
  partSegment(node, path, {
    type: 'camera',
    label: node.props.label,
  }),
];
annotateLineComponent(CameraAction);

export const CameraRollAction = (node, path) => [
  partSegment(node, path, {
    type: 'cameraRoll',
    label: node.props.label,
  }),
];
annotateLineComponent(CameraRollAction);

export const LocationAction = (node, path) => [
  partSegment(node, path, {
    type: 'location',
    label: node.props.label,
  }),
];
annotateLineComponent(LocationAction);
