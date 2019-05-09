import Machinat from 'machinat';

import { MESSENGER_NAITVE_TYPE } from '../../constant';
import { MarkSeen, TypingOn, TypingOff } from '../senderAction';
import renderHelper from './renderHelper';

const render = renderHelper(null);

describe.each([MarkSeen, TypingOn, TypingOff])('%p', Action => {
  it('is valid unit Component', () => {
    expect(typeof Action).toBe('function');
    expect(Action.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Action.$$entry).toBe('me/messages');
    expect(Action.$$namespace).toBe('Messenger');
  });

  it('match snapshot', () => {
    expect(render(<Action />)).toMatchSnapshot();
  });
});
