import moxy from 'moxy';
import connectRequest from '../connectRequest';

const bot = moxy({
  receiver: {
    handleRequest() {},
    callback: () => moxy(),
  },
});

const req = moxy({});
const res = moxy({ end: () => res });

beforeEach(() => {
  req.mock.clear();
  res.mock.clear();
  bot.mock.clear();
});

it('works when connect to a bot directly', () => {
  const callback = connectRequest(bot);
  expect(bot.receiver.callback.mock).toHaveBeenCalledTimes(1);
  expect(callback).toBe(bot.receiver.callback.mock.calls[0].result);

  expect(callback(req, res)).toBe(undefined);

  // leave the response to receiver
  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();
  expect(res.end.mock).not.toHaveBeenCalled();
});

it('works when connect to a bot provider function', () => {
  const provider = moxy(() => bot);

  const callback = connectRequest(provider);

  expect(callback(req, res)).toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);

  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledTimes(1);
  expect(bot.receiver.handleRequest.mock).toHaveBeenCalledWith(req, res);

  expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();
  expect(res.end.mock).not.toHaveBeenCalled();
});

it('respond 404 when bot provider function returns undefined', () => {
  res.mock.setter('statusCode').fake(() => {});

  const provider = moxy(() => undefined);
  const callback = connectRequest(provider);

  expect(callback(req, res)).toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);

  expect(res.mock.setter('statusCode')).toHaveBeenCalledWith(404);
  expect(res.end.mock).toHaveBeenCalledTimes(1);
  expect(res.end.mock).toHaveBeenCalledWith('Not Found');
});
