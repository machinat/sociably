import { Children } from 'machinat-shared';
import Machinat from '../../../../machinat';
import * as general from '../general';

const render = jest.fn(node =>
  Children.reduce(
    node,
    (rendered, ele) =>
      rendered.concat(
        typeof ele === 'string'
          ? { rendered: ele, element: ele }
          : { rendered: general[ele.type](ele.props, render), element: ele }
      ),
    []
  )
);

test('shallow elements match snapshot', () => {
  expect(
    [
      <text>abc</text>,
      <a href="https://machinat.world">hello</a>,
      <b>important</b>,
      <i>italic</i>,
      <del>nooooo</del>,
      <br />,
      <code>foo.bar()</code>,
      <pre>foo.bar('hello world')</pre>,
      <img src="http://avatar.my.bot" />,
      <video src="http://vid.my.bot" />,
      <audio src="http://sound.my.bot" />,
      <file src="http://profile.my.bot" />,
    ]
      .map(render)
      .map(r => r[0].rendered)
  ).toMatchSnapshot();
});

test('nested textual elements match snapshot', () => {
  expect(
    [
      <text>
        <code>Hello,</code> <b>Luke Skywalker!</b>
        <br />
        You know what?
        <br />
        <i>
          I'm your <del>FATHER</del> <code>R2D2</code>.
        </i>
        <br />
        <br />
        <a href="https://C3.PO">Check here</a>
        <br />
        <pre>May the force be with you!</pre>
      </text>,
    ]
      .map(render)
      .map(r => r[0].rendered)
  ).toMatchSnapshot();
});
