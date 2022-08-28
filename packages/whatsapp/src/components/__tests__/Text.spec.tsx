import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { Text } from '../Text';
import { renderUnitElement } from './utils';

it('is a valid Component', () => {
  expect(typeof Text).toBe('function');
  expect(isNativeType(<Text> </Text>)).toBe(true);
  expect(Text.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderUnitElement(<Text>FOO</Text>)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text>
                FOO
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "text": Object {
                    "body": "FOO",
                    "preview_url": undefined,
                  },
                  "type": "text",
                },
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <Text>
        FOO {'BAR'} <>BAZ</>
      </Text>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text>
                FOO 
                BAR
                 
                <Sociably.Fragment>
                  BAZ
                </Sociably.Fragment>
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": undefined,
                  "text": Object {
                    "body": "FOO BAR BAZ",
                    "preview_url": undefined,
                  },
                  "type": "text",
                },
              },
            },
          ]
        `);
  await expect(
    renderUnitElement(
      <Text previewUrl replyTo="REPLY_TO_MESSAGE_ID">
        FOO
      </Text>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <Text
                previewUrl={true}
                replyTo="REPLY_TO_MESSAGE_ID"
              >
                FOO
              </Text>,
              "path": "$",
              "type": "unit",
              "value": Object {
                "message": Object {
                  "context": Object {
                    "message_id": "REPLY_TO_MESSAGE_ID",
                  },
                  "text": Object {
                    "body": "FOO",
                    "preview_url": true,
                  },
                  "type": "text",
                },
              },
            },
          ]
        `);
});

test('throw if non textual children received', async () => {
  await expect(
    renderUnitElement(
      <Text>
        <Text replyTo="REPLY_TO_MESSAGE_ID">BOO</Text>
      </Text>
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"\\"children\\" prop should contain only texual content"`
  );
});
