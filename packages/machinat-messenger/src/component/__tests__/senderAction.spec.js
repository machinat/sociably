import Machinat from 'machinat';

import { MESSENGER_NATIVE_TYPE } from '../../constant';
import { MarkSeen, TypingOn, TypingOff } from '../senderAction';
import renderHelper from './renderHelper';

const render = renderHelper(null);

describe.each([MarkSeen, TypingOn, TypingOff])('%p', Action => {
  it('is valid unit Component', () => {
    expect(typeof Action).toBe('function');
    expect(Action.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(Action.$$namespace).toBe('Messenger');
  });

  it('match snapshot', async () => {
    await expect(render(<Action />)).resolves.toMatchSnapshot();
  });
});
