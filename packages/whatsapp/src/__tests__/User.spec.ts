import WhatsAppUser from '../User';
import WhatsAppChat from '../Chat';
import UserProfile from '../UserProfile';

test('with profile', () => {
  const user = new WhatsAppUser('1234567890', { name: 'Jojo' });

  expect(user.platform).toBe('whatsapp');
  expect(user.number).toBe('1234567890');
  expect(user.profileData).toEqual({ name: 'Jojo' });
  expect(user.profile).toStrictEqual(
    new UserProfile('1234567890', { name: 'Jojo' })
  );
  expect(user.uid).toMatchInlineSnapshot(`"whatsapp.1234567890"`);
});

test('with no profile', () => {
  const user = new WhatsAppUser('1234567890');

  expect(user.platform).toBe('whatsapp');
  expect(user.number).toBe('1234567890');
  expect(user.profileData).toBe(undefined);
  expect(user.profile).toBe(null);
  expect(user.uid).toMatchInlineSnapshot(`"whatsapp.1234567890"`);
});

test('marshallable', () => {
  const user = new WhatsAppUser('1234567890', { name: 'Dio' });

  expect(user.typeName()).toBe('WhatsAppUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "num": "1234567890",
    }
  `);

  expect(WhatsAppUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new WhatsAppUser('1234567890')
  );
});

test('User.fromChat()', () => {
  expect(
    WhatsAppUser.fromChat(new WhatsAppChat('9876543210', '1234567890'))
  ).toStrictEqual(new WhatsAppUser('1234567890'));
});