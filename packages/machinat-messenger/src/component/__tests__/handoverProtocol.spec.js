import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import {
  PassThreadControl,
  RequestThreadControl,
  TakeThreadContorl,
} from '../handoverProtocol';

const renderHelper = element => element.type(element, null, '$');

it.each([PassThreadControl, RequestThreadControl, TakeThreadContorl])(
  '%p is valid root Component',
  ThreadControl => {
    expect(typeof ThreadControl).toBe('function');
    expect(isNativeElement(<ThreadControl />)).toBe(true);
    expect(ThreadControl.$$platform).toBe('messenger');
  }
);

test('PassThreadControl', () => {
  expect(
    renderHelper(
      <PassThreadControl appId="Legolas" metadata="you have my bow" />
    )
  ).toMatchInlineSnapshot(`Promise {}`);
});

test('RequestThreadControl', () => {
  expect(
    renderHelper(<RequestThreadControl metadata="give me the ring" />)
  ).toMatchInlineSnapshot(`Promise {}`);
});

test('TakeThreadContorl', () => {
  expect(
    renderHelper(<TakeThreadContorl metadata="my precious" />)
  ).toMatchInlineSnapshot(`Promise {}`);
});
