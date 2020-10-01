import EventEmitter from 'events';
import moxy from '@moxyjs/moxy';
import { HTTPConnector } from '../connector';

class FakeServer extends EventEmitter {
  // eslint-disable-next-line
  listen(...args) {
    for (let i = args.length - 1; i >= 0; i -= 1) {
      if (typeof args[i] === 'function') args[i]();
    }
  }
}

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
  test('connect with root routing', () => {
    const connector = new HTTPConnector();

    const handler = moxy();
    connector.addRequestRouting({ path: '/', handler });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen.mock).toHaveBeenCalledTimes(1);
    expect(server.listen.mock).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function)
    );

    expect(server.on.mock).toHaveBeenCalledTimes(1);
    expect(server.on.mock).toHaveBeenCalledWith(
      'request',
      expect.any(Function)
    );

    const req = moxy({ url: '/' });
    const res = createRes();
    server.emit('request', req, res);

    expect(handler.mock).toHaveBeenCalledTimes(1);
    expect(handler.mock).toHaveBeenCalledWith(req, res, {
      originalPath: '/',
      matchedPath: '/',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('request', fooReq, res);
    expect(handler.mock).toHaveBeenCalledTimes(2);
    expect(handler.mock).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      matchedPath: '/',
      trailingPath: 'foo',
    });

    expect(res.end.mock).not.toHaveBeenCalled();
  });

  test('connect with multiple routings', () => {
    const connector = new HTTPConnector();

    const fooHandler = moxy();
    const barHandler = moxy();
    connector.addRequestRouting(
      { path: '/foo', handler: fooHandler },
      { path: '/bar', handler: barHandler }
    );

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen.mock).toHaveBeenCalledTimes(1);
    expect(server.on.mock).toHaveBeenCalledTimes(1);

    let res = createRes();

    const fooReq = moxy({ url: '/foo' });
    server.emit('request', fooReq, res);
    expect(fooHandler.mock).toHaveBeenCalledTimes(1);
    expect(fooHandler.mock).toHaveBeenCalledWith(fooReq, res, {
      originalPath: '/foo',
      matchedPath: '/foo',
      trailingPath: '',
    });
    expect(barHandler.mock).not.toHaveBeenCalled();

    const barReq = moxy({ url: '/bar' });
    server.emit('request', barReq, res);
    expect(fooHandler.mock).toHaveBeenCalledTimes(1);
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
    expect(barHandler.mock).toHaveBeenCalledWith(barReq, res, {
      originalPath: '/bar',
      matchedPath: '/bar',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('request', fooBarReq, res);
    expect(fooHandler.mock).toHaveBeenCalledTimes(2);
    expect(fooHandler.mock).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
    expect(res.end.mock).not.toHaveBeenCalled();

    server.emit('request', moxy({ url: '/' }), res);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    res = createRes();
    server.emit('request', moxy({ url: '/baz' }), res);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);

    expect(fooHandler.mock).toHaveBeenCalledTimes(2);
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
  });

  test('connect with deeper routing path', () => {
    const connector = new HTTPConnector();

    const handler = moxy();
    connector.addRequestRouting({ path: '/foo/bar', handler });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen.mock).toHaveBeenCalledTimes(1);
    expect(server.on.mock).toHaveBeenCalledTimes(1);

    const fooBarReq = moxy({ url: '/foo/bar' });
    const res = createRes();
    server.emit('request', fooBarReq, res);
    expect(handler.mock).toHaveBeenCalledTimes(1);
    expect(handler.mock).toHaveBeenCalledWith(fooBarReq, res, {
      originalPath: '/foo/bar',
      matchedPath: '/foo/bar',
      trailingPath: '',
    });

    const fooBarBazReq = moxy({ url: '/foo/bar/baz' });
    server.emit('request', fooBarBazReq, res);
    expect(handler.mock).toHaveBeenCalledTimes(2);
    expect(handler.mock).toHaveBeenCalledWith(fooBarBazReq, res, {
      originalPath: '/foo/bar/baz',
      matchedPath: '/foo/bar',
      trailingPath: 'baz',
    });

    server.emit('request', moxy({ url: '/foo' }), res);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);
  });

  test('connect with no routing registered', () => {
    const connector = new HTTPConnector();

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen.mock).toHaveBeenCalledTimes(1);
    expect(server.on.mock).toHaveBeenCalledTimes(1);

    const res = createRes();
    server.emit('request', moxy({ url: '/' }), res);

    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(403);
  });

  it('throw if routings conflict', () => {
    expect(() =>
      new HTTPConnector().addRequestRouting(
        { name: 'root', path: '/', handler: moxy() },
        { name: 'foo', path: '/foo', handler: moxy() }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"foo routing \\"/foo\\" is conflicted with root routing \\"/\\""`
    );
    expect(() =>
      new HTTPConnector().addRequestRouting(
        { name: 'bar', path: '/bar', handler: moxy() },
        { path: '/bar/baz', handler: moxy() }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"unknown routing \\"/bar/baz\\" is conflicted with bar routing \\"/bar\\""`
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

  test('connect with root routing', () => {
    const connector = new HTTPConnector();

    const handler = moxy();
    connector.addUpgradeRouting({ path: '/', handler });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });

    expect(server.listen.mock).toHaveBeenCalledTimes(1);
    expect(server.listen.mock).toHaveBeenCalledWith(
      { port: 8888 },
      expect.any(Function)
    );

    expect(server.on.mock).toHaveBeenCalledTimes(2);
    expect(server.on.mock).toHaveBeenCalledWith(
      'request',
      expect.any(Function)
    );
    expect(server.on.mock).toHaveBeenCalledWith(
      'upgrade',
      expect.any(Function)
    );

    const req = moxy({ url: '/' });
    server.emit('upgrade', req, socket, head);

    expect(handler.mock).toHaveBeenCalledTimes(1);
    expect(handler.mock).toHaveBeenCalledWith(req, socket, head, {
      originalPath: '/',
      matchedPath: '/',
      trailingPath: '',
    });

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);
    expect(handler.mock).toHaveBeenCalledTimes(2);
    expect(handler.mock).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      matchedPath: '/',
      trailingPath: 'foo',
    });

    expect(socket.write.mock).not.toHaveBeenCalled();
  });

  test('connect with multiple routings', () => {
    const connector = new HTTPConnector();

    const fooHandler = moxy();
    const barHandler = moxy();
    connector.addUpgradeRouting(
      { path: '/foo', handler: fooHandler },
      { path: '/bar', handler: barHandler }
    );

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });
    expect(server.listen.mock).toHaveBeenCalledTimes(1);

    const fooReq = moxy({ url: '/foo' });
    server.emit('upgrade', fooReq, socket, head);
    expect(fooHandler.mock).toHaveBeenCalledTimes(1);
    expect(fooHandler.mock).toHaveBeenCalledWith(fooReq, socket, head, {
      originalPath: '/foo',
      matchedPath: '/foo',
      trailingPath: '',
    });
    expect(barHandler.mock).not.toHaveBeenCalled();

    const barReq = moxy({ url: '/bar' });
    server.emit('upgrade', barReq, socket, head);
    expect(fooHandler.mock).toHaveBeenCalledTimes(1);
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
    expect(barHandler.mock).toHaveBeenCalledWith(barReq, socket, head, {
      originalPath: '/bar',
      matchedPath: '/bar',
      trailingPath: '',
    });

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(fooHandler.mock).toHaveBeenCalledTimes(2);
    expect(fooHandler.mock).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      matchedPath: '/foo',
      trailingPath: 'bar',
    });
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
    expect(socket.write.mock).not.toHaveBeenCalled();

    server.emit('upgrade', moxy({ url: '/' }), socket, head);
    expect(socket.write.mock).toHaveBeenCalledTimes(1);
    expect(socket.destroy.mock).toHaveBeenCalledTimes(1);
    expect(socket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
      "HTTP/1.1 404 Not Found
      Connection: close
      Content-Type: text/html
      Content-Length: 9

      Not Found"
    `);

    server.emit('upgrade', moxy({ url: '/baz' }), socket, head);
    expect(socket.write.mock).toHaveBeenCalledTimes(2);
    expect(socket.destroy.mock).toHaveBeenCalledTimes(2);

    expect(fooHandler.mock).toHaveBeenCalledTimes(2);
    expect(barHandler.mock).toHaveBeenCalledTimes(1);
  });

  test('connect with deeper routing path', () => {
    const connector = new HTTPConnector();

    const handler = moxy();
    connector.addUpgradeRouting({ path: '/foo/bar', handler });

    const server = moxy(new FakeServer());
    connector.connect(server, { port: 8888 });
    expect(server.listen.mock).toHaveBeenCalledTimes(1);

    const fooBarReq = moxy({ url: '/foo/bar' });
    server.emit('upgrade', fooBarReq, socket, head);
    expect(handler.mock).toHaveBeenCalledTimes(1);
    expect(handler.mock).toHaveBeenCalledWith(fooBarReq, socket, head, {
      originalPath: '/foo/bar',
      matchedPath: '/foo/bar',
      trailingPath: '',
    });

    const fooBarBazReq = moxy({ url: '/foo/bar/baz' });
    server.emit('upgrade', fooBarBazReq, socket, head);
    expect(handler.mock).toHaveBeenCalledTimes(2);
    expect(handler.mock).toHaveBeenCalledWith(fooBarBazReq, socket, head, {
      originalPath: '/foo/bar/baz',
      matchedPath: '/foo/bar',
      trailingPath: 'baz',
    });

    server.emit('upgrade', moxy({ url: '/foo' }), socket, head);
    expect(socket.write.mock).toHaveBeenCalledTimes(1);
    expect(socket.destroy.mock).toHaveBeenCalledTimes(1);
  });

  it('throw if routings conflict', () => {
    expect(() =>
      new HTTPConnector().addUpgradeRouting(
        { name: 'root', path: '/', handler: moxy() },
        { name: 'foo', path: '/foo', handler: moxy() }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"foo routing \\"/foo\\" is conflicted with root routing \\"/\\""`
    );
    expect(() =>
      new HTTPConnector().addUpgradeRouting(
        { name: 'bar', path: '/bar', handler: moxy() },
        { path: '/bar/baz', handler: moxy() }
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"unknown routing \\"/bar/baz\\" is conflicted with bar routing \\"/bar\\""`
    );
  });
});
