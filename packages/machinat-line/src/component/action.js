import { annotateNative } from 'machinat-renderer';
import { LINE_NAITVE_TYPE } from '../symbol';

export const PostbackAction = ({ label, data, text }) => ({
  type: 'postback',
  data,
  label,
  displayText: text,
});
annotateNative(PostbackAction, LINE_NAITVE_TYPE);

export const MessageAction = ({ label, text }) => ({
  type: 'message',
  label,
  text,
});
annotateNative(MessageAction, LINE_NAITVE_TYPE);

export const URIAction = ({ label, uri }) => ({
  type: 'uri',
  label,
  uri,
});
annotateNative(URIAction, LINE_NAITVE_TYPE);

const pad2 = n => (n < 10 ? `0${n}` : n);
const fullDate = d =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fullHourMinute = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const dateToStringByMode = (isDate, isTime, d) =>
  !(d instanceof Date)
    ? d
    : isDate === isTime
    ? `${fullDate(d)}T${fullHourMinute(d)}`
    : isDate
    ? fullDate(d)
    : fullHourMinute(d);

export const DateTimePickerAction = ({
  label,
  data,
  date,
  time,
  initial,
  min,
  max,
}) => ({
  type: 'datetimepicker',
  label,
  data,
  mode: date === time ? 'datetime' : date ? 'date' : 'time',
  initial: dateToStringByMode(date, time, initial),
  max: dateToStringByMode(date, time, max),
  min: dateToStringByMode(date, time, min),
});
annotateNative(DateTimePickerAction, LINE_NAITVE_TYPE);

export const CameraAction = ({ label }) => ({
  type: 'camera',
  label,
});
annotateNative(CameraAction, LINE_NAITVE_TYPE);

export const CameraRollAction = ({ label }) => ({
  type: 'cameraRoll',
  label,
});
annotateNative(CameraRollAction, LINE_NAITVE_TYPE);

export const LocationAction = ({ label }) => ({
  type: 'location',
  label,
});
annotateNative(LocationAction, LINE_NAITVE_TYPE);
