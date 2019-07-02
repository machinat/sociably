import moxy from 'moxy';
import connectKoa from '../connectKoa';

const bot = moxy({
  receiver: {
    handleRequest() {},
    callback: () => moxy(),
  },
});

const ctx = moxy({
  req: {},
  res: { end: () => ctx.res },
  request: {},
  response: {},
});

beforeEach(() => {
  ctx.mock.clear();
  bot.mock.clear();
});

it('works when connect to a bot directly', async () => {
  const middleware = connectKoa(bot);
  const promise = middleware(ctx);

  expect(promise).toBeInstanceOf(Promise);
  await expect(promise).resolves.toBe(undefined);

  expect(bot.receiver.callback.mock).toHaveBeenCalledTimes(1);

  const callback = bot.receiver.callback.mock.calls[0].result;
  expect(callback.mock).toHaveBeenCalledWith(ctx.req, ctx.res, undefined);

  expect(ctx.mock.setter('status')).not.toHaveBeenCalled();
});

it('works when connect to a bot provider function', async () => {
  const provider = moxy(() => bot);

  const middleware = connectKoa(provider);
  const promise = middleware(ctx);

  expect(promise).toBeInstanceOf(Promise);
  await expect(promise).resolves.toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(ctx.req);

  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledWith(
    ctx.req,
    ctx.res,
    undefined
  );

  expect(ctx.mock.setter('status')).not.toHaveBeenCalled();
});

it('respond 404 when bot provider function returns undefined', async () => {
  ctx.mock.setter('status').fake(() => {});

  const provider = moxy(() => undefined);
  const middleware = connectKoa(provider);
  const promise = middleware(ctx);

  expect(promise).toBeInstanceOf(Promise);
  await expect(promise).resolves.toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(ctx.req);

  expect(ctx.mock.setter('status')).toHaveBeenCalledWith(404);
});
