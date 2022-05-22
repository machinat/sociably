import SendTarget from '../SendTarget';

test('from id', () => {
  const chat = new SendTarget('12345', { id: '67890' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookSendTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345.67890"`);

  expect(chat.identifier).toBe('67890');
  expect(chat.type).toBe('psid');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "id": "67890",
      },
    }
  `);
  expect(SendTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user_ref', () => {
  const chat = new SendTarget('12345', { user_ref: '_USER_REF_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookSendTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._USER_REF_"`);

  expect(chat.identifier).toBe('_USER_REF_');
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
  expect(SendTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from post', () => {
  const chat = new SendTarget('12345', { post_id: '_POST_ID_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookSendTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._POST_ID_"`);

  expect(chat.identifier).toBe('_POST_ID_');
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
  expect(SendTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from comment', () => {
  const chat = new SendTarget('12345', {
    comment_id: '_COMMENT_ID_',
  });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"FacebookSendTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345._COMMENT_ID_"`);

  expect(chat.identifier).toBe('_COMMENT_ID_');
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
  expect(SendTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});
