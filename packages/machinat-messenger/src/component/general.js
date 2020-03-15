import invariant from 'invariant';
import formatNode from '@machinat/core/utils/formatNode';
import {
  breakSegment,
  textSegment,
  unitSegment,
} from '@machinat/core/renderer';

const text = async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  const segments = [];
  for (const segment of childrenSegments) {
    if (segment.type === 'text') {
      segments.push({
        type: 'unit',
        value: { message: { text: segment.value } },
        node,
        path,
      });
    } else if (segment.type !== 'break') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes and <br/> allowed`
      );
    }
  }

  return segments;
};

const br = (node, path) => [breakSegment(node, path)];

const transormText = transformer => async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  for (const segment of childrenSegments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  return [textSegment(node, path, transformer(childrenSegments[0].value))];
};

const B = '*';
const b = transormText(v => B + v + B);

const I = '_';
const i = transormText(v => I + v + I);

const DEL = '~';
const del = transormText(v => DEL + v + DEL);

const CODE = '`';
const code = transormText(v => CODE + v + CODE);

const PRE_BEGIN = '```\n';
const PRE_END = '\n```';
const pre = transormText(v => PRE_BEGIN + v + PRE_END);

const generalMediaFactory = (tag, type) => {
  const box = {
    [tag]: (node, path) => [
      unitSegment(node, path, {
        message: {
          attachment: {
            type,
            payload: {
              url: node.props.src,
            },
          },
        },
      }),
    ],
  };

  return box[tag];
};

const img = generalMediaFactory('img', 'image');
const video = generalMediaFactory('video', 'video');
const audio = generalMediaFactory('audio', 'audio');
const file = generalMediaFactory('file', 'file');

const generalComponents = {
  text,
  b,
  i,
  del,
  code,
  pre,
  br,
  img,
  video,
  audio,
  file,
};

const { hasOwnProperty } = Object.prototype;

const generalComponentDelegator = async (element, render, path) => {
  const { type } = element;
  invariant(
    hasOwnProperty.call(generalComponents, type),
    `"${type}" is not valid general component tag on messenger`
  );

  const segments = await generalComponents[type](element, render, path);
  return segments;
};

export default generalComponentDelegator;
