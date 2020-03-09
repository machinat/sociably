import Machinat from '@machinat/core';
import map from '@machinat/core/iterator/map';
import generalDelegate from '../general';

const render = async node => {
  const renderings = map(
    node,
    (element, path) =>
      typeof element === 'string'
        ? { type: 'text', value: element, node: element, path }
        : typeof element.type === 'string'
        ? generalDelegate(element, render, path)
        : { value: { non: 'text' }, node: element, path },
    '$'
  );
  return renderings ? [].concat(...(await Promise.all(renderings))) : null;
};

test('shallow textual elements match snapshot', async () => {
  await expect(
    render(
      <>
        <text>abc</text>
        <b>important</b>
        <i>italic</i>
        <del>nooooo</del>
        <br />
        <code>foo.bar()</code>
        <pre>foo.bar('hello world')</pre>
      </>
    )
  ).resolves.toMatchSnapshot();
});

test('nested textual elements match snapshot', async () => {
  const segments = await render(
    <text>
      123{' '}
      <code>
        Hello, <b>Luke Skywalker!</b>
      </code>
      <br />
      You know what?
      <br />
      <i>
        I'm your <del>FATHER</del> <code>droid</code>.
      </i>
      <br />
      <br />
      <pre>May the force be with you!</pre> abc
    </text>
  );
  expect(segments).toMatchSnapshot();
});

test('with break placed in children', async () => {
  const children = (
    <>
      foo
      <br />
      bar
    </>
  );

  const segments = await render([
    <text>{children}</text>,
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ]);
  expect(segments).toMatchSnapshot();
});

test('should throw if non string value rendered', async () => {
  const NonText = () => {};
  const children = (
    <>
      foo
      <NonText />
      bar
    </>
  );

  for (const node of [
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
    <text>{children}</text>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await expect(render(node)).rejects.toThrow(
      '<NonText /> at $::1 is not valid textual content'
    );
  }
});

test('media elements match snapshot', async () => {
  await expect(
    render([
      <img src="http://avatar.my.bot" />,
      <video src="http://vid.my.bot" />,
      <audio src="http://sound.my.bot" />,
      <file src="http://profile.my.bot" />,
    ])
  ).resolves.toMatchSnapshot();
});

test('return null if content is empty', async () => {
  for (const element of [<b />, <i />, <del />, <text />, <code />, <pre />]) {
    // eslint-disable-next-line no-await-in-loop
    await expect(render(element)).resolves.toEqual([null]);
  }
});
