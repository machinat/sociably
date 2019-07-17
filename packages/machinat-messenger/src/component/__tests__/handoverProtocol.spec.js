import Machinat from 'machinat';

import { MESSENGER_NATIVE_TYPE } from '../../constant';
import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';
import renderHelper from './renderHelper';

const render = renderHelper(null);

it.each([PassThreadControl, RequestThreadControl, TakeThreadContorl])(
  '%p is valid root Component',
  ThreadControl => {
    expect(typeof ThreadControl).toBe('function');
    expect(ThreadControl.$$native).toBe(MESSENGER_NATIVE_TYPE);
    expect(ThreadControl.$$namespace).toBe('Messenger');
  }
);

it.each(
  [
    <PassThreadControl appId="Legolas" metadata="you have my bow" />,
    <RequestThreadControl metadata="give me the ring" />,
    <TakeThreadContorl metadata="my precious" />,
  ].map(ele => [ele.type.name, ele])
)('%s match snapshot', async (_, threadControlElement) => {
  await expect(render(threadControlElement)).resolves.toMatchSnapshot();
});
