import { makePartSegment } from '@machinat/core/renderer';
import { PartSegment, FunctionOf } from '@machinat/core/renderer/types';
import { annotateLineComponent } from '../utils';
import type { LineComponent } from '../types';

/**
 * @category Props
 */
export type PostbackActionProps = {
  /** Label for the action */
  label?: string;
  /**
   * String returned via webhook in the `postback.data` property of the postback
   * event. Max character limit: 300.
   */
  data: string;
  /**
   * Text displayed in the chat as a message sent by the user when the action is
   * performed. Required for quick reply buttons. Optional for the other message
   * types. Max character limit: 300.
   */
  displayText?: string;
};

/** @internal */
const __PostbackAction: FunctionOf<LineComponent<
  PostbackActionProps,
  PartSegment<any>
>> = function PostbackAction(node, path) {
  const { label, data, displayText } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'postback',
      data,
      label,
      displayText,
    }),
  ];
};
/**
 * When a control associated with this action is tapped, a postback event is
 * returned via webhook with the specified string in the data property.
 * @category Component
 * @props {@link PostbackActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#postback-action).
 */
export const PostbackAction: LineComponent<
  PostbackActionProps,
  PartSegment<any>
> = annotateLineComponent(__PostbackAction);

/**
 * @category Props
 */
export type MessageActionProps = {
  /** Label for the action */
  label?: string;
  /** Text sent when the action is performed. Max character limit: 300 */
  text?: string;
};

/** @internal */
const __MessageAction: FunctionOf<LineComponent<
  MessageActionProps,
  PartSegment<any>
>> = function MessageAction(node, path) {
  const { label, text } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'message',
      label,
      text,
    }),
  ];
};
/**
 * When a control associated with this action is tapped, the string in the
 * `text` property is sent as a message from the user.
 * @category Component
 * @props {@link MessageActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#message-action).
 */
export const MessageAction: LineComponent<
  MessageActionProps,
  PartSegment<any>
> = annotateLineComponent(__MessageAction);

/**
 * @category Props
 */
export type UriActionProps = {
  /** Label for the action */
  label?: string;
  /**
   * URI opened when the action is performed (Max character limit: 1000). The
   * available schemes are http, https, line, and tel.
   */
  uri: string;
};

/** @internal */
const __UriAction: FunctionOf<LineComponent<
  UriActionProps,
  PartSegment<any>
>> = function UriAction(node, path) {
  const { label, uri } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'uri',
      label,
      uri,
    }),
  ];
};
/**
 * When a control associated with this action is tapped, the URI specified in
 * the `uri` property is opened.
 * @category Component
 * @props {@link UriActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#uri-action).
 */
export const UriAction: LineComponent<
  UriActionProps,
  PartSegment<any>
> = annotateLineComponent(__UriAction);

/** @internal */
const pad2 = (n) => (n < 10 ? `0${n}` : n);

/** @internal */
const fullDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** @internal */
const fullHourMinute = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** @internal */
const dateToStringByMode = (mode, d) =>
  !(d instanceof Date)
    ? d
    : mode === 'datetime'
    ? `${fullDate(d)}T${fullHourMinute(d)}`
    : mode === 'date'
    ? fullDate(d)
    : fullHourMinute(d);

/**
 * @category Props
 */
export type DateTimePickerActionProps = {
  /** Label for the action  */
  label?: string;
  /**
   * String returned via webhook in the postback.data property of the postback
   * event. Max character limit: 300.
   */
  data: string;
  /** Action mode */
  mode?: 'datetime' | 'date' | 'time';
  /** Initial value of date or time */
  initial?: string | Date;
  /**
   * Largest date or time value that can be selected. Must be greater than the
   * min value.
   */
  max?: string | Date;
  /**
   * Smallest date or time value that can be selected. Must be less than the max
   * value.
   */
  min?: string | Date;
};

/** @internal */
const __DateTimePickerAction: FunctionOf<LineComponent<
  DateTimePickerActionProps,
  PartSegment<any>
>> = function DateTimePickerAction(node, path) {
  const { label, data, mode = 'datetime', initial, min, max } = node.props;

  return [
    makePartSegment(node, path, {
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
/**
 * When a control associated with this action is tapped, a postback event is
 * returned via webhook with the date and time selected by the user from the
 * date and time selection dialog. The datetime picker action does not support
 * time zones.
 * @category Component
 * @props {@link DateTimePickerActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#datetime-picker-action).
 */
export const DateTimePickerAction: LineComponent<
  DateTimePickerActionProps,
  PartSegment<any>
> = annotateLineComponent(__DateTimePickerAction);

/**
 * @category Props
 */
export type CameraActionProps = {
  /** Label for the action. Max character limit: 20 */
  label?: string;
};

/** @internal */
const __CameraAction: FunctionOf<LineComponent<
  CameraActionProps,
  PartSegment<any>
>> = function CameraAction(node, path) {
  return [
    makePartSegment(node, path, {
      type: 'camera',
      label: node.props.label,
    }),
  ];
};
/**
 * This action can be configured only with quick reply buttons. When a button
 * associated with this action is tapped, the camera screen in LINE is opened.
 * @category Component
 * @props {@link CameraActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#camera-action).
 */
export const CameraAction: LineComponent<
  CameraActionProps,
  PartSegment<any>
> = annotateLineComponent(__CameraAction);

/**
 * @category Props
 */
export type CameraRollActionProps = {
  /** Label for the action. Max character limit: 20 */
  label?: string;
};

/** @internal */
const __CameraRollAction: FunctionOf<LineComponent<
  CameraRollActionProps,
  PartSegment<any>
>> = function CameraRollAction(node, path) {
  return [
    makePartSegment(node, path, {
      type: 'cameraRoll',
      label: node.props.label,
    }),
  ];
};
/**
 * This action can be configured only with quick reply buttons. When a button
 * associated with this action is tapped, the camera roll screen in LINE is
 * opened.
 * @category Component
 * @props {@link CameraRollActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#camera-roll-action).
 */
export const CameraRollAction: LineComponent<
  CameraRollActionProps,
  PartSegment<any>
> = annotateLineComponent(__CameraRollAction);

/**
 * @category Props
 */
export type LocationActionProps = {
  /** Label for the action. Max character limit: 20 */
  label?: string;
};

/** @internal */
const __LocationAction: FunctionOf<LineComponent<
  LocationActionProps,
  PartSegment<any>
>> = function LocationAction(node, path) {
  return [
    makePartSegment(node, path, {
      type: 'location',
      label: node.props.label,
    }),
  ];
};
/**
 * This action can be configured only with quick reply buttons. When a button
 * associated with this action is tapped, the location screen in LINE is opened.
 * @category Component
 * @props {@link LocationActionProps}
 * @guides Check official [reference](https://developers.line.biz/en/reference/messaging-api/#camera-roll-action).
 */
export const LocationAction: LineComponent<
  LocationActionProps,
  PartSegment<any>
> = annotateLineComponent(__LocationAction);

export type Action =
  | typeof PostbackAction
  | typeof MessageAction
  | typeof UriAction
  | typeof DateTimePickerAction
  | typeof CameraAction
  | typeof CameraRollAction
  | typeof LocationAction;
