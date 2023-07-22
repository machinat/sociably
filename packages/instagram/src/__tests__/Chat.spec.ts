import InstagramChat from '../Chat.js';

test('from id', () => {
  const chat = new InstagramChat('12345', { id: '67890' });

  expect(chat.platform).toBe('instagram');
  expect(chat.typeName()).toMatchInlineSnapshot(`"IgChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"ig.12345.67890"`);

  expect(chat.id).toBe('67890');
  expect(chat.type).toBe('user');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "67890",
      "platform": "instagram",
      "scopeId": "12345",
    }
  `);
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
      "target": {
        "id": "67890",
      },
    }
  `);
  expect(InstagramChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from comment', () => {
  const chat = new InstagramChat('12345', {
    comment_id: '_COMMENT_ID_',
  });

  expect(chat.platform).toBe('instagram');
  expect(chat.typeName()).toMatchInlineSnapshot(`"IgChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"ig.12345._COMMENT_ID_"`);

  expect(chat.id).toBe('_COMMENT_ID_');
  expect(chat.type).toBe('comment');
  expect(chat.target).toEqual({ comment_id: '_COMMENT_ID_' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_COMMENT_ID_",
      "platform": "instagram",
      "scopeId": "12345",
    }
  `);
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
      "target": {
        "comment_id": "_COMMENT_ID_",
      },
    }
  `);
  expect(InstagramChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});
