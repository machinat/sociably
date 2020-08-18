import MessengerChannel from '../../channel';
import MessengerUser from '../../user';
import { refinementFromExtensionPayload } from '../utils';

describe('refinementFromExtensionPayload(payload))', () => {
  test('within user to page thread', () => {
    const { user, channel } = refinementFromExtensionPayload({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'USER_TO_PAGE',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel).toEqual(
      new MessengerChannel('_PAGE_ID_', { id: '_THREAD_ID_' }, 'USER_TO_PAGE')
    );
    expect(user).toEqual(new MessengerUser('_PAGE_ID_', '_USER_PSID_'));
  });

  test('within user to user thread', () => {
    const { user, channel } = refinementFromExtensionPayload({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'USER_TO_USER',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel).toEqual(
      new MessengerChannel('_PAGE_ID_', { id: '_THREAD_ID_' }, 'USER_TO_USER')
    );
    expect(user).toEqual(new MessengerUser('_PAGE_ID_', '_USER_PSID_'));
  });

  test('within group', () => {
    const { user, channel } = refinementFromExtensionPayload({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'GROUP',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel).toEqual(
      new MessengerChannel('_PAGE_ID_', { id: '_THREAD_ID_' }, 'GROUP')
    );
    expect(user).toEqual(new MessengerUser('_PAGE_ID_', '_USER_PSID_'));
  });
});
