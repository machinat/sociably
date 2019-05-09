import { asSingleMessageUnitComponent } from './utils';

const MARK_SEEN_RENDERED = { sender_action: 'mark_seen' };
const MarkSeen = () => MARK_SEEN_RENDERED;
const __MarkSeen = asSingleMessageUnitComponent(MarkSeen);

const TYPING_ON_RENDERED = { sender_action: 'typing_on' };
const TypingOn = () => TYPING_ON_RENDERED;
const __TypingOn = asSingleMessageUnitComponent(TypingOn);

const TYPING_OFF_RENDERED = { sender_action: 'typing_off' };
const TypingOff = () => TYPING_OFF_RENDERED;
const __TypingOff = asSingleMessageUnitComponent(TypingOff);

export {
  __MarkSeen as MarkSeen,
  __TypingOn as TypingOn,
  __TypingOff as TypingOff,
};
