import InstagramPage from '../Page.js';

test('attributes', () => {
  const page = new InstagramPage('12345', 'jojodoe123');

  expect(page.platform).toBe('instagram');
  expect(page.typeName()).toMatchInlineSnapshot(`"IgPage"`);
  expect(page.uid).toMatchInlineSnapshot(`"ig.12345"`);

  expect(page.id).toBe('12345');
  expect(page.username).toBe('jojodoe123');

  expect(page.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "channel",
      ],
      "id": "12345",
      "platform": "instagram",
    }
  `);
  expect(page.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
    }
  `);
  expect(InstagramPage.fromJSONValue(page.toJSONValue())).toStrictEqual(
    new InstagramPage('12345')
  );
});
