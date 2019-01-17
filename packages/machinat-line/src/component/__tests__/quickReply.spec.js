import Machinat from 'machinat';

import { QuickReply } from '../quickReply';
import { URIAction } from '../action';

import { LINE_NAITVE_TYPE } from '../../symbol';

import render from './render';

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(QuickReply.$$native).toBe(LINE_NAITVE_TYPE);
  expect(QuickReply.$$entry).toBe(undefined);
  expect(QuickReply.$$unit).toBe(false);
});

it('renders match snapshot', () => {
  expect(
    render(
      <QuickReply
        imageURL="https://..."
        action={<URIAction uri="https://..." label="foo" />}
      />
    ).map(act => act.value)
  ).toMatchSnapshot();
});
