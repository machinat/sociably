import {
  isElement,
  isFragmentElement,
  isProviderElement,
  isRawElement,
  isThunkElement,
  isPauseElement,
} from '@machinat/core/utils/isX';

module.exports = {
  print(element, serialize, indent) {
    const type = isFragmentElement(element)
      ? 'Machinat.Fragment'
      : isProviderElement(element)
      ? 'Machinat.Provider'
      : isRawElement(element)
      ? 'Machinat.Raw'
      : isThunkElement(element)
      ? 'Machinat.Thunk'
      : isPauseElement(element)
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
