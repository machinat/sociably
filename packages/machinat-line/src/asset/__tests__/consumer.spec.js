import { liffAppId, richMenuId } from '../fetcher';

it.each([[liffAppId, 'liff'], [richMenuId, 'rich_menu']])(
  '%p generate asset consumer target object',
  (getId, resource) => {
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
  }
);
