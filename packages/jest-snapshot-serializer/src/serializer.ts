const sociablyElementSerializer = {
  print(
    element: {
      type?: symbol | ((...args: never[]) => unknown) | Record<string, unknown>;
    },
    serialize: (value: unknown, indentation: unknown) => string,
    indent: unknown,
  ) {
    const type =
      element.type === Symbol.for('fragment.element.sociably')
        ? 'Sociably.Fragment'
        : element.type === Symbol.for('provider.element.sociably')
        ? 'Sociably.Provider'
        : element.type === Symbol.for('raw.element.sociably')
        ? 'Sociably.Raw'
        : element.type === Symbol.for('thunk.element.sociably')
        ? 'Sociably.Thunk'
        : element.type === Symbol.for('pause.element.sociably')
        ? 'Sociably.Pause'
        : typeof element.type === 'function'
        ? element.type.name || element.type
        : typeof element.type === 'symbol'
        ? element.type.toString()
        : typeof element.type === 'object'
        ? element.type.$$name || element.type.name || element.type
        : element.type;

    return serialize(
      {
        ...element,
        type,
        $$typeof: Symbol.for('react.element'),
      },
      indent,
    );
  },

  test(val: { $$typeof: symbol }): boolean {
    return (
      typeof val === 'object' &&
      val !== null &&
      val.$$typeof === Symbol.for('element.type.sociably')
    );
  },
};

export default sociablyElementSerializer;
