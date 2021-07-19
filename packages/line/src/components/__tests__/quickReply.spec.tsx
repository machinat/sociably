import Machinat from '@machinat/core';
import Renderer from '@machinat/core/renderer';
import { isNativeType } from '@machinat/core/utils';

import { QuickReply } from '../quickReply';
import { UriAction } from '../action';

it('is valid native component', () => {
  expect(typeof QuickReply).toBe('function');

  expect(isNativeType(<QuickReply>{null}</QuickReply>)).toBe(true);
  expect(QuickReply.$$platform).toBe('line');
});

it('renders match snapshot', async () => {
  let rendered;
  const renderer = new Renderer('line', async (_, __, render) => {
    rendered = await render(
      <QuickReply imageUrl="https://...">
        <UriAction uri="https://..." label="foo" />
      </QuickReply>,

      null as never
    );
    return null;
  });

  await renderer.render(<foo />, null as never);

  expect(rendered).toMatchInlineSnapshot(`
    Array [
      Object {
        "node": <QuickReply
          imageUrl="https://..."
        >
          <UriAction
            label="foo"
            uri="https://..."
          />
        </QuickReply>,
        "path": "$#foo",
        "type": "part",
        "value": Object {
          "action": Object {
            "label": "foo",
            "type": "uri",
            "uri": "https://...",
          },
          "imageUrl": "https://...",
          "type": "action",
        },
      },
    ]
  `);
});
