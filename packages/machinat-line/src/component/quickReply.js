/* eslint-disable import/prefer-default-export */
import { valuesOfAssertedTypes } from 'machinat-utility';

import { asPartComponent } from '../utils';

import * as actionModule from './action';

const getActionValues = valuesOfAssertedTypes(() => [
  ...Object.values(actionModule),
]);

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
