import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import { QuickReply } from '../QuickReply';

const render = (element) =>
  new Promise((resolve) => {
    const renderer = new Renderer('twitter', async (n, p, renderPart) => {
      resolve(renderPart(element, ''));
      return null;
    });
    renderer.render(<p />, null, null);
  });

it('is a valid Component', () => {
  expect(typeof QuickReply).toBe('function');
  expect(isNativeType(<QuickReply label="Hi" />)).toBe(true);
  expect(QuickReply.$$platform).toBe('twitter');
});

test('rendering', async () => {
  await expect(render(<QuickReply label="Hi" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                label="Hi"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": undefined,
                "label": "Hi",
                "metadata": undefined,
              },
            },
          ]
        `);

  await expect(render(<QuickReply label="Hi" description="I'm friendly" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                description="I'm friendly"
                label="Hi"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": "I'm friendly",
                "label": "Hi",
                "metadata": undefined,
              },
            },
          ]
        `);

  await expect(
    render(
      <QuickReply
        label="Hi"
        description="I'm a friend"
        metadata="friendly handshake"
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <QuickReply
                description="I'm a friend"
                label="Hi"
                metadata="friendly handshake"
              />,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "description": "I'm a friend",
                "label": "Hi",
                "metadata": "friendly handshake",
              },
            },
          ]
        `);
});
