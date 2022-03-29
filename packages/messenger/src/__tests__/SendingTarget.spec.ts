import SendingTarget from '../SendingTarget';

test('from id', () => {
  const chat = new SendingTarget('12345', { id: '67890' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"MessengerSendingTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"messenger.12345.id.67890"`);

  expect(chat.identifier).toBe('67890');
  expect(chat.type).toBe('id');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "id": "67890",
      },
    }
  `);
  expect(SendingTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user_ref', () => {
  const chat = new SendingTarget('12345', { user_ref: '_USER_REF_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"MessengerSendingTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger.12345.user_ref._USER_REF_"`
  );

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
  expect(SendingTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from phone_number', () => {
  const chat = new SendingTarget('12345', {
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"MessengerSendingTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger.12345.phone_number.nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );

  expect(chat.identifier).toBe('nRn5C+EX4/vdk02aEWYs2zV5sHM=');
  expect(chat.type).toBe('phone_number');
  expect(chat.target).toEqual({
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "name": Object {
          "first_name": "jojo",
          "last_name": "doe",
        },
        "phone_number": "+88888888888",
      },
    }
  `);
  expect(SendingTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from post_id', () => {
  const chat = new SendingTarget('12345', { post_id: '_POST_ID_' });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"MessengerSendingTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(`"messenger.12345.post_id._POST_ID_"`);

  expect(chat.identifier).toBe('_POST_ID_');
  expect(chat.type).toBe('post_id');
  expect(chat.target).toEqual({ post_id: '_POST_ID_' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "post_id": "_POST_ID_",
      },
    }
  `);
  expect(SendingTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from comment_id', () => {
  const chat = new SendingTarget('12345', {
    comment_id: '_COMMENT_ID_',
  });

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toMatchInlineSnapshot(`"MessengerSendingTarget"`);
  expect(chat.uid).toMatchInlineSnapshot(
    `"messenger.12345.comment_id._COMMENT_ID_"`
  );

  expect(chat.identifier).toBe('_COMMENT_ID_');
  expect(chat.type).toBe('comment_id');
  expect(chat.target).toEqual({ comment_id: '_COMMENT_ID_' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "page": "12345",
      "target": Object {
        "comment_id": "_COMMENT_ID_",
      },
    }
  `);
  expect(SendingTarget.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});
