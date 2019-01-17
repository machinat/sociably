import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { MESSENGER_NAITVE_TYPE } from '../symbol';
import { ENTRY_MESSAGES } from '../apiEntry';

const MARK_SEEN_RENDERED = [{ sender_action: 'mark_seen' }];
const TYPING_ON_RENDERED = [{ sender_action: 'typing_on' }];
const TYPING_OFF_RENDERED = [{ sender_action: 'typing_off' }];

export const MarkSeen = () => MARK_SEEN_RENDERED;

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(MarkSeen);

export const TypingOn = () => TYPING_ON_RENDERED;

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(TypingOn);

export const TypingOff = () => TYPING_OFF_RENDERED;

annotate(
  asNative(MESSENGER_NAITVE_TYPE),
  hasEntry(ENTRY_MESSAGES),
  asUnit(true)
)(TypingOff);
