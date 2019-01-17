/* eslint-disable import/prefer-default-export */
import {
  annotate,
  asNative,
  asUnit,
  valuesOfAssertedType,
} from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

import * as _actionModule from './action';

const actionComponents = Object.values(_actionModule);
const renderActionValues = valuesOfAssertedType(...actionComponents);

export const QuickReply = ({ imageURL, action }, render) => {
  const actionValues = renderActionValues(action, render, 'action');

  return [
    {
      type: 'action',
      imageUrl: imageURL,
      action: actionValues && actionValues[0],
    },
  ];
};

annotate(asNative(LINE_NAITVE_TYPE), asUnit(false))(QuickReply);
