import context from '../context';

it('provide value provide or default value', async () => {
  await expect(context('foo')('bar')()).resolves.toBe('bar');
  await expect(context('foo')()()).resolves.toBe('foo');
});
