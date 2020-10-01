import type { MachinatElement } from '@machinat/core/types';
import {
  isElement,
  isFragmentType,
  isProviderType,
  isRawType,
  isThunkType,
  isPauseType,
} from '@machinat/core/utils/isX';

const machinatElementSerializer = {
  print(element: MachinatElement<any, any>, serialize, indent) {
    const type = isFragmentType(element)
      ? 'Machinat.Fragment'
      : isProviderType(element)
      ? 'Machinat.Provider'
      : isRawType(element)
      ? 'Machinat.Raw'
      : isThunkType(element)
      ? 'Machinat.Thunk'
      : isPauseType(element)
      ? 'Machinat.Pause'
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

module.exports = machinatElementSerializer;
