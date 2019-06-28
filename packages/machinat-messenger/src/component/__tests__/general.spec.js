import { map } from 'machinat-utility';
import Machinat from 'machinat';
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
  const segments = await render([
    <text>abc</text>,
    <a href="https://machinat.world">hello</a>,
    <b>important</b>,
    <i>italic</i>,
    <del>nooooo</del>,
    <br />,
    <code>foo.bar()</code>,
    <pre>foo.bar('hello world')</pre>,
  ]);
  expect(segments).toMatchSnapshot();

  expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
Array [
  "abc",
  "hello",
  Symbol(machinat.segment.break),
  "https://machinat.world",
  Symbol(machinat.segment.break),
  "*important*",
  "_italic_",
  "~nooooo~",
  Symbol(machinat.segment.break),
  "\`foo.bar()\`",
  "\`\`\`
foo.bar('hello world')
\`\`\`",
]
`);
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
      <a href="https://C3.PO">Check here</a>
      <pre>May the force be with you!</pre> abc
    </text>
  );
  expect(segments).toMatchSnapshot();

  expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
Array [
  "123 \`Hello, *Luke Skywalker!*\`",
  Symbol(machinat.segment.break),
  "You know what?",
  Symbol(machinat.segment.break),
  "_I'm your ~FATHER~ \`droid\`._",
  Symbol(machinat.segment.break),
  Symbol(machinat.segment.break),
  "Check here",
  Symbol(machinat.segment.break),
  "https://C3.PO",
  Symbol(machinat.segment.break),
  "\`\`\`
May the force be with you!
\`\`\` abc",
]
`);
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
    <a href="https://machinat.world">{children}</a>,
    <b>{children}</b>,
    <i>{children}</i>,
    <del>{children}</del>,
    <code>{children}</code>,
    <pre>{children}</pre>,
  ]);
  expect(segments).toMatchSnapshot();

  expect(segments.map(r => r.value)).toMatchInlineSnapshot(`
Array [
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  "foo",
  Symbol(machinat.segment.break),
  "bar",
  Symbol(machinat.segment.break),
  "https://machinat.world",
  Symbol(machinat.segment.break),
  "*foo*",
  Symbol(machinat.segment.break),
  "*bar*",
  "_foo_",
  Symbol(machinat.segment.break),
  "_bar_",
  "~foo~",
  Symbol(machinat.segment.break),
  "~bar~",
  "\`foo\`",
  Symbol(machinat.segment.break),
  "\`bar\`",
  "\`\`\`
foo
\`\`\`",
  Symbol(machinat.segment.break),
  "\`\`\`
bar
\`\`\`",
]
`);
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
    <a src="...">{children}</a>,
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

test('should return null if content is empty', async () => {
  for (const node of [
    <a src="..." />,
    <b />,
    <i />,
    <del />,
    <text />,
    <code />,
    <pre />,
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await expect(render(node)).resolves.toEqual([null]);
  }
});
