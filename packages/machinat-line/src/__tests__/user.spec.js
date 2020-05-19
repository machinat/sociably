import LineUser from '../user';

test('preperties ok', () => {
  const user = new LineUser('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', '_USER_ID_');

  expect(user.platform).toBe('line');
  expect(user.providerId).toBe('_PROVIDER_ID_');
  expect(user.botChannelId).toBe('_BOT_CHANNEL_ID_');
  expect(user.id).toBe('_USER_ID_');
  expect(user.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._USER_ID_"`);
});
