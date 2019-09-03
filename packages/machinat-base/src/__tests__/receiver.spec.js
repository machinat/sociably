import moxy from 'moxy';
import BaseReceiver from '../receiver';

it('#bindIssuer() and #unbindIssuer()', () => {
  const receiver = new BaseReceiver();

  expect(receiver.isBound).toBe(false);

  const eventIssuer = moxy();
  const errorIssuer = moxy();

  expect(receiver.bindIssuer(eventIssuer, errorIssuer)).toBe(true);
  expect(receiver.isBound).toBe(true);

  expect(receiver.bindIssuer(eventIssuer, errorIssuer)).toBe(false);
  expect(receiver.isBound).toBe(true);

  expect(receiver.unbindIssuer()).toBe(true);
  expect(receiver.isBound).toBe(false);

  expect(receiver.unbindIssuer()).toBe(false);
  expect(receiver.isBound).toBe(false);
});

it('delegate #issueEvent() to event issuer bound', async () => {
  const receiver = new BaseReceiver();

  const eventIssuer = moxy(async () => ({ some: 'response' }));
  const errorIssuer = moxy();
  receiver.bindIssuer(eventIssuer, errorIssuer);

  await expect(
    receiver.issueEvent('CHANNEL', 'USER', 'EVENT', 'METADATA')
  ).resolves.toEqual({ some: 'response' });

  expect(eventIssuer.mock).toHaveBeenCalledTimes(1);
  expect(eventIssuer.mock).toHaveBeenCalledWith(
    'CHANNEL',
    'USER',
    'EVENT',
    'METADATA'
  );
});

it('delegate #issueError() to error issuer bound', () => {
  const receiver = new BaseReceiver();

  const eventIssuer = moxy();
  const errorIssuer = moxy();
  receiver.bindIssuer(eventIssuer, errorIssuer);

  expect(receiver.issueError(new Error('terminated!'))).toBe(undefined);

  expect(errorIssuer.mock).toHaveBeenCalledTimes(1);
  expect(errorIssuer.mock).toHaveBeenCalledWith(new Error('terminated!'));
});

it('throw if #issueEvent() called when not bound', () => {
  const receiver = new BaseReceiver();

  expect(() =>
    receiver.issueEvent('CHANNEL', 'USER', 'EVENT', 'METADATA')
  ).toThrowErrorMatchingInlineSnapshot(`"receiver is not bound"`);
});

it('throw if #issueError() called when not bound', () => {
  const receiver = new BaseReceiver();

  expect(() =>
    receiver.issueError(new Error('terminated!'))
  ).toThrowErrorMatchingInlineSnapshot(`"receiver is not bound"`);
});
