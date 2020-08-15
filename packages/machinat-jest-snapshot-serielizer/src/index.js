import {
  isElement,
  isFragmentType,
  isProviderType,
  isRawType,
  isThunkType,
  isPauseType,
} from '@machinat/core/utils/isX';

module.exports = {
  print(element, serialize, indent) {
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

  test(val) {
    return isElement(val);
  },
};
