import Machinat from '../../../../machinat';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import {
  QuickReply,
  PhoneQuickReply,
  EmailQuickReply,
  LocationQuickReply,
} from '../quickReply';
import renderHelper from './renderHelper';

const render = renderHelper(null);

describe('QuickReply', () => {
  test.each([QuickReply, PhoneQuickReply, EmailQuickReply, LocationQuickReply])(
    'is valid Component',
    Reply => {
      expect(typeof Reply).toBe('function');
      expect(Reply.$$native).toBe(MESSENGER_NAITVE_TYPE);
      expect(Reply.$$entry).toBe(undefined);
      expect(Reply.$$root).toBe(undefined);
    }
  );

  it('match snapshot', () => {
    expect(
      [
        <QuickReply title="i want a pie" payload="🥧" />,
        <QuickReply
          title="a piece of cake"
          payload="🍰"
          imageUrl="http://cake.it"
        />,
        <PhoneQuickReply />,
        <EmailQuickReply />,
        <LocationQuickReply />,
      ].map(render)
    ).toMatchSnapshot();
  });
});
