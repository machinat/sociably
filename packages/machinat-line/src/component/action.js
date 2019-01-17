import { annotate, asNative, asUnit } from 'machinat-utility';
import { LINE_NAITVE_TYPE } from '../symbol';

export const PostbackAction = ({ label, data, text, displayText }) => [
  {
    type: 'postback',
    data,
    label,
    displayText: displayText || text,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(PostbackAction);

export const MessageAction = ({ label, text }) => [
  {
    type: 'message',
    label,
    text,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(MessageAction);

export const URIAction = ({ label, uri }) => [
  {
    type: 'uri',
    label,
    uri,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(URIAction);

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

export const DateTimePickerAction = ({
  label,
  data,
  mode,
  date,
  time,
  initial,
  min,
  max,
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
annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(DateTimePickerAction);

export const CameraAction = ({ label }) => [
  {
    type: 'camera',
    label,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(CameraAction);

export const CameraRollAction = ({ label }) => [
  {
    type: 'cameraRoll',
    label,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(CameraRollAction);

export const LocationAction = ({ label }) => [
  {
    type: 'location',
    label,
  },
];

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(LocationAction);
