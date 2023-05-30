import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow.js';
import { ListSection } from '../ListSection.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(typeof ListSection).toBe('function');
  expect(isNativeType(<ListSection>{[]}</ListSection>)).toBe(true);
  expect(ListSection.$$platform).toBe('whatsapp');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <ListSection>
        <ListRow id="0" title="FOO" />
        <ListRow id="1" title="BAR" />
      </ListSection>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListSection>
          <ListRow
            id="0"
            title="FOO"
          />
          <ListRow
            id="1"
            title="BAR"
          />
        </ListSection>,
        "path": "$#p",
        "type": "part",
        "value": {
          "rows": [
            {
              "description": undefined,
              "id": "0",
              "title": "FOO",
            },
            {
              "description": undefined,
              "id": "1",
              "title": "BAR",
            },
          ],
          "title": undefined,
        },
      },
    ]
  `);
  await expect(
    renderPartElement(
      <ListSection title="HELLO">
        <ListRow id="0" title="FOO" />
      </ListSection>
    )
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListSection
          title="HELLO"
        >
          <ListRow
            id="0"
            title="FOO"
          />
        </ListSection>,
        "path": "$#p",
        "type": "part",
        "value": {
          "rows": [
            {
              "description": undefined,
              "id": "0",
              "title": "FOO",
            },
          ],
          "title": "HELLO",
        },
      },
    ]
  `);
});
