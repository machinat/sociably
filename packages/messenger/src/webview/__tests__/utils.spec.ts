import MessengerChannel from '../../channel';
import MessengerUser from '../../user';
import { supplementContext } from '../utils';

describe('supplementContext(payload))', () => {
  test('within user to page chat', () => {
    expect(
      supplementContext({
        userId: '_USER_PSID_',
        chatType: 'USER_TO_PAGE',
        chatId: '_THREAD_ID_',
        pageId: 1234567890,
        client: 'facebook',
      })
    ).toEqual({
      channel: new MessengerChannel(
        1234567890,
        { id: '_THREAD_ID_' },
        'USER_TO_PAGE'
      ),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'facebook',
    });
  });

  test('within user to user chat', () => {
    expect(
      supplementContext({
        userId: '_USER_PSID_',
        chatType: 'USER_TO_USER',
        chatId: '_THREAD_ID_',
        pageId: 1234567890,
        client: 'messenger',
      })
    ).toEqual({
      channel: new MessengerChannel(
        1234567890,
        { id: '_THREAD_ID_' },
        'USER_TO_USER'
      ),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'messenger',
    });
  });

  test('within group chat', () => {
    expect(
      supplementContext({
        userId: '_USER_PSID_',
        chatType: 'GROUP',
        chatId: '_THREAD_ID_',
        pageId: 1234567890,
        client: 'messenger',
      })
    ).toEqual({
      channel: new MessengerChannel(1234567890, { id: '_THREAD_ID_' }, 'GROUP'),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'messenger',
    });
  });
});
