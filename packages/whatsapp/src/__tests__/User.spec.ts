import WhatsAppUser from '../User.js';
import UserProfile from '../UserProfile.js';

test('with profile', () => {
  const user = new WhatsAppUser('1234567890', { name: 'Jojo' });

  expect(user.platform).toBe('whatsapp');
  expect(user.numberId).toBe('1234567890');
  expect(user.profileData).toEqual({ name: 'Jojo' });
  expect(user.profile).toStrictEqual(
    new UserProfile('1234567890', { name: 'Jojo' })
  );
  expect(user.uid).toMatchInlineSnapshot(`"wa.1234567890"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "1234567890",
      "platform": "whatsapp",
    }
  `);
});

test('with no profile', () => {
  const user = new WhatsAppUser('1234567890');

  expect(user.platform).toBe('whatsapp');
  expect(user.numberId).toBe('1234567890');
  expect(user.profileData).toBe(undefined);
  expect(user.profile).toBe(null);
  expect(user.uid).toMatchInlineSnapshot(`"wa.1234567890"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "1234567890",
      "platform": "whatsapp",
    }
  `);
});

test('marshallable', () => {
  const user = new WhatsAppUser('1234567890', { name: 'Dio' });

  expect(user.typeName()).toBe('WaUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "1234567890",
    }
  `);

  expect(WhatsAppUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new WhatsAppUser('1234567890')
  );
});
