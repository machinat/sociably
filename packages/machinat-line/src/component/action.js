import { asPartComponent } from './utils';

const PostbackAction = ({ props: { label, data, text, displayText } }) => [
  {
    type: 'postback',
    data,
    label,
    displayText: displayText || text,
  },
];
const __PostbackAction = asPartComponent(PostbackAction);

const MessageAction = ({ props: { label, text } }) => [
  {
    type: 'message',
    label,
    text,
  },
];
const __MessageAction = asPartComponent(MessageAction);

const URIAction = ({ props: { label, uri } }) => [
  {
    type: 'uri',
    label,
    uri,
  },
];
const __URIAction = asPartComponent(URIAction);

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

const DateTimePickerAction = ({
  props: { label, data, mode, date, time, initial, min, max },
}) => {
  const modeRefined =
    mode || (!date === !time ? 'datetime' : date ? 'date' : 'time');

  return [
    {
      type: 'datetimepicker',
      label,
      data,
      mode: modeRefined,
      initial: dateToStringByMode(modeRefined, initial),
      max: dateToStringByMode(modeRefined, max),
      min: dateToStringByMode(modeRefined, min),
    },
  ];
};
const __DateTimePickerAction = asPartComponent(DateTimePickerAction);

const CameraAction = ({ props: { label } }) => [
  {
    type: 'camera',
    label,
  },
];
const __CameraAction = asPartComponent(CameraAction);

const CameraRollAction = ({ props: { label } }) => [
  {
    type: 'cameraRoll',
    label,
  },
];
const __CameraRollAction = asPartComponent(CameraRollAction);

const LocationAction = ({ props: { label } }) => [
  {
    type: 'location',
    label,
  },
];
const __LocationAction = asPartComponent(LocationAction);

export {
  __PostbackAction as PostbackAction,
  __MessageAction as MessageAction,
  __URIAction as URIAction,
  __DateTimePickerAction as DateTimePickerAction,
  __CameraAction as CameraAction,
  __CameraRollAction as CameraRollAction,
  __LocationAction as LocationAction,
};
