/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { joinTextualSegments } from 'machinat-utility';
import {
  asSingleMessageUnitComponent,
  asContainerComponent,
  mapJoinedTextualValues,
} from './utils';

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';

const Latex = mapJoinedTextualValues(v =>
  typeof v === 'string' ? LATEX_BEGIN + v + LATEX_END : v
);
const __Latex = asContainerComponent(Latex);

const DynamicText = async ({ props: { children, fallback } }, render) => {
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
const __DynamicText = asSingleMessageUnitComponent(DynamicText);

export { __Latex as Latex, __DynamicText as DynamicText };
