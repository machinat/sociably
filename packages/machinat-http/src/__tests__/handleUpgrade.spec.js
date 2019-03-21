import moxy from 'moxy';
import connectUpgrade from '../connectUpgrade';

const bot = moxy({
  adaptor: {
    handleUpgrade() {},
  },
});

const req = moxy({});
const socket = moxy({
  destroy: () => socket,
  write: () => true,
});
const buffer = Buffer.from('foo');

beforeEach(() => {
  req.mock.clear();
  bot.mock.clear();
});

it('works when connect to a bot directly', () => {
  const callback = connectUpgrade(bot);

  expect(callback(req, socket, buffer)).toBe(undefined);
  expect(bot.adaptor.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(bot.adaptor.handleUpgrade.mock).toHaveBeenCalledWith(
    req,
    socket,
    buffer
  );

  // leave the socket to adaptor
  expect(socket.write.mock).not.toHaveBeenCalled();
  expect(socket.destroy.mock).not.toHaveBeenCalled();
});

it('works when connect to a bot provider function', () => {
  const provider = moxy(() => bot);

  const callback = connectUpgrade(provider);

  expect(callback(req, socket, buffer)).toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);

  expect(bot.adaptor.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(bot.adaptor.handleUpgrade.mock).toHaveBeenCalledWith(
    req,
    socket,
    buffer
  );

  expect(socket.write.mock).not.toHaveBeenCalled();
  expect(socket.destroy.mock).not.toHaveBeenCalled();
});

it('respond 404 when bot provider function returns undefined', () => {
  const provider = moxy();

  const callback = connectUpgrade(provider);

  expect(callback(req, socket, buffer)).toBe(undefined);

  expect(provider.mock).toHaveBeenCalledTimes(1);
  expect(provider.mock).toHaveBeenCalledWith(req);

  expect(socket.write.mock).toHaveBeenCalledWith(
    expect.stringMatching('HTTP/1.1 404 Not Found')
  );
  expect(socket.destroy.mock).toHaveBeenCalledTimes(1);
});
