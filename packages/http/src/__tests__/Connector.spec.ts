import { Server } from 'http';
import { EventEmitter } from 'events';
import moxy from '@moxyjs/moxy';
import { HttpConnector } from '../Connector.js';

const FakeServer = class FakeServer extends EventEmitter {
  // eslint-disable-next-line
  listen(...args) {
    for (let i = args.length - 1; i >= 0; i -= 1) {
      if (typeof args[i] === 'function') args[i]();
    }
  }
} as typeof Server;

const createRes = () =>
  moxy({
    finished: false,
    statusCode: 200,
    writeHead(code) {
      this.statusCode = code;
    },
    end(...args) {
      this.finished = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        if (typeof args[i] === 'function') args[i]();
      }
    },
  });

it('throw if entryUrl is not a directory', () => {
  expect(
    () =>
      new HttpConnector({
        entryUrl: 'https://sociably.io/foo',
      }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"entryUrl must be a directory which ends with "/""`,
  );
  expect(
    () =>
      new HttpConnector({
        entryUrl: 'https://sociably.io/foo/bar.baz',
      }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"entryUrl must be a directory which ends with "/""`,
  );
});

test('.getServerUrl(subpath) return the url of the server', () => {
  let connector = new HttpConnector({
    entryUrl: 'https://sociably.io',
  });
  expect(connector.getServerUrl()).toBe('https://sociably.io/');
  expect(connector.getServerUrl('foo')).toBe('https://sociably.io/foo');
  expect(connector.getServerUrl('foo/bar')).toBe('https://sociably.io/foo/bar');

  connector = new HttpConnector({
    entryUrl: 'https://sociably.io/foo/',
  });
  expect(connector.getServerUrl()).toBe('https://sociably.io/foo/');
  expect(connector.getServerUrl('bar')).toBe('https://sociably.io/foo/bar');
  expect(connector.getServerUrl('bar/baz')).toBe(
    'https://sociably.io/foo/bar/baz',
  );
});

describe('handling requests', () => {
  test('register only root path', () => {
    const handler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      requestRoutes: [{ path: '.', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function),
    );

    expect(server.on).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));

    const req = moxy({ url: '/' });
    const res = createRes();
    server.emit('request', req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, res, {
      originalPath: '/',
      basePath: '/',
      matchedPath: '.',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('request', fooReq, res);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: '.',
      trailingPath: 'foo',
    });

    expect(res.end).not.toHaveBeenCalled();
  });

  test('register multiple routes', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      requestRoutes: [
        { path: 'foo', handler: fooHandler },
        { path: 'bar/baz', handler: barHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledTimes(1);

    let res = createRes();

    const fooReq = moxy({ url: '/foo' });
    server.emit('request', fooReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: '',
    });
    expect(barHandler).not.toHaveBeenCalled();

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('request', fooBarReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const barReq = moxy({ url: '/bar/baz' });
    server.emit('request', barReq, res);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/bar/baz',
      basePath: '/',
      matchedPath: 'bar/baz',
      trailingPath: '',
    });

    const barBaeReq = moxy({ url: '/bar/baz/bae' });
    server.emit('request', barBaeReq, res);
    expect(barHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledWith(barBaeReq, res, {
      originalPath: '/bar/baz/bae',
      basePath: '/',
      matchedPath: 'bar/baz',
      trailingPath: 'bae',
    });

    server.emit('request', moxy({ url: '/' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    res = createRes();
    server.emit('request', moxy({ url: '/baz' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledTimes(2);
  });

  test('register with default route', () => {
    const fooHandler = moxy();
    const defaultHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      requestRoutes: [
        { path: 'foo', handler: fooHandler },
        { default: true, handler: defaultHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function),
    );

    expect(server.on).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));

    const fooReq = moxy({ url: '/foo' });
    const res = createRes();
    server.emit('request', fooReq, res);

    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('request', fooBarReq, res);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const rootReq = moxy({ url: '/' });
    server.emit('request', rootReq, res);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(defaultHandler).toHaveBeenCalledWith(rootReq, res, {
      originalPath: '/',
      basePath: '/',
      matchedPath: undefined,
      trailingPath: '',
    });

    const barReq = moxy({ url: '/bar' });
    server.emit('request', barReq, res);

    expect(defaultHandler).toHaveBeenCalledTimes(2);
    expect(defaultHandler).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/bar',
      basePath: '/',
      matchedPath: undefined,
      trailingPath: 'bar',
    });

    expect(res.end).not.toHaveBeenCalled();
  });

  test('register with base path', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io/hello/world/',
      requestRoutes: [
        { path: 'foo', handler: fooHandler },
        { path: 'bar/baz', handler: barHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledTimes(1);

    let res = createRes();

    const fooReq = moxy({ url: '/hello/world/foo' });
    server.emit('request', fooReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/hello/world/foo',
      basePath: '/hello/world/',
      matchedPath: 'foo',
      trailingPath: '',
    });
    expect(barHandler).not.toHaveBeenCalled();

    const fooBarReq = moxy({ url: '/hello/world/foo/bar' });
    server.emit('request', fooBarReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/hello/world/foo/bar',
      basePath: '/hello/world/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const barReq = moxy({ url: '/hello/world/bar/baz' });
    server.emit('request', barReq, res);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/hello/world/bar/baz',
      basePath: '/hello/world/',
      matchedPath: 'bar/baz',
      trailingPath: '',
    });

    const barBaeReq = moxy({ url: '/hello/world/bar/baz/bae' });
    server.emit('request', barBaeReq, res);
    expect(barHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledWith(barBaeReq, res, {
      originalPath: '/hello/world/bar/baz/bae',
      basePath: '/hello/world/',
      matchedPath: 'bar/baz',
      trailingPath: 'bae',
    });

    server.emit('request', moxy({ url: '/' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    res = createRes();
    server.emit('request', moxy({ url: '/foo' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledTimes(2);
  });

  test('register no route', () => {
    const connector = new HttpConnector({ entryUrl: 'https://sociably.io' });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledTimes(1);

    const res = createRes();
    server.emit('request', moxy({ url: '/' }), res);

    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);
  });

  it('throw if registered routes conflict', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          requestRoutes: [
            { name: 'root', path: '.', handler: moxy() },
            { name: 'foo', path: './foo', handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route [foo] "./foo" is conflicted with route [root] ".""`,
    );
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          requestRoutes: [
            { name: 'bar', path: './bar', handler: moxy() },
            { path: './bar/baz', handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route "./bar/baz" is conflicted with route [bar] "./bar""`,
    );
  });

  it('throw if request route is not relative under entryUrl', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          requestRoutes: [{ name: 'foo', path: '/foo', handler: moxy() }],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route path should be a relative path"`,
    );
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          requestRoutes: [{ name: 'foo', path: '../foo', handler: moxy() }],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route path should be under entryUrl"`,
    );
  });

  it('throw if mulitple default route received', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          requestRoutes: [
            { name: 'foo', path: 'foo', handler: moxy() },
            { name: 'bar', default: true, handler: moxy() },
            { name: 'baz', default: true, handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple default request routes received: bar, baz"`,
    );
  });
});

describe('handling upgrade', () => {
  const socket = moxy({
    write() {},
    destroy() {},
  });

  const head = Buffer.from('');

  beforeEach(() => {
    socket.mock.clear();
  });

  test('register only root path', () => {
    const handler = moxy();
    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      upgradeRoutes: [{ path: '.', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function),
    );

    expect(server.on).toHaveBeenCalledTimes(2);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));
    expect(server.on).toHaveBeenCalledWith('upgrade', expect.any(Function));

    const req = moxy({ url: '/' });
    server.emit('upgrade', req, socket, head);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, socket, head, {
      originalPath: '/',
      basePath: '/',
      matchedPath: '.',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: '.',
      trailingPath: 'foo',
    });

    expect(socket.write).not.toHaveBeenCalled();
  });

  test('register multiple routes', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      upgradeRoutes: [
        { path: 'foo', handler: fooHandler },
        { path: 'bar/baz', handler: barHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });
    expect(server.listen).toHaveBeenCalledTimes(1);

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);

    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: '',
    });
    expect(barHandler).not.toHaveBeenCalled();

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const barReq = moxy({ url: '/bar/baz' });
    server.emit('upgrade', barReq, socket, head);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/bar/baz',
      basePath: '/',
      matchedPath: 'bar/baz',
      trailingPath: '',
    });

    const barBaeReq = moxy({ url: '/bar/baz/bae' });
    server.emit('upgrade', barBaeReq, socket, head);
    expect(barHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledWith(barBaeReq, socket, head, {
      originalPath: '/bar/baz/bae',
      basePath: '/',
      matchedPath: 'bar/baz',
      trailingPath: 'bae',
    });

    server.emit('upgrade', moxy({ url: '/' }), socket, head);
    expect(socket.write).toHaveBeenCalledTimes(1);
    expect(socket.destroy).toHaveBeenCalledTimes(1);
    expect(socket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      "HTTP/1.1 404 Not Found
      Connection: close
      Content-Type: text/html
      Content-Length: 9

      Not Found"
    `);

    server.emit('upgrade', moxy({ url: '/baz' }), socket, head);
    expect(socket.write).toHaveBeenCalledTimes(2);
    expect(socket.destroy).toHaveBeenCalledTimes(2);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledTimes(2);
  });

  test('register with default route', () => {
    const fooHandler = moxy();
    const defaultHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io',
      upgradeRoutes: [
        { path: 'foo', handler: fooHandler },
        { default: true, handler: defaultHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);

    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      basePath: '/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const rootReq = moxy({ url: '/' });
    server.emit('upgrade', rootReq, socket, head);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(defaultHandler).toHaveBeenCalledWith(rootReq, socket, head, {
      originalPath: '/',
      basePath: '/',
      matchedPath: undefined,
      trailingPath: '',
    });

    const barReq = moxy({ url: '/bar' });
    server.emit('upgrade', barReq, socket, head);

    expect(defaultHandler).toHaveBeenCalledTimes(2);
    expect(defaultHandler).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/bar',
      basePath: '/',
      matchedPath: undefined,
      trailingPath: 'bar',
    });

    expect(socket.write).not.toHaveBeenCalled();
  });

  test('register with base path', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      entryUrl: 'https://sociably.io/hello/world/',
      upgradeRoutes: [
        { path: 'foo', handler: fooHandler },
        { path: 'bar/baz', handler: barHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });
    expect(server.listen).toHaveBeenCalledTimes(1);

    const fooReq = moxy({ url: '/hello/world/foo' });
    server.emit('upgrade', fooReq, socket, head);
    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/hello/world/foo',
      basePath: '/hello/world/',
      matchedPath: 'foo',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/hello/world/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/hello/world/foo/bar',
      basePath: '/hello/world/',
      matchedPath: 'foo',
      trailingPath: 'bar',
    });

    const barReq = moxy({ url: '/hello/world/bar/baz' });
    server.emit('upgrade', barReq, socket, head);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/hello/world/bar/baz',
      basePath: '/hello/world/',
      matchedPath: 'bar/baz',
      trailingPath: '',
    });

    const barBaeReq = moxy({ url: '/hello/world/bar/baz/bae' });
    server.emit('upgrade', barBaeReq, socket, head);
    expect(barHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledWith(barBaeReq, socket, head, {
      originalPath: '/hello/world/bar/baz/bae',
      basePath: '/hello/world/',
      matchedPath: 'bar/baz',
      trailingPath: 'bae',
    });

    server.emit('upgrade', moxy({ url: '/' }), socket, head);
    expect(socket.write).toHaveBeenCalledTimes(1);
    expect(socket.destroy).toHaveBeenCalledTimes(1);
    expect(socket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      "HTTP/1.1 404 Not Found
      Connection: close
      Content-Type: text/html
      Content-Length: 9

      Not Found"
    `);

    server.emit('upgrade', moxy({ url: '/foo' }), socket, head);
    expect(socket.write).toHaveBeenCalledTimes(2);
    expect(socket.destroy).toHaveBeenCalledTimes(2);
    expect(socket.write.mock.calls[1].args[0]).toMatchInlineSnapshot(`
      "HTTP/1.1 404 Not Found
      Connection: close
      Content-Type: text/html
      Content-Length: 9

      Not Found"
    `);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledTimes(2);
  });

  it('throw if upgrade routes conflict', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          upgradeRoutes: [
            { name: 'root', path: './', handler: moxy() },
            { name: 'foo', path: './foo', handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route [foo] "./foo" is conflicted with route [root] "./""`,
    );
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          upgradeRoutes: [
            { name: 'bar', path: './bar', handler: moxy() },
            { path: './bar/baz', handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route "./bar/baz" is conflicted with route [bar] "./bar""`,
    );
  });

  it('throw if request route is not relative under entryUrl', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          upgradeRoutes: [{ name: 'foo', path: '/foo', handler: moxy() }],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route path should be a relative path"`,
    );
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          upgradeRoutes: [{ name: 'foo', path: '../foo', handler: moxy() }],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"route path should be under entryUrl"`,
    );
  });

  it('throw if mulitple default route received', () => {
    expect(
      () =>
        new HttpConnector({
          entryUrl: 'https://sociably.io',
          upgradeRoutes: [
            { name: 'foo', path: 'foo', handler: moxy() },
            { default: true, handler: moxy() },
            { default: true, handler: moxy() },
          ],
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple default upgrade routes received: "undefined", "undefined""`,
    );
  });
});
