import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TextParam } from '../TextParam';
import { renderPartElement } from './utils';

it('is a valid Component', () => {
  expect(typeof TextParam).toBe('function');
  expect(isNativeType(<TextParam>_</TextParam>)).toBe(true);
  expect(TextParam.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(renderPartElement(<TextParam>FOO</TextParam>)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TextParam>
                FOO
              </TextParam>,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "text": "FOO",
                "type": "text",
              },
            },
          ]
        `);
  await expect(
    renderPartElement(
      <TextParam>
        FOO {'BAR'} <>BAZ</>
      </TextParam>
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <TextParam>
                FOO 
                BAR
                 
                <Sociably.Fragment>
                  BAZ
                </Sociably.Fragment>
              </TextParam>,
              "path": "$#p",
              "type": "part",
              "value": Object {
                "text": "FOO BAR BAZ",
                "type": "text",
              },
            },
          ]
        `);
});
