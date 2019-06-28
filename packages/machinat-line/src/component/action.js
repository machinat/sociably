import { asSinglePartComponent } from './utils';

const PostbackAction = async ({
  props: { label, data, text, displayText },
}) => ({
  type: 'postback',
  data,
  label,
  displayText: displayText || text,
});
const __PostbackAction = asSinglePartComponent(PostbackAction);

const MessageAction = async ({ props: { label, text } }) => ({
  type: 'message',
  label,
  text,
});
const __MessageAction = asSinglePartComponent(MessageAction);

const URIAction = async ({ props: { label, uri } }) => ({
  type: 'uri',
  label,
  uri,
});
const __URIAction = asSinglePartComponent(URIAction);

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
  props: { label, data, mode, date, time, initial, min, max },
}) => {
  const modeRefined =
    mode || (!date === !time ? 'datetime' : date ? 'date' : 'time');

  return {
    type: 'datetimepicker',
    label,
    data,
    mode: modeRefined,
    initial: dateToStringByMode(modeRefined, initial),
    max: dateToStringByMode(modeRefined, max),
    min: dateToStringByMode(modeRefined, min),
  };
};
const __DateTimePickerAction = asSinglePartComponent(DateTimePickerAction);

const CameraAction = async ({ props: { label } }) => ({
  type: 'camera',
  label,
});
const __CameraAction = asSinglePartComponent(CameraAction);

const CameraRollAction = async ({ props: { label } }) => ({
  type: 'cameraRoll',
  label,
});
const __CameraRollAction = asSinglePartComponent(CameraRollAction);

const LocationAction = async ({ props: { label } }) => ({
  type: 'location',
  label,
});
const __LocationAction = asSinglePartComponent(LocationAction);

export {
  __PostbackAction as PostbackAction,
  __MessageAction as MessageAction,
  __URIAction as URIAction,
  __DateTimePickerAction as DateTimePickerAction,
  __CameraAction as CameraAction,
  __CameraRollAction as CameraRollAction,
  __LocationAction as LocationAction,
};
