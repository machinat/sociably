/* eslint-disable import/prefer-default-export */
import { valuesOfAssertedType } from 'machinat-utility';

import { asPartComponent } from '../utils';

import * as _actionModule from './action';

const actionComponents = Object.values(_actionModule);
const getActionValues = valuesOfAssertedType(...actionComponents);

const QuickReply = async ({ props: { imageURL, action } }, render) => {
  const actionSegments = await render(action, '.action');
  const actionValues = getActionValues(actionSegments);

  return {
    type: 'action',
    imageUrl: imageURL,
    action: actionValues && actionValues[0],
  };
};

const __QuickReply = asPartComponent(QuickReply);

export { __QuickReply as QuickReply };
