import Machinat from 'machinat';

import { MESSENGER_NAITVE_TYPE } from '../../constant';
import {
  QuickReply,
  PhoneQuickReply,
  EmailQuickReply,
  LocationQuickReply,
} from '../quickReply';
import renderHelper from './renderHelper';

const render = renderHelper(null);

it.each([QuickReply, PhoneQuickReply, EmailQuickReply, LocationQuickReply])(
  '%p is valid Component',
  Reply => {
    expect(typeof Reply).toBe('function');
    expect(Reply.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(Reply.$$entry).toBe(undefined);
    expect(Reply.$$namespace).toBe('Messenger');
  }
);

it.each(
  [
    <QuickReply title="i want a pie" payload="🥧" />,
    <QuickReply
      title="a piece of cake"
      payload="🍰"
      imageURL="http://cake.it"
    />,
    <PhoneQuickReply />,
    <EmailQuickReply />,
    <LocationQuickReply />,
  ].map(ele => [ele.type.name, ele])
)('%p match snapshot', async (_, element) => {
  await expect(render(element)).resolves.toMatchSnapshot();
});
