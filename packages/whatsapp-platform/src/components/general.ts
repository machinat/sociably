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

const b = transormText('b', (v) => `*${v}*`);

const i = transormText('i', (v) => `_${v}_`);

const s = transormText('s', (v) => `~${v}~`);

const u = transormText('u', (v) => v);

const code = transormText('code', (v) => `\`\`\`${v}\`\`\``);

const pre = transormText('pre', (v) => `\`\`\`\n${v}\n\`\`\``);

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
    `"${type}" is not valid general component tag on WhatsApp platform`,
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default generalComponentDelegator;
