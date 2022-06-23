import type { SociablyElement } from '@sociably/core';
import {
  isElement,
  isFragmentType,
  isProviderType,
  isRawType,
  isThunkType,
  isPauseType,
} from '@sociably/core/utils';

const sociablyElementSerializer = {
  print(element: SociablyElement<any, any>, serialize, indent) {
    const type = isFragmentType(element)
      ? 'Sociably.Fragment'
      : isProviderType(element)
      ? 'Sociably.Provider'
      : isRawType(element)
      ? 'Sociably.Raw'
      : isThunkType(element)
      ? 'Sociably.Thunk'
      : isPauseType(element)
      ? 'Sociably.Pause'
      : element.type;

    return serialize(
      {
        ...element,
        type,
        $$typeof: Symbol.for('react.element'),
      },
      indent
    );
  },

  test(val: unknown) {
    return isElement(val);
  },
};

module.exports = sociablyElementSerializer;
