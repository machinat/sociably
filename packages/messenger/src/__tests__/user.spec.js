import MessengerUser from '../user';

test('properties ok', () => {
  const user = new MessengerUser('_PAGE_ID_', 'foo');

  expect(user.platform).toBe('messenger');
  expect(user.pageId).toBe('_PAGE_ID_');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"messenger._PAGE_ID_.foo"`);
});
