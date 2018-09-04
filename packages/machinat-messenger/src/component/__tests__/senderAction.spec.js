import Machinat from '../../../../machinat';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import { MarkSeen, TypingOn, TypingOff } from '../senderAction';
import renderHelper from './renderHelper';

const render = renderHelper(null);

describe('PassThreadControl', () => {
  test.each([MarkSeen, TypingOn, TypingOff])(
    'is valid root Component',
    Action => {
      expect(typeof Action).toBe('function');
      expect(Action.$$native).toBe(MESSENGER_NAITVE_TYPE);
      expect(Action.$$entry).toBe('me/messages');
      expect(Action.$$root).toBe(true);
    }
  );

  it('match snapshot', () => {
    expect(
      [<MarkSeen />, <TypingOn />, <TypingOff />].map(render)
    ).toMatchSnapshot();
  });
});
