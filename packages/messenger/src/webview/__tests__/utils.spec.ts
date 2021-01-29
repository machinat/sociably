import MessengerChannel from '../../channel';
import MessengerUser from '../../user';
import { MessengerChatType } from '../../constant';
import { supplementContext } from '../utils';

describe('supplementContext(payload))', () => {
  test('within user to page chat', () => {
    expect(
      supplementContext({
        user: '_USER_PSID_',
        chat: {
          type: MessengerChatType.UserToPage,
          id: '_THREAD_ID_',
        },
        page: 1234567890,
        client: 'facebook',
      })
    ).toEqual({
      channel: new MessengerChannel(1234567890, { id: '_THREAD_ID_' }),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'facebook',
    });
  });

  test('within user to user chat', () => {
    expect(
      supplementContext({
        user: '_USER_PSID_',
        chat: {
          type: MessengerChatType.UserToUser,
          id: '_THREAD_ID_',
        },
        page: 1234567890,
        client: 'messenger',
      })
    ).toEqual({
      channel: new MessengerChannel(
        1234567890,
        { id: '_THREAD_ID_' },
        MessengerChatType.UserToUser
      ),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'messenger',
    });
  });

  test('within group chat', () => {
    expect(
      supplementContext({
        user: '_USER_PSID_',
        chat: {
          id: '_THREAD_ID_',
          type: MessengerChatType.Group,
        },
        page: 1234567890,
        client: 'messenger',
      })
    ).toEqual({
      channel: new MessengerChannel(
        1234567890,
        { id: '_THREAD_ID_' },
        MessengerChatType.Group
      ),
      user: new MessengerUser(1234567890, '_USER_PSID_'),
      pageId: 1234567890,
      clientType: 'messenger',
    });
  });
});
