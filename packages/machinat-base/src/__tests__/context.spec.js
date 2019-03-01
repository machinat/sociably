import moxy from 'moxy';
import ReceiveContext from '../context';

const bot = {
  an: 'droid',
  deliver: moxy(() => Promise.resolve({ success: true })),
};
const event = {
  platform: 'resistance',
  type: 'repair',
  thread: { a: 'x-wing' },
};
const source = 'ANewHope';
const transportCtx = { assault: 'DeathStar' };

it('is a contructor', () => {
  expect(typeof ReceiveContext).toBe('function');

  const context = new ReceiveContext(event, bot, source, transportCtx);

  expect(context.bot).toBe(bot);
  expect(context.event).toBe(event);
  expect(context.source).toBe(source);
  expect(context.transportContext).toBe(transportCtx);
  expect(context.platform).toBe(event.platform);
});

describe('#react()', () => {
  it('make bot.deliver() call', async () => {
    const context = new ReceiveContext(event, bot, source, transportCtx);

    const msg = "I'm hit! R2, do what you can do on it.";
    const options = { very: 'urgent' };

    await expect(context.react(msg, options)).resolves.toEqual({
      success: true,
    });

    expect(bot.deliver.mock).toHaveBeenCalledWith(event.thread, msg, options);
  });
});
