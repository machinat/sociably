import Machinat from 'machinat';

import { QuickReply } from '../quickReply';
import { URIAction } from '../action';

import { LINE_NATIVE_TYPE } from '../../constant';

import renderHelper from './renderHelper';

const renderInner = (node, path) => node.type(node, renderInner, path);
const render = renderHelper(renderInner);

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(QuickReply.$$native).toBe(LINE_NATIVE_TYPE);
  expect(QuickReply.$$getEntry).toBe(undefined);
});

it('renders match snapshot', async () => {
  const qr = (
    <QuickReply
      imageURL="https://..."
      action={<URIAction uri="https://..." label="foo" />}
    />
  );

  await expect(render(qr)).resolves.toEqual([
    {
      type: 'part',
      node: qr,
      value: {
        action: {
          label: 'foo',
          type: 'uri',
          uri: 'https://...',
        },
        imageUrl: 'https://...',
        type: 'action',
      },
      path: '$',
    },
  ]);
});
