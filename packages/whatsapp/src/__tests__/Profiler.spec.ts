import Profiler from '../Profiler.js';
import UserProfile from '../UserProfile.js';
import WhatsAppAgent from '../Agent.js';
import WhatsAppUser from '../User.js';

it('simply get profile from user', async () => {
  const profiler = new Profiler();
  expect(profiler.platform).toBe('whatsapp');

  await expect(
    profiler.getUserProfile(
      new WhatsAppAgent('9876543210'),
      new WhatsAppUser('1234567890')
    )
  ).resolves.toBe(null);

  await expect(
    profiler.getUserProfile(
      new WhatsAppAgent('9876543210'),
      new WhatsAppUser('1234567890', { name: 'Joseph' })
    )
  ).resolves.toStrictEqual(new UserProfile('1234567890', { name: 'Joseph' }));
});
