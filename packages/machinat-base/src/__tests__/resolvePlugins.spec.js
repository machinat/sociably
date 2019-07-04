import moxy from 'moxy';
import resolvePlugins from '../resolvePlugins';

const bot = { i: 'need a heart' };

it('resolve eventMiddlewares & dispatchMiddlewares', () => {
  const eventMiddleware1 = () => () => {};
  const eventMiddleware2 = () => () => {};
  const dispatchMiddleware1 = () => () => {};
  const dispatchMiddleware2 = () => () => {};
  const plugins = [
    moxy(() => ({
      dispatchMiddleware: dispatchMiddleware1,
    })),
    moxy(() => ({
      eventMiddleware: eventMiddleware1,
    })),
    moxy(() => ({
      dispatchMiddleware: dispatchMiddleware2,
      eventMiddleware: eventMiddleware2,
    })),
  ];

  expect(resolvePlugins(bot, plugins)).toEqual({
    eventMiddlewares: [eventMiddleware1, eventMiddleware2],
    dispatchMiddlewares: [dispatchMiddleware1, dispatchMiddleware2],
  });

  plugins.forEach(pluginFn => {
    expect(pluginFn.mock).toHaveBeenCalledTimes(1);
    expect(pluginFn.mock).toHaveBeenCalledWith(bot);
  });
});

it('resolve middlewares as empty array if plugins are empty', () => {
  expect(resolvePlugins(bot, undefined)).toEqual({
    eventMiddlewares: [],
    dispatchMiddlewares: [],
  });

  expect(resolvePlugins(bot, null)).toEqual({
    eventMiddlewares: [],
    dispatchMiddlewares: [],
  });

  expect(resolvePlugins(bot, [])).toEqual({
    eventMiddlewares: [],
    dispatchMiddlewares: [],
  });

  const nonePlugin = moxy(() => null);
  const emptyPlugin = moxy(() => ({}));
  expect(resolvePlugins(bot, [emptyPlugin, nonePlugin])).toEqual({
    eventMiddlewares: [],
    dispatchMiddlewares: [],
  });

  expect(nonePlugin.mock).toHaveBeenCalledTimes(1);
  expect(nonePlugin.mock).toHaveBeenCalledWith(bot);
  expect(emptyPlugin.mock).toHaveBeenCalledTimes(1);
  expect(emptyPlugin.mock).toHaveBeenCalledWith(bot);
});
