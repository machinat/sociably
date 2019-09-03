import BaseReceiver from '../receiver';

it('#bindIssuer() and #unbindIssuer()', () => {
  const receiver = new BaseReceiver();

  expect(receiver.isBound).toBe(false);

  expect(receiver._issueEvent).toBe(undefined);
  expect(receiver._issueError).toBe(undefined);

  const eventIssuer = () => {};
  const errorIssuer = () => {};
  expect(receiver.bindIssuer(eventIssuer, errorIssuer)).toBe(true);
  expect(receiver.isBound).toBe(true);

  expect(receiver._issueEvent).toBe(eventIssuer);
  expect(receiver._issueError).toBe(errorIssuer);

  expect(receiver.bindIssuer(eventIssuer, errorIssuer)).toBe(false);
  expect(receiver.isBound).toBe(true);

  expect(receiver.unbindIssuer()).toBe(true);
  expect(receiver.isBound).toBe(false);

  expect(receiver.unbindIssuer()).toBe(false);
  expect(receiver.isBound).toBe(false);
});
