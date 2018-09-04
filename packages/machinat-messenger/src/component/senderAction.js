import { annotateNativeRoot } from './utils';
import { ENTRY_MESSAGES } from './constant';

const MARK_SEEN = { sender_action: 'mark_seen' };
export const MarkSeen = () => MARK_SEEN;
annotateNativeRoot(MarkSeen, ENTRY_MESSAGES);

const TYPING_ON = { sender_action: 'typing_on' };
export const TypingOn = () => TYPING_ON;
annotateNativeRoot(TypingOn, ENTRY_MESSAGES);

const TYPING_OFF = { sender_action: 'typing_off' };
export const TypingOff = () => TYPING_OFF;
annotateNativeRoot(TypingOff, ENTRY_MESSAGES);
