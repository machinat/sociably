/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { compose, joinTextualSegments } from 'machinat-utility';
import {
  mapSegmentValue,
  asMessagesUnitComponent,
  asContainerComponent,
} from './utils';

import { text } from './general';

const LATEX_BEGIN = '\\(';
const LATEX_END = '\\)';

const Latex = compose(
  mapSegmentValue(v =>
    typeof v === 'string' ? LATEX_BEGIN + v + LATEX_END : v
  ),
  text
);
const __Latex = asContainerComponent(Latex);

const DynamicText = ({ props: { children, fallback } }, render) => {
  const segments = joinTextualSegments(render(children, '.children'));

  if (segments === null) {
    return null;
  }

  let textValue;
  invariant(
    segments.length === 1 &&
      typeof (textValue = segments[0].value) === 'string',
    '<br/> is invalid with in children of DynamicText'
  );

  return [
    {
      message: {
        dynamic_text: {
          text: textValue,
          fallback_text: fallback,
        },
      },
    },
  ];
};
const __DynamicText = asMessagesUnitComponent(DynamicText);

export { __Latex as Latex, __DynamicText as DynamicText };
