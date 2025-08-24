import FacebookPage from '../Page.js';

test('attributes', () => {
  const page = new FacebookPage('12345');

  expect(page.platform).toBe('facebook');
  expect(page.typeName()).toMatchInlineSnapshot(`"FacebookPage"`);
  expect(page.uid).toMatchInlineSnapshot(`"facebook.12345"`);

  expect(page.id).toBe('12345');

  expect(page.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
    }
  `);
  expect(FacebookPage.fromJSONValue(page.toJSONValue())).toStrictEqual(page);
});
