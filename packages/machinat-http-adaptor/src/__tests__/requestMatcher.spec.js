import moxy from 'moxy';
import { IncomingMessage } from 'http';
import { path, pathSuffixBy, pathMatch } from '../requestMatcher';

const req = moxy(new IncomingMessage());

beforeEach(() => {
  req.mock.reset();
});

describe('path()', () => {
  it('match same path and return true', () => {
    const matcher = path('/foo');

    [
      '/foo',
      '/foo?x=y&a=b',
      'http://machinat.io/foo',
      'https://machinat.io/foo#bar',
      'https://machinat.io/foo?c=d&y=z',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);
      expect(matcher(req)).toBe(true);
    });
  });

  it('return false if path not exactly match', () => {
    const matcher = path('/foo');

    [
      '/',
      '/foo/',
      '/bar',
      '/foo/baz',
      '/bar/foo',
      'http://machinat.io',
      'https://machinat.io/baz/foo',
      'https://machinat.io/foo/baz?c=d&y=z',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);

      expect(matcher(req)).toBe(false);
    });
  });
});

describe('pathSuffixBy()', () => {
  it('match with specific suffix', () => {
    const matcher = pathSuffixBy('/foo');

    [
      '/foo',
      '/foo?x=y&a=b',
      '/bar/foo',
      '/baz/bar/foo#baz',
      '/bar/foo?x=y&a=b',
      'http://machinat.io/foo',
      'https://machinat.io/baz/foo#bar',
      'https://machinat.io/bar/baz/foo?c=d&y=z',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);

      expect(matcher(req)).toBe(true);
    });
  });

  it('return false if path not suffixed by specific path', () => {
    const matcher = pathSuffixBy('/foo');

    [
      '/',
      '/foo/',
      '/bar',
      '/foo/baz',
      '/bar/foo/baz',
      'http://machinat.io',
      'https://machinat.io/foo/baz#bar',
      'https://machinat.io/foo/baz?c=d&y=z',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);

      expect(matcher(req)).toBe(false);
    });
  });
});

describe('pathMatch()', () => {
  it('match with given regex pattern', () => {
    const matcher = pathMatch(/\/foo/);

    [
      '/foo',
      '/fooooooo',
      '/foo/',
      '/foo?x=y&a=b',
      '/foo/bar',
      '/bar/foo/baz',
      '/baz/foo/#bar',
      '/baz/foo/bar/?x=y&a=b',
      'http://machinat.io/foo',
      'https://machinat.io/foo/baz#bar',
      'https://machinat.io/bar/foo/baz?c=d&y=z',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);

      expect(matcher(req)).toBe(true);
    });
  });

  it('return false if path not suffixed by specific path', () => {
    const matcher = pathMatch(/\/foo/);

    [
      '/',
      '/bar',
      '/bar#foo',
      'http://machinat.io',
      'https://machinat.io/baz#bar',
      'https://machinat.io/bar/baz?c=d&foo=true',
    ].forEach(url => {
      req.mock.getter('url').fakeReturnValue(url);

      expect(matcher(req)).toBe(false);
    });
  });
});
