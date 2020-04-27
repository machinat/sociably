import LineUser from '../user';

test('preperties ok', () => {
  const user = new LineUser('_USER_ID_');

  expect(user.platform).toBe('line');
  expect(user.id).toBe('_USER_ID_');
  expect(user.uid).toMatchInlineSnapshot(`"line.*._USER_ID_"`);
});
