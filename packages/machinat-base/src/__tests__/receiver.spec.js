import BaseReceiver from '../receiver';

it('#bindIssuer() and #unbindIssuer()', () => {
  const receiver = new BaseReceiver();

  expect(receiver.isBound).toBe(false);

  expect(receiver.bindIssuer(() => {}, () => {})).toBe(true);
  expect(receiver.isBound).toBe(true);

  expect(receiver.bindIssuer(() => {}, () => {})).toBe(false);
  expect(receiver.isBound).toBe(true);

  expect(receiver.unbindIssuer()).toBe(true);
  expect(receiver.isBound).toBe(false);

  expect(receiver.unbindIssuer()).toBe(false);
  expect(receiver.isBound).toBe(false);
});
