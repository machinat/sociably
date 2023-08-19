import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { TextParam } from '../TextParam.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<TextParam>_</TextParam>)).toBe(true);
  expect(TextParam.$$platform).toBe('whatsapp');
  expect(TextParam.$$name).toBe('TextParam');
});

test('rendering value', async () => {
  await expect(renderPartElement(<TextParam>FOO</TextParam>)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <TextParam>
          FOO
        </TextParam>,
        "path": "$#p",
        "type": "part",
        "value": {
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
    [
      {
        "node": <TextParam>
          FOO 
          BAR
           
          <Sociably.Fragment>
            BAZ
          </Sociably.Fragment>
        </TextParam>,
        "path": "$#p",
        "type": "part",
        "value": {
          "text": "FOO BAR BAZ",
          "type": "text",
        },
      },
    ]
  `);
});
