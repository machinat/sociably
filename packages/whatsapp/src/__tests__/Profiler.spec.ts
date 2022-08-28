import Profiler from '../Profiler';
import UserProfile from '../UserProfile';
import WhatsAppUser from '../User';

it('simply get profile from user', async () => {
  const profiler = new Profiler();
  expect(profiler.platform).toBe('whatsapp');

  await expect(
    profiler.getUserProfile(new WhatsAppUser('1234567890'))
  ).resolves.toBe(null);

  await expect(
    profiler.getUserProfile(new WhatsAppUser('1234567890', { name: 'Joseph' }))
  ).resolves.toStrictEqual(new UserProfile('1234567890', { name: 'Joseph' }));
});
