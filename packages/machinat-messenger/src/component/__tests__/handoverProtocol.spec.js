import Machinat from 'machinat';

import { MESSENGER_NAITVE_TYPE } from '../../constant';
import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';
import renderHelper from './renderHelper';

const render = renderHelper(null);

it.each([
  [PassThreadControl, 'me/pass_thread_control'],
  [RequestThreadControl, 'me/request_thread_control'],
  [TakeThreadContorl, 'me/take_thread_control'],
])('%p is valid root Component', (ThreadControl, entry) => {
  expect(typeof ThreadControl).toBe('function');
  expect(ThreadControl.$$native).toBe(MESSENGER_NAITVE_TYPE);
  expect(ThreadControl.$$entry).toBe(entry);
  expect(ThreadControl.$$namespace).toBe('Messenger');
});

it.each([
  <PassThreadControl appId="Legolas" metadata="you have my bow" />,
  <RequestThreadControl metadata="give me the ring" />,
  <TakeThreadContorl metadata="my precious" />,
])('match snapshot', ThreadControl => {
  expect(render(ThreadControl)).toMatchSnapshot();
});
