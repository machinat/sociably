import moxy from 'moxy';
import ReceiveFrame from '../receiveFrame';

const bot = {
  an: 'droid',
  engine: {
    dispatch: moxy(() => Promise.resolve({ success: true })),
  },
};
const event = {
  platform: 'resistance',
  type: 'repair',
  thread: { a: 'x-wing' },
};
const source = 'ANewHope';
const transportCtx = { assault: 'DeathStar' };

it('is a contructor', () => {
  expect(typeof ReceiveFrame).toBe('function');

  const frame = new ReceiveFrame(event, bot, source, transportCtx);

  expect(frame.bot).toBe(bot);
  expect(frame.event).toBe(event);
  expect(frame.source).toBe(source);
  expect(frame.transportContext).toBe(transportCtx);
  expect(frame.platform).toBe(event.platform);
});

describe('#react()', () => {
  it('make bot.engine.dispatch() call', async () => {
    const frame = new ReceiveFrame(event, bot, source, transportCtx);

    const msg = "I'm hit! R2, do what you can do on it.";
    const options = { very: 'urgent' };

    await expect(frame.react(msg, options)).resolves.toEqual({
      success: true,
    });

    expect(bot.engine.dispatch.mock).toHaveBeenCalledWith(
      event.thread,
      msg,
      options
    );
  });
});
