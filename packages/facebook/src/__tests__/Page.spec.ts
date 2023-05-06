import FacebookPage from '../Page';

test('attributes', () => {
  const page = new FacebookPage('12345');

  expect(page.platform).toBe('facebook');
  expect(page.typeName()).toMatchInlineSnapshot(`"FbPage"`);
  expect(page.uid).toMatchInlineSnapshot(`"fb.12345"`);

  expect(page.id).toBe('12345');

  expect(page.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "$$typeof": Array [
        "channel",
      ],
      "id": "12345",
      "platform": "facebook",
    }
  `);
  expect(page.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
    }
  `);
  expect(FacebookPage.fromJSONValue(page.toJSONValue())).toStrictEqual(page);
});
