import Machinat from '../../../../machinat';
import { MESSENGER_NAITVE_TYPE } from '../../symbol';
import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';
import renderHelper from './renderHelper';

const render = renderHelper(null);

describe('thread ccontrol Component', () => {
  test.each([
    [PassThreadControl, 'me/pass_thread_control'],
    [RequestThreadControl, 'me/request_thread_control'],
    [TakeThreadContorl, 'me/take_thread_control'],
  ])('is valid root Component', (ThreadControl, entry) => {
    expect(typeof ThreadControl).toBe('function');
    expect(ThreadControl.$$native).toBe(MESSENGER_NAITVE_TYPE);
    expect(ThreadControl.$$entry).toBe(entry);
    expect(ThreadControl.$$root).toBe(true);
  });

  it('match snapshot', () => {
    expect(
      [
        <PassThreadControl appId="Legolas" metadata="you have my bow" />,
        <RequestThreadControl metadata="give me the ring" />,
        <TakeThreadContorl metadata="my precious" />,
      ].map(render)
    ).toMatchSnapshot();
  });
});
