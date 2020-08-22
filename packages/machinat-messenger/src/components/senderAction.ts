import { unitSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

const MARK_SEEN_VALUE = { sender_action: 'mark_seen' };
const TYPING_OFF_VALUE = { sender_action: 'typing_off' };
const TYPING_ON_VALUE = { sender_action: 'typing_on' };

export const MarkSeen = (node, path) => [
  unitSegment(node, path, MARK_SEEN_VALUE),
];
annotateMessengerComponent(MarkSeen);

export const TypingOn = (node, path) => [
  unitSegment(node, path, TYPING_ON_VALUE),
];
annotateMessengerComponent(TypingOn);

export const TypingOff = (node, path) => [
  unitSegment(node, path, TYPING_OFF_VALUE),
];
annotateMessengerComponent(TypingOff);
