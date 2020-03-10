import Machinat from '@machinat/core';
import { isNativeElement } from '@machinat/core/utils/isXxx';

import { QuickReply } from '../quickReply';
import { URIAction } from '../action';

const renderInner = (node, path) => node.type(node, renderInner, path);
const render = element => element.type(element, renderInner, '$');

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(isNativeElement(<QuickReply />)).toBe(true);
  expect(QuickReply.$$platform).toBe('line');
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
