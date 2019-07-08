import moxy from 'moxy';
import connectHapi from '../connectHapi';

const bot = moxy({
  receiver: {
    handleRequest() {},
    callback: () => moxy(),
  },
});

const req = moxy({});
const res = moxy({});
const request = {
  raw: { req, res },
  payload: Buffer.from('Hello World!'),
};

const h = moxy({
  abandon: 'I quit!',
  response() {
    return moxy({
      code() {
        return this;
      },
    });
  },
});

beforeEach(() => {
  h.mock.clear();
  bot.mock.clear();
});

it('works when connect to a bot directly', () => {
  const handler = connectHapi(bot);

  expect(handler(request, h)).toBe(h.abandon);

  expect(bot.receiver.callback.mock).toHaveBeenCalledTimes(1);

  const callback = bot.receiver.callback.mock.calls[0].result;
  expect(callback.mock).toHaveBeenCalledWith(req, res, 'Hello World!');
});

it('works when connect to a bot provider function', () => {
  const provider = moxy(() => bot);

  const handler = connectHapi(provider);

  expect(handler(request, h)).toBe(h.abandon);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);

  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledWith(
    req,
    res,
    'Hello World!'
  );
});

it('respond 404 when bot provider function returns undefined', () => {
  const provider = moxy(() => undefined);
  const handler = connectHapi(provider);

  const result = handler(request, h);
  expect(h.response.mock).toHaveBeenCalledTimes(1);
  expect(result).toBe(h.response.mock.calls[0].result);
  expect(result.code.mock).toHaveBeenCalledWith(404);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);
});
