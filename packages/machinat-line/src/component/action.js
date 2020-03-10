import { asPartComponent } from '../utils';

const PostbackAction = async ({ label, data, text, displayText }) => ({
  type: 'postback',
  data,
  label,
  displayText: displayText || text,
});
const __PostbackAction = asPartComponent(PostbackAction);

const MessageAction = async ({ label, text }) => ({
  type: 'message',
  label,
  text,
});
const __MessageAction = asPartComponent(MessageAction);

const URIAction = async ({ label, uri }) => ({
  type: 'uri',
  label,
  uri,
});
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

const DateTimePickerAction = async ({
  label,
  data,
  mode = 'datetime',
  initial,
  min,
  max,
}) => {
  return {
    type: 'datetimepicker',
    label,
    data,
    mode,
    initial: dateToStringByMode(mode, initial),
    max: dateToStringByMode(mode, max),
    min: dateToStringByMode(mode, min),
  };
};
const __DateTimePickerAction = asPartComponent(DateTimePickerAction);

const CameraAction = async ({ label }) => ({
  type: 'camera',
  label,
});
const __CameraAction = asPartComponent(CameraAction);

const CameraRollAction = async ({ label }) => ({
  type: 'cameraRoll',
  label,
});
const __CameraRollAction = asPartComponent(CameraRollAction);

const LocationAction = async ({ label }) => ({
  type: 'location',
  label,
});
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
