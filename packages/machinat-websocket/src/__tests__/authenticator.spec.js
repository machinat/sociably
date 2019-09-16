import moxy from 'moxy';
import { allowDefaultAnonymously, allowAllAnonymously } from '../authenticator';

const pass = moxy(async () => ({
  accepted: false,
  reason: "it's the end!",
}));

const request = {
  url: '/foo',
  method: 'GET',
  headers: {},
};

beforeEach(() => {
  pass.mock.reset();
});

describe('allowDefaultAnonymously()', () => {
  it('accept with empty user when "default" type met', async () => {
    await expect(
      allowDefaultAnonymously(pass)({ type: 'default', foo: 'bar' }, request)
    ).resolves.toEqual({
      accepted: true,
      user: null,
      tags: null,
    });

    expect(pass.mock).not.toHaveBeenCalled();
  });

  it('resolve null if non "default" type met', async () => {
    await expect(
      allowDefaultAnonymously(pass)({ type: 'some_auth', foo: 'bar' }, request)
    ).resolves.toEqual({
      accepted: false,
      reason: "it's the end!",
    });

    expect(pass.mock).toHaveBeenCalledTimes(1);
    expect(pass.mock).toHaveBeenCalledWith(
      { type: 'some_auth', foo: 'bar' },
      request
    );
  });
});

describe('allowAllAnonymously()', () => {
  it('accept anyway', async () => {
    await expect(
      allowAllAnonymously(pass)({ type: 'default', foo: 'bar' }, request)
    ).resolves.toEqual({
      accepted: true,
      user: null,
      tags: null,
    });

    await expect(
      allowAllAnonymously(pass)({ type: 'some_auth', foo: 'bar' }, request)
    ).resolves.toEqual({
      accepted: true,
      user: null,
      tags: null,
    });

    expect(pass.mock).not.toHaveBeenCalled();
  });
});
