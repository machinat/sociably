// @flow
import type {
  BotPlugin,
  EventMiddleware,
  DispatchMiddleware,
} from 'machinat-base/types';

const plugin = (
  eventMiddleware: ?EventMiddleware<any, any, any, any, any, any>,
  dispatchMiddleware?: ?DispatchMiddleware<any, any, any>
): BotPlugin<any, any, any, any, any, any, any, any, any, any> => () => ({
  eventMiddleware,
  dispatchMiddleware,
});

export default plugin;
