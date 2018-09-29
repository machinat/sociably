import { annotateNativeRoot } from 'machinat-renderer';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import { ENTRY_MESSAGES } from './apiEntry';

const MARK_SEEN = { sender_action: 'mark_seen' };
export const MarkSeen = () => MARK_SEEN;
annotateNativeRoot(MarkSeen, MESSENGER_NAITVE_TYPE, ENTRY_MESSAGES);

const TYPING_ON = { sender_action: 'typing_on' };
export const TypingOn = () => TYPING_ON;
annotateNativeRoot(TypingOn, MESSENGER_NAITVE_TYPE, ENTRY_MESSAGES);

const TYPING_OFF = { sender_action: 'typing_off' };
export const TypingOff = () => TYPING_OFF;
annotateNativeRoot(TypingOff, MESSENGER_NAITVE_TYPE, ENTRY_MESSAGES);
