// @flow
import { namedInterface } from '@machinat/core/service';
import type { LinePlatformConfigs, LinePlatformMounter } from './types';

export const LINE = 'line';

export const CHANNEL_API_CALL_GETTER = Symbol(
  'line.segment.channel_api_call_getter'
);
export const BULK_API_CALL_GETTER = Symbol('line.segment.bulk_api_call_getter');

export const PATH_REPLY = 'v2/bot/message/reply';
export const PATH_PUSH = 'v2/bot/message/push';
export const PATH_MULTICAST = 'v2/bot/message/multicast';
export const PATH_RICHMENU = 'v2/bot/richmenu';

export const LINE_PLATFORM_CONFIGS_I = namedInterface<LinePlatformConfigs>(
  'LinePlatformConfigs'
);

export const LINE_PLATFORM_MOUNTER_I = namedInterface<LinePlatformMounter>(
  'LinePlatformMounter'
);
