import { asUnitComponent } from '../utils';

const MARK_SEEN_RENDERED = { sender_action: 'mark_seen' };
const MarkSeen = async () => MARK_SEEN_RENDERED;
const __MarkSeen = asUnitComponent(MarkSeen);

const TYPING_ON_RENDERED = { sender_action: 'typing_on' };
const TypingOn = async () => TYPING_ON_RENDERED;
const __TypingOn = asUnitComponent(TypingOn);

const TYPING_OFF_RENDERED = { sender_action: 'typing_off' };
const TypingOff = async () => TYPING_OFF_RENDERED;
const __TypingOff = asUnitComponent(TypingOff);

export {
  __MarkSeen as MarkSeen,
  __TypingOn as TypingOn,
  __TypingOff as TypingOff,
};
