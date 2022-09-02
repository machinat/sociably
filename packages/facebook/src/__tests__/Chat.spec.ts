import FacebookChat from '../Chat';

test('from id', () => {
  const chat = new FacebookChat('12345', { id: '67890' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345.67890"`);

  expect(chat.id).toBe('67890');
  expect(chat.type).toBe('user');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "id": "67890",
      },
    }
  `);
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user_ref', () => {
  const chat = new FacebookChat('12345', { user_ref: '_USER_REF_' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._USER_REF_"`);

  expect(chat.id).toBe('_USER_REF_');
  expect(chat.type).toBe('user_ref');
  expect(chat.target).toEqual({ user_ref: '_USER_REF_' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "user_ref": "_USER_REF_",
      },
    }
  `);
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from post', () => {
  const chat = new FacebookChat('12345', { post_id: '_POST_ID_' });

  expect(chat.platform).toBe('facebook');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._POST_ID_"`);

  expect(chat.id).toBe('_POST_ID_');
  expect(chat.type).toBe('post');
  expect(chat.target).toEqual({ post_id: '_POST_ID_' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
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
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookChat"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._COMMENT_ID_"`);

  expect(chat.id).toBe('_COMMENT_ID_');
  expect(chat.type).toBe('comment');
  expect(chat.target).toEqual({ comment_id: '_COMMENT_ID_' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "comment_id": "_COMMENT_ID_",
      },
    }
  `);
  expect(FacebookChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});
