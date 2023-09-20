import InstagramAgent from '../Agent.js';

test('attributes', () => {
  const agent = new InstagramAgent('12345', 'jojodoe123');

  expect(agent.platform).toBe('instagram');
  expect(agent.typeName()).toMatchInlineSnapshot(`"IgAgent"`);
  expect(agent.uid).toMatchInlineSnapshot(`"ig.12345"`);

  expect(agent.id).toBe('12345');
  expect(agent.username).toBe('jojodoe123');

  expect(agent.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "12345",
      "platform": "instagram",
    }
  `);
  expect(agent.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "12345",
    }
  `);
  expect(InstagramAgent.fromJSONValue(agent.toJSONValue())).toStrictEqual(
    new InstagramAgent('12345'),
  );
});
