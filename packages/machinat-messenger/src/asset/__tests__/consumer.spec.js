import {
  getAttachmentId,
  getCustomLabelId,
  getMessageCreativeId,
  getPersonaId,
} from '../consumer';

it.each([
  [getAttachmentId, 'attachment'],
  [getCustomLabelId, 'custom_label'],
  [getMessageCreativeId, 'message_creative'],
  [getPersonaId, 'persona'],
])('%p generate asset consumer target object', (getId, resource) => {
  expect(getId('foo')).toEqual({
    tag: 'foo',
    resource,
    invariant: false,
  });

  expect(getId('foo', { invariant: false })).toEqual({
    tag: 'foo',
    resource,
    invariant: false,
  });

  expect(getId('foo', { invariant: true })).toEqual({
    tag: 'foo',
    resource,
    invariant: true,
  });
});
