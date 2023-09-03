import Sociably from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import { ListRow } from '../ListRow.js';
import { ListSection } from '../ListSection.js';
import { renderPartElement } from './utils.js';

it('is a valid Component', () => {
  expect(isNativeType(<ListSection>{[]}</ListSection>)).toBe(true);
  expect(ListSection.$$platform).toBe('whatsapp');
  expect(ListSection.$$name).toBe('ListSection');
});

test('rendering value', async () => {
  await expect(
    renderPartElement(
      <ListSection>
        <ListRow data="foo" title="FOO" />
        <ListRow data="bar" title="BAR" />
      </ListSection>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListSection>
          <ListRow
            data="foo"
            title="FOO"
          />
          <ListRow
            data="bar"
            title="BAR"
          />
        </ListSection>,
        "path": "$#p",
        "type": "part",
        "value": {
          "rows": [
            {
              "description": undefined,
              "id": "foo",
              "title": "FOO",
            },
            {
              "description": undefined,
              "id": "bar",
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
        <ListRow data="foo" title="FOO" />
      </ListSection>,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ListSection
          title="HELLO"
        >
          <ListRow
            data="foo"
            title="FOO"
          />
        </ListSection>,
        "path": "$#p",
        "type": "part",
        "value": {
          "rows": [
            {
              "description": undefined,
              "id": "foo",
              "title": "FOO",
            },
          ],
          "title": "HELLO",
        },
      },
    ]
  `);
});
