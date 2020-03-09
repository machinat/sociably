import invariant from 'invariant';
import joinTextualSegments from '@machinat/core/utils/joinTextualSegments';
import { annotateNativeComponent } from '@machinat/core/renderer';
import { MESSENGER } from '../constant';
import { asUnitComponent, mapJoinedTextValues } from '../utils';

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';
const Latex = mapJoinedTextValues(v => LATEX_BEGIN + v + LATEX_END);
const __Latex = annotateNativeComponent(MESSENGER)(Latex);

const DynamicText = async ({ children, fallback }, render) => {
  const segments = await render(children, '.children');
  if (segments === null) {
    return null;
  }

  const joined = joinTextualSegments(segments);

  let textValue;
  invariant(
    joined.length === 1 && typeof (textValue = joined[0].value) === 'string',
    '<br/> is invalid with in children of DynamicText'
  );

  return {
    message: {
      dynamic_text: {
        text: textValue,
        fallback_text: fallback,
      },
    },
  };
};
const __DynamicText = asUnitComponent(DynamicText);

export { __Latex as Latex, __DynamicText as DynamicText };
