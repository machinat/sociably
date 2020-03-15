import formatNode from '@machinat/core/utils/formatNode';
import { unitSegment, textSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';
export const Latex = async (node, path, render) => {
  const segments = await render(node.props.children, '.children');
  if (segments === null) {
    return null;
  }

  for (const segment of segments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  return [
    textSegment(node, path, LATEX_BEGIN),
    segments[0],
    textSegment(node, path, LATEX_END),
  ];
};
annotateMessengerComponent(Latex);

export const DynamicText = async (node, path, render) => {
  const { children, fallback } = node.props;
  const segments = await render(children, '.children');
  if (segments === null) {
    return null;
  }

  for (const segment of segments) {
    if (segment.type !== 'text') {
      throw new TypeError(
        `non-textual node ${formatNode(
          segment.node
        )} received, only textual nodes allowed`
      );
    }
  }

  return [
    unitSegment(node, path, {
      message: {
        dynamic_text: {
          text: segments[0].value,
          fallback_text: fallback,
        },
      },
    }),
  ];
};
annotateMessengerComponent(DynamicText);
