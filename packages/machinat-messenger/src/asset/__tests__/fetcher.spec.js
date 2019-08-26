import {
  attachmentId,
  customLabelId,
  messageCreativeId,
  personaId,
} from '../fetcher';

it.each([
  [attachmentId, 'attachment'],
  [customLabelId, 'custom_label'],
  [messageCreativeId, 'message_creative'],
  [personaId, 'persona'],
])('%p generate asset consumer target object', (getId, resource) => {
  expect(getId('foo')).toEqual({
    name: 'foo',
    resource,
    invariant: false,
  });

  expect(getId('foo', { invariant: false })).toEqual({
    name: 'foo',
    resource,
    invariant: false,
  });

  expect(getId('foo', { invariant: true })).toEqual({
    name: 'foo',
    resource,
    invariant: true,
  });
});
