import { Server } from 'http';
import { EventEmitter } from 'events';
import { moxy } from '@moxyjs/moxy';
import { HttpConnector } from '../connector.js';

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

describe('handling requests', () => {
  test('register only root path', () => {
    const handler = moxy();

    const connector = new HttpConnector({
      requestRoutes: [{ path: '/', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function)
    );

    expect(server.on).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));

    const req = moxy({ url: '/' });
    const res = createRes();
    server.emit('request', req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, res, {
      originalPath: '/',
      matchedPath: '/',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('request', fooReq, res);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      matchedPath: '/',
      trailingPath: 'foo',
    });

    expect(res.end).not.toHaveBeenCalled();
  });

  test('register multiple routes', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      requestRoutes: [
        { path: '/foo', handler: fooHandler },
        { path: '/bar', handler: barHandler },
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
      matchedPath: '/foo',
      trailingPath: '',
    });
    expect(barHandler).not.toHaveBeenCalled();

    const barReq = moxy({ url: '/bar' });
    server.emit('request', barReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/bar',
      matchedPath: '/bar',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('request', fooBarReq, res);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(res.end).not.toHaveBeenCalled();

    server.emit('request', moxy({ url: '/' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    res = createRes();
    server.emit('request', moxy({ url: '/baz' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(barHandler).toHaveBeenCalledTimes(1);
  });

  test('register with default route', () => {
    const fooHandler = moxy();
    const defaultHandler = moxy();

    const connector = new HttpConnector({
      requestRoutes: [
        { path: '/foo', handler: fooHandler },
        { default: true, handler: defaultHandler },
      ],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function)
    );

    expect(server.on).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));

    const fooReq = moxy({ url: '/foo' });
    const res = createRes();
    server.emit('request', fooReq, res);

    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(fooHandler).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      matchedPath: '/foo',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('request', fooBarReq, res);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });

    const rootReq = moxy({ url: '/' });
    server.emit('request', rootReq, res);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(defaultHandler).toHaveBeenCalledWith(rootReq, res, {
      originalPath: '/',
      matchedPath: undefined,
      trailingPath: '',
    });

    const barReq = moxy({ url: '/bar' });
    server.emit('request', barReq, res);

    expect(defaultHandler).toHaveBeenCalledTimes(2);
    expect(defaultHandler).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/bar',
      matchedPath: undefined,
      trailingPath: 'bar',
    });

    expect(res.end).not.toHaveBeenCalled();
  });

  test('register with deeper route path', () => {
    const handler = moxy();
    const connector = new HttpConnector({
      requestRoutes: [{ path: '/foo/bar', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.on).toHaveBeenCalledTimes(1);

    const fooBarReq = moxy({ url: '/foo/bar' });
    const res = createRes();
    server.emit('request', fooBarReq, res);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      matchedPath: '/foo/bar',
      trailingPath: '',
    });

    const fooBarBazReq = moxy({ url: '/foo/bar/baz' });
    server.emit('request', fooBarBazReq, res);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooBarBazReq, res, {
      originalPath: '/foo/bar/baz',
      matchedPath: '/foo/bar',
      trailingPath: 'baz',
    });

    server.emit('request', moxy({ url: '/foo' }), res);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);
  });

  test('register no route', () => {
    const connector = new HttpConnector({});

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
          requestRoutes: [
            { name: 'root', path: '/', handler: moxy() },
            { name: 'foo', path: '/foo', handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"request route [foo] "/foo" is conflicted with route [root] "/""`
    );
    expect(
      () =>
        new HttpConnector({
          requestRoutes: [
            { name: 'bar', path: '/bar', handler: moxy() },
            { path: '/bar/baz', handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"request route "/bar/baz" is conflicted with route [bar] "/bar""`
    );
  });

  it('throw if mulitple default route received', () => {
    expect(
      () =>
        new HttpConnector({
          requestRoutes: [
            { name: 'foo', path: '/foo', handler: moxy() },
            { name: 'bar', default: true, handler: moxy() },
            { name: 'baz', default: true, handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple default request routes received: bar, baz"`
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
      upgradeRoutes: [{ path: '/', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen).toHaveBeenCalledTimes(1);
    expect(server.listen).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function)
    );

    expect(server.on).toHaveBeenCalledTimes(2);
    expect(server.on).toHaveBeenCalledWith('request', expect.any(Function));
    expect(server.on).toHaveBeenCalledWith('upgrade', expect.any(Function));

    const req = moxy({ url: '/' });
    server.emit('upgrade', req, socket, head);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, socket, head, {
      originalPath: '/',
      matchedPath: '/',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      matchedPath: '/',
      trailingPath: 'foo',
    });

    expect(socket.write).not.toHaveBeenCalled();
  });

  test('register multiple routes', () => {
    const fooHandler = moxy();
    const barHandler = moxy();

    const connector = new HttpConnector({
      upgradeRoutes: [
        { path: '/foo', handler: fooHandler },
        { path: '/bar', handler: barHandler },
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
      matchedPath: '/foo',
      trailingPath: '',
    });
    expect(barHandler).not.toHaveBeenCalled();

    const barReq = moxy({ url: '/bar' });
    server.emit('upgrade', barReq, socket, head);
    expect(fooHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(barHandler).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/bar',
      matchedPath: '/bar',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });
    expect(barHandler).toHaveBeenCalledTimes(1);
    expect(socket.write).not.toHaveBeenCalled();

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
    expect(barHandler).toHaveBeenCalledTimes(1);
  });

  test('register with default route', () => {
    const fooHandler = moxy();
    const defaultHandler = moxy();

    const connector = new HttpConnector({
      upgradeRoutes: [
        { path: '/foo', handler: fooHandler },
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
      matchedPath: '/foo',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);

    expect(fooHandler).toHaveBeenCalledTimes(2);
    expect(fooHandler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });

    const rootReq = moxy({ url: '/' });
    server.emit('upgrade', rootReq, socket, head);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(defaultHandler).toHaveBeenCalledWith(rootReq, socket, head, {
      originalPath: '/',
      matchedPath: undefined,
      trailingPath: '',
    });

    const barReq = moxy({ url: '/bar' });
    server.emit('upgrade', barReq, socket, head);

    expect(defaultHandler).toHaveBeenCalledTimes(2);
    expect(defaultHandler).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/bar',
      matchedPath: undefined,
      trailingPath: 'bar',
    });

    expect(socket.write).not.toHaveBeenCalled();
  });

  test('register with deeper route path', () => {
    const handler = moxy();
    const connector = new HttpConnector({
      upgradeRoutes: [{ path: '/foo/bar', handler }],
    });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });
    expect(server.listen).toHaveBeenCalledTimes(1);

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      matchedPath: '/foo/bar',
      trailingPath: '',
    });

    const fooBarBazReq = moxy({ url: '/foo/bar/baz' });
    server.emit('upgrade', fooBarBazReq, socket, head);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(fooBarBazReq, socket, head, {
      originalPath: '/foo/bar/baz',
      matchedPath: '/foo/bar',
      trailingPath: 'baz',
    });

    server.emit('upgrade', moxy({ url: '/foo' }), socket, head);
    expect(socket.write).toHaveBeenCalledTimes(1);
    expect(socket.destroy).toHaveBeenCalledTimes(1);
  });

  it('throw if upgrade routes conflict', () => {
    expect(
      () =>
        new HttpConnector({
          upgradeRoutes: [
            { name: 'root', path: '/', handler: moxy() },
            { name: 'foo', path: '/foo', handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"upgrade route [foo] "/foo" is conflicted with route [root] "/""`
    );
    expect(
      () =>
        new HttpConnector({
          upgradeRoutes: [
            { name: 'bar', path: '/bar', handler: moxy() },
            { path: '/bar/baz', handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"upgrade route "/bar/baz" is conflicted with route [bar] "/bar""`
    );
  });

  it('throw if mulitple default route received', () => {
    expect(
      () =>
        new HttpConnector({
          upgradeRoutes: [
            { name: 'foo', path: '/foo', handler: moxy() },
            { default: true, handler: moxy() },
            { default: true, handler: moxy() },
          ],
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple default upgrade routes received: "undefined", "undefined""`
    );
  });
});
