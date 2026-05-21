import invariant from 'invariant';
import { formatNode } from '@sociably/core/utils';
import { makeTextSegment } from '@sociably/core/renderer';

const br = (node, path) => [makeTextSegment(node, path, '\n')];

const transormText = (tag, transformer) => async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  for (const segment of childrenSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(segment.node)} is placed in <${tag}/>`,
      );
    }
  }

  return [makeTextSegment(node, path, transformer(childrenSegments[0].value))];
};

const b = transormText('b', (v) => `<b>${v}</b>`);

const i = transormText('i', (v) => `<i>${v}</i>`);

const s = transormText('s', (v) => `<s>${v}</s>`);

const u = transormText('u', (v) => `<u>${v}</u>`);

const code = transormText('code', (v) => `<code>${v}</code>`);

const pre = transormText('pre', (v) => `<pre>${v}</pre>`);

const generalComponents = {
  b,
  i,
  s,
  u,
  code,
  pre,
  br,
};

const { hasOwnProperty } = Object.prototype;

const generalComponentDelegator = async (element, render, path) => {
  const { type } = element;
  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not a valid general component tag on Telegram platform`,
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default generalComponentDelegator;
