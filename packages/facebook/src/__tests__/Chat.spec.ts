import FacebookChat from '../Chat.js';

test('from id', () => {
  const chat = new FacebookChat('12345', { id: '67890' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FbChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"fb.12345.67890"`);

  expect(chat.id).toBe('67890');
  expect(chat.type).toBe('user');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "67890",
      "platform": "facebook",
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
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user_ref', () => {
  const chat = new FacebookChat('12345', { user_ref: '_USER_REF_' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FbChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"fb.12345._USER_REF_"`);

  expect(chat.id).toBe('_USER_REF_');
  expect(chat.type).toBe('user_ref');
  expect(chat.target).toEqual({ user_ref: '_USER_REF_' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_USER_REF_",
      "platform": "facebook",
      "scopeId": "12345",
    }
  `);
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
      "target": {
        "user_ref": "_USER_REF_",
      },
    }
  `);
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from post', () => {
  const chat = new FacebookChat('12345', { post_id: '_POST_ID_' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FbChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"fb.12345._POST_ID_"`);

  expect(chat.id).toBe('_POST_ID_');
  expect(chat.type).toBe('post');
  expect(chat.target).toEqual({ post_id: '_POST_ID_' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_POST_ID_",
      "platform": "facebook",
      "scopeId": "12345",
    }
  `);
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "page": "12345",
      "target": {
        "post_id": "_POST_ID_",
      },
    }
  `);
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from comment', () => {
  const chat = new FacebookChat('12345', {
    comment_id: '_COMMENT_ID_',
  });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FbChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"fb.12345._COMMENT_ID_"`);

  expect(chat.id).toBe('_COMMENT_ID_');
  expect(chat.type).toBe('comment');
  expect(chat.target).toEqual({ comment_id: '_COMMENT_ID_' });

  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_COMMENT_ID_",
      "platform": "facebook",
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
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});
