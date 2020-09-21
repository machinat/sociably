/** @internal */ /** */
import invariant from 'invariant';
import formatNode from '@machinat/core/utils/formatNode';
import {
  breakSegment,
  textSegment,
  unitSegment,
} from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import type { TelegramSegmentValue } from '../types';

const p = async (node, path, render) => {
  const childrenSegments = await render(node.props.children);
  if (!childrenSegments) {
    return null;
  }

  const segments: UnitSegment<TelegramSegmentValue>[] = [];

  for (const segment of childrenSegments) {
    if (segment.type === 'text') {
      segments.push({
        type: 'unit',
        value: {
          method: 'sendMessage',
          parameters: {
            text: segment.value,
            parse_mode: 'HTML',
          },
        },
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

const transormText = (transformer) => async (node, path, render) => {
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

const b = transormText((v) => `<b>${v}</b>`);

const i = transormText((v) => `<i>${v}</i>`);

const s = transormText((v) => `<s>${v}</s>`);

const u = transormText((v) => `<u>${v}</u>`);

const code = transormText((v) => `<code>${v}</code>`);

const pre = transormText((v) => `<pre>${v}</pre>`);

const generalMediaFactory = (type, method) => (node, path) => [
  unitSegment(node, path, {
    message: {
      method,
      parameters: {
        [type]: node.props.src,
      },
    },
  }),
];

const img = generalMediaFactory('photo', 'sendPhoto');
const video = generalMediaFactory('video', 'sendVideo');
const audio = generalMediaFactory('audio', 'sendAudio');
const file = generalMediaFactory('document', 'sendDocument');

const generalComponents = {
  p,
  b,
  i,
  s,
  u,
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
