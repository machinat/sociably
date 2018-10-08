/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { GET_API_PATH } from '../symbol';

export const LinkRichMenu = ({ id: richMenuId }) => ({
  // eslint-disable-next-line consistent-return
  [GET_API_PATH]: thread => {
    const { type, userId } = thread;

    invariant(
      type === 'user',
      '<RichMenu /> should be only used in a user thread'
    );

    return `user/${userId}/richmenu/${richMenuId}`;
  },
});
