import { getLIFFAppId, getRichMenuId } from '../consumer';

it.each([[getLIFFAppId, 'liff'], [getRichMenuId, 'rich_menu']])(
  '%p generate asset consumer target object',
  (getId, resource) => {
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
  }
);
